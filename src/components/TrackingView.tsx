import React, { useState, useMemo, useEffect } from 'react';
import { 
  MedicalEquipment, 
  StatusLog, 
  DepartmentMaster, 
  CampusMaster, 
  BuildingMaster, 
  LocationRoomMaster,
  AuthUser 
} from '../types';
import { 
  TrajectoryEvent, 
  generateFullTrajectoryEvents, 
  calculateSpatialMigrationStats 
} from '../utils/trajectoryData';
import { SingleDeviceTrajectoryModal } from './trajectory/SingleDeviceTrajectoryModal';
import { TrajectoryAuditReportModal } from './trajectory/TrajectoryAuditReportModal';
import { Pagination } from './Pagination';
import { 
  Activity, 
  MapPin, 
  Boxes, 
  ShieldCheck, 
  Wrench, 
  FileCheck, 
  FileText, 
  Clock, 
  Search, 
  Filter, 
  RefreshCw, 
  Printer, 
  AlertTriangle, 
  Building2, 
  ChevronRight, 
  ExternalLink, 
  Sparkles, 
  Layers, 
  Eye, 
  ArrowRight,
  TrendingUp,
  SlidersHorizontal,
  FileSignature
} from 'lucide-react';

interface TrackingViewProps {
  equipmentList: MedicalEquipment[];
  onOpenStatusChange: (device: MedicalEquipment) => void;
  departments?: DepartmentMaster[];
  campuses?: CampusMaster[];
  buildings?: BuildingMaster[];
  rooms?: LocationRoomMaster[];
  currentUser?: AuthUser | null;
  onViewDeviceDetail?: (device: MedicalEquipment) => void;
  onNavigateToApprovals?: (data: any) => void;
}

export const TrackingView: React.FC<TrackingViewProps> = ({
  equipmentList,
  onOpenStatusChange,
  departments,
  currentUser,
  onViewDeviceDetail,
  onNavigateToApprovals
}) => {
  // 1. 核心视图工作台模式: 'stream' | 'single_device' | 'heatmap' | 'audit_export'
  const [activeTab, setActiveTab] = useState<'stream' | 'single_device' | 'heatmap' | 'audit_export'>('stream');

  // 2. 轨迹事件聚合与指标计算
  const [refreshSeed, setRefreshSeed] = useState(0);
  const events = useMemo(() => {
    // refreshSeed used to trigger recalculation when user clicks refresh
    if (refreshSeed >= 0) {
      return generateFullTrajectoryEvents(equipmentList);
    }
    return [];
  }, [equipmentList, refreshSeed]);

  const stats = useMemo(() => {
    return calculateSpatialMigrationStats(equipmentList);
  }, [equipmentList, refreshSeed]);

  // 3. 模态框状态
  const [selectedEquipmentForModal, setSelectedEquipmentForModal] = useState<MedicalEquipment | null>(null);
  const [isSingleDeviceModalOpen, setIsSingleDeviceModalOpen] = useState(false);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);

  // 4. 筛选与检索状态
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedEventType, setSelectedEventType] = useState<string>('all');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [onlyOverstay, setOnlyOverstay] = useState(false);

  // 分页状态
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchKeyword, selectedEventType, selectedDepartment, onlyOverstay, activeTab]);

  // 5. 过滤后的事件流
  const filteredEvents = useMemo(() => {
    return events.filter(ev => {
      // 关键字搜索
      if (searchKeyword.trim()) {
        const kw = searchKeyword.toLowerCase();
        const matches = 
          ev.equipmentName.toLowerCase().includes(kw) ||
          ev.equipmentSn.toLowerCase().includes(kw) ||
          ev.internalNo.toLowerCase().includes(kw) ||
          ev.operator.toLowerCase().includes(kw) ||
          ev.details.toLowerCase().includes(kw) ||
          (ev.voucherNo && ev.voucherNo.toLowerCase().includes(kw)) ||
          (ev.fromDepartment && ev.fromDepartment.toLowerCase().includes(kw)) ||
          (ev.toDepartment && ev.toDepartment.toLowerCase().includes(kw));
        if (!matches) return false;
      }

      // 变动类型筛选
      if (selectedEventType !== 'all' && ev.eventType !== selectedEventType) {
        return false;
      }

      // 科室筛选
      if (selectedDepartment !== 'all') {
        const matchDept = ev.department === selectedDepartment || 
                          ev.fromDepartment === selectedDepartment || 
                          ev.toDepartment === selectedDepartment;
        if (!matchDept) return false;
      }

      return true;
    });
  }, [events, searchKeyword, selectedEventType, selectedDepartment]);

  const paginatedEvents = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredEvents.slice(start, start + pageSize);
  }, [filteredEvents, currentPage, pageSize]);

  // 可选科室清单
  const uniqueDepartments = useMemo(() => {
    const set = new Set<string>();
    events.forEach(e => {
      if (e.department) set.add(e.department);
      if (e.fromDepartment) set.add(e.fromDepartment);
      if (e.toDepartment) set.add(e.toDepartment);
    });
    return Array.from(set);
  }, [events]);

  const getEventBadge = (type: TrajectoryEvent['eventType']) => {
    switch (type) {
      case 'spatial_relocation':
        return { label: '空间迁徙/搬迁', bg: 'bg-indigo-50 text-indigo-700 border-indigo-200', icon: MapPin };
      case 'emergency_loan':
        return { label: '急救跨科借调', bg: 'bg-amber-50 text-amber-700 border-amber-200', icon: Boxes };
      case 'metrology_verification':
        return { label: '法定强检定标', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: ShieldCheck };
      case 'factory_repair':
        return { label: '外协/返厂大修', bg: 'bg-purple-50 text-purple-700 border-purple-200', icon: Wrench };
      case 'initial_commissioning':
        return { label: '验收入库投运', bg: 'bg-blue-50 text-blue-700 border-blue-200', icon: FileCheck };
      default:
        return { label: '状态变动演更', bg: 'bg-slate-100 text-slate-700 border-slate-200', icon: Activity };
    }
  };

  const handleOpenDeviceTrajectory = (device?: MedicalEquipment) => {
    if (device) {
      setSelectedEquipmentForModal(device);
      setIsSingleDeviceModalOpen(true);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 flex-1 min-h-0 flex flex-col overflow-hidden shadow-xs">
      
      {/* Top Header & Overview */}
      <div className="p-4 border-b border-slate-200 bg-white flex flex-col lg:flex-row lg:items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold shadow-xs shrink-0">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900">
                全生命周期设备时空流转与变动档案轨迹追踪
              </h2>
              <span className="px-2 py-0.5 rounded text-2xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                三甲评审合规凭单体系
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">
              贯穿验收入库、空间物理迁徙、急救跨科周转、法定强检与状态更迭的全息数字档案
            </p>
          </div>
        </div>

        {/* Global Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setRefreshSeed(s => s + 1)}
            className="p-2 text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition"
            title="刷新时空轨迹数据"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={() => setIsAuditModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition shadow-2xs"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            <span>三甲合规审计册</span>
          </button>

          {equipmentList.length > 0 && (
            <button
              onClick={() => onOpenStatusChange(equipmentList[0])}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition shadow-xs"
            >
              <Activity className="w-3.5 h-3.5" />
              <span>登记状态更迭</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Overview Strip */}
      <div className="px-4 py-3 bg-slate-50/80 border-b border-slate-200 grid grid-cols-2 sm:grid-cols-5 gap-3 shrink-0">
        <div className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-2xs">
          <div className="text-2xs text-slate-400 font-bold uppercase flex items-center gap-1">
            <Activity className="w-3.5 h-3.5 text-blue-500" />
            全院流转事件总数
          </div>
          <div className="text-lg font-black text-slate-900 mt-0.5">
            {stats.totalEvents} <span className="text-xs font-normal text-slate-500">条</span>
          </div>
        </div>

        <div className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-2xs">
          <div className="text-2xs text-indigo-600 font-bold uppercase flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-indigo-500" />
            空间物理迁徙/位移
          </div>
          <div className="text-lg font-black text-indigo-700 mt-0.5">
            {stats.spatialRelocationsCount} <span className="text-xs font-normal text-slate-500">次</span>
          </div>
        </div>

        <div className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-2xs">
          <div className="text-2xs text-amber-600 font-bold uppercase flex items-center gap-1">
            <Boxes className="w-3.5 h-3.5 text-amber-500" />
            急救跨科借调流水
          </div>
          <div className="text-lg font-black text-amber-700 mt-0.5">
            {stats.emergencyLoansCount} <span className="text-xs font-normal text-slate-500">台次</span>
          </div>
        </div>

        <div className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-2xs">
          <div className="text-2xs text-emerald-600 font-bold uppercase flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            法定计量强检记录
          </div>
          <div className="text-lg font-black text-emerald-700 mt-0.5">
            {stats.metrologyCount} <span className="text-xs font-normal text-slate-500">台次</span>
          </div>
        </div>

        <div className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-2xs">
          <div className="text-2xs text-rose-600 font-bold uppercase flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
            借用滞留超期预警
          </div>
          <div className="text-lg font-black text-rose-700 mt-0.5">
            {stats.activeLoanOverstayCount} <span className="text-xs font-normal text-slate-500">台</span>
          </div>
        </div>
      </div>

      {/* Track Tabs Bar */}
      <div className="px-4 py-2 border-b border-slate-200 bg-white flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg">
          <button
            onClick={() => setActiveTab('stream')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'stream'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>实时时空变动流</span>
            <span className="px-1.5 py-0.2 rounded-full text-2xs bg-slate-100 text-slate-600">
              {filteredEvents.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('single_device')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'single_device'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>一机一档穿透视图</span>
          </button>

          <button
            onClick={() => setActiveTab('heatmap')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'heatmap'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>空间迁徙流向与拓扑</span>
          </button>

          <button
            onClick={() => setActiveTab('audit_export')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'audit_export'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileSignature className="w-3.5 h-3.5" />
            <span>三甲评审合规审计</span>
          </button>
        </div>

        {/* Filter Bar for Stream */}
        {activeTab === 'stream' && (
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <input
                type="text"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                placeholder="搜索设备、SN、经办人、单号..."
                className="pl-7 pr-2.5 py-1 bg-slate-50 border border-slate-200 rounded-md text-xs font-medium w-48 text-slate-800 focus:bg-white focus:ring-1 focus:ring-blue-500 outline-none"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-2" />
            </div>

            <select
              value={selectedEventType}
              onChange={(e) => setSelectedEventType(e.target.value)}
              className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-md text-xs font-medium text-slate-700 outline-none"
            >
              <option value="all">全部变动类别</option>
              <option value="spatial_relocation">空间物理迁徙</option>
              <option value="emergency_loan">急救跨科借调</option>
              <option value="metrology_verification">法定强检定标</option>
              <option value="factory_repair">外协返厂维修</option>
              <option value="status_transition">状态运行演更</option>
              <option value="initial_commissioning">验收入库投运</option>
            </select>

            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-md text-xs font-medium text-slate-700 outline-none max-w-[150px]"
            >
              <option value="all">全部流转科室</option>
              {uniqueDepartments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Main Workspace Body */}
      <div className="flex-1 min-h-0 overflow-y-auto bg-slate-50/50 p-4 sm:p-6">
        
        {/* ==================== TRACK 1: Real-time Activity Stream ==================== */}
        {activeTab === 'stream' && (
          <div className="max-w-4xl mx-auto space-y-4">
            <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-widest">
              <span>全院设备生命周期轨迹流水 ({filteredEvents.length} 条记录)</span>
              <span>第 {currentPage} / {Math.ceil(filteredEvents.length / pageSize) || 1} 页</span>
            </div>

            {paginatedEvents.length === 0 ? (
              <div className="bg-white p-12 text-center rounded-xl border border-slate-200 text-slate-400">
                <Activity className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                <p>未查询到匹配的时空变动记录</p>
              </div>
            ) : (
              <div className="relative border-l-2 border-slate-200 pl-6 ml-3 space-y-4 py-1">
                {paginatedEvents.map((ev) => {
                  const badge = getEventBadge(ev.eventType);
                  const Icon = badge.icon;

                  return (
                    <div 
                      key={ev.id} 
                      className="relative bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:border-blue-300 hover:shadow-xs transition space-y-2.5"
                    >
                      {/* Timeline Dot */}
                      <div className="absolute -left-[31px] top-4 w-4 h-4 rounded-full bg-blue-600 border-2 border-white ring-2 ring-blue-100 flex items-center justify-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
                      </div>

                      {/* Top Header */}
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-2xs font-bold border ${badge.bg}`}>
                            <Icon className="w-3 h-3" />
                            {badge.label}
                          </span>
                          <span className="font-bold text-slate-900 text-sm">{ev.equipmentName}</span>
                          <span className="font-mono text-2xs font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                            {ev.internalNo}
                          </span>
                          <span className="font-mono text-xs text-slate-400">[{ev.equipmentSn}]</span>
                        </div>

                        <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>{ev.timestamp}</span>
                        </div>
                      </div>

                      {/* Event Title & Movement Route */}
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-xs font-bold text-slate-800">{ev.eventTitle}</span>

                        {(ev.fromLocation || ev.toLocation || ev.fromDepartment || ev.toDepartment) && (
                          <div className="flex items-center gap-1.5 text-xs">
                            <span className="text-slate-400">流向:</span>
                            <span className="font-medium text-slate-700 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                              {ev.fromLocation || ev.fromDepartment || '原在册点'}
                            </span>
                            <span className="text-blue-500 font-bold">➔</span>
                            <span className="font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                              {ev.toLocation || ev.toDepartment || '目标点'}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Details Description */}
                      <p className="text-xs text-slate-600 leading-relaxed font-normal bg-slate-50/50 p-2.5 rounded-lg border border-slate-100">
                        {ev.details}
                      </p>

                      {/* Bottom Footer Info */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-2xs text-slate-500">
                        <div className="flex items-center gap-3">
                          <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-700 font-medium">
                            经办人: <strong className="text-slate-800">{ev.operator}</strong> ({ev.operatorRole})
                          </span>

                          {ev.voucherNo && (
                            <span className="font-mono text-slate-600 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                              {ev.voucherType || '单据号'}: <strong>{ev.voucherNo}</strong>
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          {ev.caSignatureHash && (
                            <span className="font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
                              <ShieldCheck className="w-3 h-3 text-emerald-600" />
                              {ev.caSignatureHash}
                            </span>
                          )}

                          {ev.equipmentOriginal && (
                            <button
                              onClick={() => handleOpenDeviceTrajectory(ev.equipmentOriginal)}
                              className="text-blue-600 hover:text-blue-800 font-bold underline decoration-blue-300 underline-offset-2 flex items-center gap-0.5"
                            >
                              <span>查看该机一机一档</span>
                              <ChevronRight className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ==================== TRACK 2: Single Device Holographic Search & Dossier ==================== */}
        {activeTab === 'single_device' && (
          <div className="max-w-4xl mx-auto space-y-5">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">一机一档 · 全生命周期时空流转穿透检索</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    从全院台账中点选任意设备，秒级穿透该机从采购验收、历次挪移、跨科调配至报废的完整时空拓扑
                  </p>
                </div>
              </div>

              {/* Equipment Grid for Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
                {equipmentList.slice(0, 9).map(eq => (
                  <div
                    key={eq.id}
                    onClick={() => handleOpenDeviceTrajectory(eq)}
                    className="p-3.5 bg-slate-50 hover:bg-blue-50/50 rounded-xl border border-slate-200 hover:border-blue-300 cursor-pointer transition shadow-2xs space-y-2 group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-2xs font-bold text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                        {eq.internalNo || eq.id}
                      </span>
                      <span className={`text-2xs font-bold px-1.5 py-0.2 rounded ${
                        eq.status === '正常运行' ? 'bg-emerald-100 text-emerald-700' :
                        eq.status === '维护保养中' ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'
                      }`}>
                        {eq.status}
                      </span>
                    </div>

                    <div>
                      <div className="text-xs font-bold text-slate-900 group-hover:text-blue-700 transition">
                        {eq.name}
                      </div>
                      <div className="text-2xs text-slate-500 mt-0.5 font-medium">
                        型号: {eq.model || '标准型'} | 科室: {eq.department}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-2xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        <span className="truncate max-w-[120px]">{eq.location || '在册位置'}</span>
                      </span>
                      <span className="text-blue-600 font-semibold group-hover:underline flex items-center gap-0.5">
                        穿透档案 <ChevronRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ==================== TRACK 3: Spatial Flows & Cross-dept Heatmap ==================== */}
        {activeTab === 'heatmap' && (
          <div className="max-w-5xl mx-auto space-y-5">
            {/* Top Flow Matrix */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    全院重点科室间流转频次矩阵与跨科调配流向 (Top Department Flows)
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    基于应急借调单、急救抢救绿色通道随行转运与设备调拨记录绘制
                  </p>
                </div>
                <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200">
                  共计检测到 {stats.departmentFlowMatrix.length} 条科室流向链条
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {stats.departmentFlowMatrix.map((flow, idx) => (
                  <div key={idx} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/90 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-2xs font-bold text-slate-400 uppercase">流向链 #{idx + 1}</span>
                      <span className="text-xs font-black text-blue-700 bg-blue-100/70 px-2 py-0.5 rounded-full">
                        {flow.count} 次流转
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-bold text-slate-800 bg-white px-2 py-1 rounded border border-slate-200 shadow-2xs">
                        {flow.from}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                      <span className="font-bold text-blue-700 bg-blue-50 px-2 py-1 rounded border border-blue-200 shadow-2xs">
                        {flow.to}
                      </span>
                    </div>

                    <div className="text-2xs text-slate-500 pt-1 border-t border-slate-200">
                      涉案机具举例: <strong className="text-slate-700">{flow.equipmentNames.join('、') || '急救机具'}</strong>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* High-mobility devices table */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    高频时空流动机具监控清单 (High Mobility Fleet)
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    监测跨科周转频次高的除颤监护仪、无创呼吸机、注射泵与微量泵运行热度
                  </p>
                </div>
              </div>

              <div className="border border-slate-200 rounded-lg overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b border-slate-200 text-2xs text-slate-500 font-semibold uppercase">
                    <tr>
                      <th className="py-2.5 px-3">设备自编号 / 名称</th>
                      <th className="py-2.5 px-3">型号</th>
                      <th className="py-2.5 px-3">产权科室</th>
                      <th className="py-2.5 px-3">当前在册/借用位置</th>
                      <th className="py-2.5 px-3 text-center">累计流转频次</th>
                      <th className="py-2.5 px-3">最近变动时间</th>
                      <th className="py-2.5 px-3 text-right">穿透操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {stats.highMobilityEquipment.map(item => {
                      const fullEq = equipmentList.find(e => e.id === item.id);

                      return (
                        <tr key={item.id} className="hover:bg-slate-50/80">
                          <td className="py-2.5 px-3">
                            <div className="font-bold text-slate-900">{item.name}</div>
                            <div className="font-mono text-2xs text-slate-400">{item.id}</div>
                          </td>
                          <td className="py-2.5 px-3 text-slate-600">{item.model}</td>
                          <td className="py-2.5 px-3 font-semibold text-slate-700">{item.department}</td>
                          <td className="py-2.5 px-3 text-slate-700 flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-rose-500 shrink-0" />
                            <span>{item.currentLocation}</span>
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <span className="px-2 py-0.5 rounded-full font-black text-xs bg-indigo-50 text-indigo-700 border border-indigo-200">
                              {item.totalMoves} 次
                            </span>
                          </td>
                          <td className="py-2.5 px-3 font-mono text-slate-500 text-2xs">{item.lastMoveDate}</td>
                          <td className="py-2.5 px-3 text-right">
                            {fullEq && (
                              <button
                                onClick={() => handleOpenDeviceTrajectory(fullEq)}
                                className="px-2.5 py-1 text-2xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded transition"
                              >
                                查看全息档案
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ==================== TRACK 4: Accreditation Audit Ledger & Export ==================== */}
        {activeTab === 'audit_export' && (
          <div className="max-w-4xl mx-auto space-y-5">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
                  <FileSignature className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    等级医院（三甲复审）/ 医疗器械使用质量管理规范 · 设备时空流转与变动合规审计册
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    满足中国《医疗器械使用质量管理办法》第15条（转让、调拨、借用）与第21条（停用与报废）法定审计核验要求
                  </p>
                </div>
              </div>

              <div className="bg-blue-50/60 rounded-xl p-4 border border-blue-200 text-xs text-blue-900 space-y-2">
                <div className="font-bold flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                  国家卫健委及药监局三甲复审标准核验条款:
                </div>
                <ul className="list-disc pl-5 space-y-1 text-blue-800 font-medium">
                  <li><strong>条款 4.15.1</strong>: 医疗器械转让、调拨、借用应当有完整记录，确保台账与临床空间实际在位一致。</li>
                  <li><strong>条款 4.15.2</strong>: 建立急救与生命支持设备调配管理机制，保证急救设备完好待命率 100%。</li>
                  <li><strong>条款 4.21.3</strong>: 严禁超期未检或强检不合格设备进入临床，变动全过程具有不可篡改经办人电子记录。</li>
                </ul>
              </div>

              <div className="pt-2 flex items-center justify-between">
                <div className="text-xs text-slate-500">
                  当前在册设备: <strong>{equipmentList.length} 台</strong> | 累计变动轨迹存证: <strong>{stats.totalEvents} 条</strong>
                </div>

                <button
                  onClick={() => setIsAuditModalOpen(true)}
                  className="px-5 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition flex items-center gap-2"
                >
                  <Printer className="w-4 h-4" />
                  <span>生成并打印标准合规审计册 (A4/PDF)</span>
                </button>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Fixed Bottom Pagination (Active in Stream Track) */}
      {activeTab === 'stream' && (
        <Pagination
          currentPage={currentPage}
          pageSize={pageSize}
          totalCount={filteredEvents.length}
          onPageChange={setCurrentPage}
          onPageSizeChange={(sz) => {
            setPageSize(sz);
            setCurrentPage(1);
          }}
        />
      )}

      {/* Single Device Trajectory Modal */}
      <SingleDeviceTrajectoryModal
        equipment={selectedEquipmentForModal}
        isOpen={isSingleDeviceModalOpen}
        onClose={() => {
          setIsSingleDeviceModalOpen(false);
          setSelectedEquipmentForModal(null);
        }}
        onOpenStatusChange={onOpenStatusChange}
        onViewDeviceDetail={onViewDeviceDetail}
      />

      {/* Trajectory Audit Report Modal */}
      <TrajectoryAuditReportModal
        isOpen={isAuditModalOpen}
        onClose={() => setIsAuditModalOpen(false)}
        equipmentList={equipmentList}
      />

    </div>
  );
};

import React, { useState, useMemo } from 'react';
import { MedicalEquipment, DepartmentMaster, StaffPersonMaster, LocationRoomMaster, AuthUser, EquipmentStatus } from '../types';
import { getDepartmentMasterInfo, DEFAULT_DEPARTMENTS, DEFAULT_STAFF, DEFAULT_ROOMS } from '../utils/masterData';
import { getEquipmentValidityInfo } from '../utils/validityUtils';
import { getEquipmentCalibrationInfo } from '../utils/calibrationUtils';
import { getEquipmentHealthScore } from '../utils/equipmentUtils';
import { resolveMainCategory } from '../utils/categoryFormatter';
import {
  Building2,
  X,
  Phone,
  User,
  ShieldCheck,
  AlertTriangle,
  Scale,
  Wrench,
  Sparkles,
  Layers,
  MapPin,
  Calendar,
  DollarSign,
  Download,
  Filter,
  Plus,
  Eye,
  CheckCircle2,
  Hourglass,
  Clock,
  Briefcase,
  Search,
  ExternalLink,
  HeartPulse,
  Activity,
  FileText
} from 'lucide-react';

interface DepartmentDetailModalProps {
  isOpen: boolean;
  departmentName: string | null;
  allEquipment: MedicalEquipment[];
  currentUser?: AuthUser | null;
  customDepartments?: DepartmentMaster[];
  customStaff?: StaffPersonMaster[];
  customRooms?: LocationRoomMaster[];
  onClose: () => void;
  onFilterByDepartment?: (deptName: string) => void;
  onViewEquipmentDetail?: (eq: MedicalEquipment) => void;
  onAddRepairForEquipment?: (eq: MedicalEquipment) => void;
  onAddEquipmentForDepartment?: (deptName: string) => void;
}

export const DepartmentDetailModal: React.FC<DepartmentDetailModalProps> = ({
  isOpen,
  departmentName,
  allEquipment,
  currentUser,
  customDepartments,
  customStaff,
  customRooms,
  onClose,
  onFilterByDepartment,
  onViewEquipmentDetail,
  onAddRepairForEquipment,
  onAddEquipmentForDepartment
}) => {
  const [activeTab, setActiveTab] = useState<'equipment' | 'location' | 'staff' | 'compliance'>('equipment');
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // 1. 匹配科室主数据
  const deptInfo = useMemo(() => {
    return getDepartmentMasterInfo(departmentName || '', customDepartments);
  }, [departmentName, customDepartments]);

  const matchedDept = deptInfo.matchedDept;

  // 2. 筛选属于本科室的设备
  const deptEquipment = useMemo(() => {
    if (!departmentName) return [];
    const rawTarget = departmentName.trim().toLowerCase();
    const cleanTarget = rawTarget.replace(/^(五莲县人民医院|五莲县皮肤病医院|总院|分院)/, '').trim();
    
    return allEquipment.filter(e => {
      const eDept = (e.department || '').trim().toLowerCase();
      const cleanEDept = eDept.replace(/^(五莲县人民医院|五莲县皮肤病医院|总院|分院)/, '').trim();
      return (
        eDept === rawTarget || 
        cleanEDept === cleanTarget || 
        eDept.includes(cleanTarget) || 
        cleanTarget.includes(cleanEDept) ||
        (matchedDept && (eDept === matchedDept.name.toLowerCase() || eDept === matchedDept.code.toLowerCase()))
      );
    });
  }, [allEquipment, departmentName, matchedDept]);

  // 3. 计算科室设备关键指标
  const stats = useMemo(() => {
    const totalCount = deptEquipment.length;
    const totalValue = deptEquipment.reduce((sum, e) => sum + (e.purchasePrice || 0), 0);
    
    let normalCount = 0;
    let repairCount = 0;
    let scrapCount = 0;
    let maintenanceCount = 0;
    let mandatoryCount = 0;
    let mandatoryValidCount = 0;
    let agingRiskCount = 0;
    let totalScore = 0;
    let totalRepairsLogged = 0;
    let totalRepairCost = 0;

    deptEquipment.forEach(e => {
      if (e.status === '正常运行') normalCount++;
      else if (e.status === '故障待修') repairCount++;
      else if (e.status === '报废待处置') scrapCount++;
      else if (e.status === '维护保养中') maintenanceCount++;

      const cal = getEquipmentCalibrationInfo(e);
      if (cal.isMandatory) {
        mandatoryCount++;
        if (cal.statusLabel === '合格在用' || cal.statusLabel === '临期预警') {
          mandatoryValidCount++;
        }
      }

      const vInfo = getEquipmentValidityInfo(e);
      if (vInfo.riskLevel === 'high' || vInfo.riskLevel === 'medium') {
        agingRiskCount++;
      }

      const hScore = getEquipmentHealthScore(e);
      totalScore += hScore.score;

      const rCount = e.repairRecords?.length || e.repairCount || 0;
      totalRepairsLogged += rCount;
      const rCost = e.repairRecords?.reduce((sum, r) => sum + (r.cost || 0), 0) || 0;
      totalRepairCost += rCost;
    });

    const avgScore = totalCount > 0 ? (totalScore / totalCount).toFixed(1) : '95.0';
    const mandatoryRate = mandatoryCount > 0 ? Math.round((mandatoryValidCount / mandatoryCount) * 100) : 100;

    return {
      totalCount,
      totalValue,
      normalCount,
      repairCount,
      scrapCount,
      maintenanceCount,
      mandatoryCount,
      mandatoryValidCount,
      mandatoryRate,
      agingRiskCount,
      avgScore,
      totalRepairsLogged,
      totalRepairCost
    };
  }, [deptEquipment]);

  // 4. 筛选科室责任员工与工程师
  const deptStaff = useMemo(() => {
    const staffPool = customStaff && customStaff.length > 0 ? customStaff : DEFAULT_STAFF;
    const targetDeptName = deptInfo.department;
    
    return staffPool.filter(s => {
      return (
        s.departmentName === targetDeptName || 
        s.departmentName?.includes(targetDeptName) || 
        targetDeptName.includes(s.departmentName) ||
        s.name === deptInfo.manager
      );
    });
  }, [customStaff, deptInfo]);

  // 5. 筛选科室所属房间与物理位置
  const deptRooms = useMemo(() => {
    const roomPool = customRooms && customRooms.length > 0 ? customRooms : DEFAULT_ROOMS;
    const targetDeptName = deptInfo.department;

    return roomPool.filter(r => {
      return (
        r.departmentName === targetDeptName ||
        r.departmentName?.includes(targetDeptName) ||
        targetDeptName.includes(r.departmentName || '') ||
        r.roomName?.includes(targetDeptName)
      );
    });
  }, [customRooms, deptInfo]);

  // 6. 设备搜索与状态过滤
  const filteredEquipment = useMemo(() => {
    return deptEquipment.filter(e => {
      if (statusFilter === 'normal' && e.status !== '正常运行') return false;
      if (statusFilter === 'repair' && e.status !== '故障待修') return false;
      if (statusFilter === 'mandatory') {
        const cal = getEquipmentCalibrationInfo(e);
        if (!cal.isMandatory) return false;
      }
      if (statusFilter === 'aging') {
        const vInfo = getEquipmentValidityInfo(e);
        if (vInfo.riskLevel !== 'high' && vInfo.riskLevel !== 'medium') return false;
      }

      if (!keyword.trim()) return true;
      const kw = keyword.trim().toLowerCase();
      return (
        e.id.toLowerCase().includes(kw) ||
        e.name.toLowerCase().includes(kw) ||
        (e.model && e.model.toLowerCase().includes(kw)) ||
        (e.sn && e.sn.toLowerCase().includes(kw)) ||
        (e.manufacturer && e.manufacturer.toLowerCase().includes(kw))
      );
    });
  }, [deptEquipment, keyword, statusFilter]);

  // 7. 导出本科室设备为 CSV
  const handleExportDeptCsv = () => {
    if (deptEquipment.length === 0) return;
    const headers = ['设备ID', '设备名称', '规格型号', '出厂SN', '生产厂家', '运行状态', '购置金额', '投用时间', '使用科室', '存放楼宇', '楼层', '科室电话', '责任工程师'];
    const rows = deptEquipment.map(e => [
      e.id,
      `"${e.name || ''}"`,
      `"${e.model || '-'}"`,
      `"${e.sn || '-'}"`,
      `"${e.manufacturer || '-'}"`,
      e.status,
      e.purchasePrice || 0,
      e.enableDate || '-',
      deptInfo.department,
      deptInfo.building,
      `${deptInfo.floor}F`,
      deptInfo.nursePhone,
      deptInfo.manager
    ]);
    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${deptInfo.department}_设备资产清单_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isOpen || !departmentName) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl overflow-hidden border border-slate-200 flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600/30 border border-blue-400/40 rounded-lg text-blue-300">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs px-2 py-0.5 rounded bg-blue-500/20 text-blue-200 border border-blue-400/30 font-medium">
                  {deptInfo.matchedDept?.hospitalName || '五莲县人民医院 (总院)'}
                </span>
                {deptInfo.category && (
                  <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-200 border border-emerald-400/30 font-medium">
                    {deptInfo.category}
                  </span>
                )}
                {deptInfo.disciplineCategory && (
                  <span className="text-xs px-2 py-0.5 rounded bg-purple-500/20 text-purple-200 border border-purple-400/30 font-medium">
                    {deptInfo.disciplineCategory}
                  </span>
                )}
              </div>
              <h2 className="text-xl font-bold text-white mt-1 flex items-center gap-2">
                <span>{deptInfo.department}</span>
                <span className="text-xs font-mono font-normal text-slate-400">
                  [{deptInfo.matchedDept?.code || 'DEP-ORG'}]
                </span>
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onClose();
                onFilterByDepartment?.(deptInfo.department);
              }}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
              title="在台账主列表中仅显示此科室的在账设备"
            >
              <Filter className="w-3.5 h-3.5" />
              <span>台账中筛选本科室</span>
            </button>
            <button
              type="button"
              onClick={handleExportDeptCsv}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer"
              title="导出本科室全部设备清单 CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span>导出台账</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Department Quick Info Ribbon */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-3 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600 shrink-0">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-rose-600 shrink-0" />
              <span className="font-semibold text-slate-800">{deptInfo.building}</span>
              <span className="font-mono font-bold bg-white px-1.5 py-0.5 rounded border border-slate-300 text-slate-900">
                {deptInfo.floor}F
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>护士站分机:</span>
              <a
                href={`tel:${deptInfo.nursePhone}`}
                className="font-mono font-bold text-blue-700 hover:underline hover:text-blue-900"
                title="点击呼叫护士站"
              >
                ☎ {deptInfo.nursePhone}
              </a>
            </div>
            <div className="flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span>分管责任工程师:</span>
              <span className="font-bold text-slate-900">{deptInfo.manager}</span>
            </div>
          </div>

          {matchedDept?.leader && (
            <div className="flex items-center gap-1.5 text-slate-600">
              <Briefcase className="w-3.5 h-3.5 text-purple-600 shrink-0" />
              <span>科室负责人/主任:</span>
              <span className="font-bold text-slate-800">{matchedDept.leader}</span>
            </div>
          )}
        </div>

        {/* KPI Metrics Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 p-4 bg-white border-b border-slate-200 shrink-0">
          {/* Card 1: 在账设备 */}
          <div className="bg-blue-50/60 p-3 rounded-lg border border-blue-100">
            <div className="flex items-center justify-between text-blue-800 text-xs font-semibold">
              <span>在账资产总数</span>
              <Layers className="w-3.5 h-3.5 text-blue-600" />
            </div>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-xl font-bold font-mono text-blue-950">{stats.totalCount}</span>
              <span className="text-xs text-blue-700">台/套</span>
            </div>
            <div className="text-[11px] text-blue-700 mt-0.5 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span>正常: {stats.normalCount}</span>
              {stats.repairCount > 0 && (
                <span className="text-rose-700 font-bold ml-1">· 待修: {stats.repairCount}</span>
              )}
            </div>
          </div>

          {/* Card 2: 资产总值 */}
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
            <div className="flex items-center justify-between text-slate-700 text-xs font-semibold">
              <span>购置原值总额</span>
              <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
            </div>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-xl font-bold font-mono text-slate-900 notranslate" translate="no">
                ￥{stats.totalValue >= 10000 ? (stats.totalValue / 10000).toFixed(1) + '万' : stats.totalValue.toLocaleString()}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5 truncate">
              均台原值: ￥{stats.totalCount > 0 ? Math.round(stats.totalValue / stats.totalCount).toLocaleString() : 0}
            </p>
          </div>

          {/* Card 3: AI健康得分 */}
          <div className="bg-cyan-50/60 p-3 rounded-lg border border-cyan-100">
            <div className="flex items-center justify-between text-cyan-800 text-xs font-semibold">
              <span>AI健康平均分</span>
              <Sparkles className="w-3.5 h-3.5 text-cyan-600" />
            </div>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-xl font-bold font-mono text-cyan-950">{stats.avgScore}</span>
              <span className="text-xs text-cyan-700">分</span>
            </div>
            <p className="text-[11px] text-cyan-700 mt-0.5">
              {Number(stats.avgScore) >= 90 ? '总体良好 · 低故障率' : '关注临期及老旧机型'}
            </p>
          </div>

          {/* Card 4: 法定强检 */}
          <div className="bg-emerald-50/60 p-3 rounded-lg border border-emerald-100">
            <div className="flex items-center justify-between text-emerald-800 text-xs font-semibold">
              <span>法定强检设备</span>
              <Scale className="w-3.5 h-3.5 text-emerald-600" />
            </div>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-xl font-bold font-mono text-emerald-950">{stats.mandatoryCount}</span>
              <span className="text-xs text-emerald-700">台纳入强检</span>
            </div>
            <p className="text-[11px] text-emerald-700 mt-0.5">
              定标合规率: <strong>{stats.mandatoryRate}%</strong>
            </p>
          </div>

          {/* Card 5: 维保支出 */}
          <div className="bg-amber-50/60 p-3 rounded-lg border border-amber-100">
            <div className="flex items-center justify-between text-amber-800 text-xs font-semibold">
              <span>累计维保支出</span>
              <Wrench className="w-3.5 h-3.5 text-amber-600" />
            </div>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-xl font-bold font-mono text-amber-950 notranslate" translate="no">
                ￥{stats.totalRepairCost.toLocaleString()}
              </span>
            </div>
            <p className="text-[11px] text-amber-700 mt-0.5">
              历史工单: {stats.totalRepairsLogged} 起
            </p>
          </div>
        </div>

        {/* Tabs Bar */}
        <div className="px-6 border-b border-slate-200 bg-white flex gap-6 text-sm font-semibold shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('equipment')}
            className={`py-3 border-b-2 transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'equipment'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>在账设备档案</span>
            <span className="px-1.5 py-0.2 rounded-full text-xs bg-slate-100 text-slate-700 font-mono">
              {deptEquipment.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('location')}
            className={`py-3 border-b-2 transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'location'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <MapPin className="w-4 h-4" />
            <span>空间网格与物理位置</span>
            <span className="px-1.5 py-0.2 rounded-full text-xs bg-slate-100 text-slate-700 font-mono">
              {deptRooms.length} 房室
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('staff')}
            className={`py-3 border-b-2 transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'staff'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <User className="w-4 h-4" />
            <span>责任人员与医工对接</span>
            <span className="px-1.5 py-0.2 rounded-full text-xs bg-slate-100 text-slate-700 font-mono">
              {deptStaff.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('compliance')}
            className={`py-3 border-b-2 transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'compliance'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>计量强检与风险评估</span>
            {stats.agingRiskCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-xs bg-amber-100 text-amber-800 font-bold font-mono">
                {stats.agingRiskCount} 预警
              </span>
            )}
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
          
          {/* TAB 1: 在账设备清单 */}
          {activeTab === 'equipment' && (
            <div className="space-y-4">
              {/* Filter and Search Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
                <div className="flex items-center gap-2 flex-1 min-w-[240px]">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={keyword}
                      onChange={(e) => setKeyword(e.target.value)}
                      placeholder="搜索本科室设备ID、名称、规格型号、出厂SN、厂家..."
                      className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-blue-500 text-slate-800"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap text-xs">
                  <button
                    type="button"
                    onClick={() => setStatusFilter('all')}
                    className={`px-2.5 py-1 rounded-md transition font-medium cursor-pointer ${
                      statusFilter === 'all'
                        ? 'bg-blue-600 text-white shadow-2xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    全部 ({deptEquipment.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatusFilter('normal')}
                    className={`px-2.5 py-1 rounded-md transition font-medium cursor-pointer ${
                      statusFilter === 'normal'
                        ? 'bg-emerald-600 text-white shadow-2xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    正常运行 ({stats.normalCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatusFilter('repair')}
                    className={`px-2.5 py-1 rounded-md transition font-medium cursor-pointer ${
                      statusFilter === 'repair'
                        ? 'bg-rose-600 text-white shadow-2xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    故障待修 ({stats.repairCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatusFilter('mandatory')}
                    className={`px-2.5 py-1 rounded-md transition font-medium cursor-pointer ${
                      statusFilter === 'mandatory'
                        ? 'bg-purple-600 text-white shadow-2xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    法定强检 ({stats.mandatoryCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatusFilter('aging')}
                    className={`px-2.5 py-1 rounded-md transition font-medium cursor-pointer ${
                      statusFilter === 'aging'
                        ? 'bg-amber-600 text-white shadow-2xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    超龄/临期 ({stats.agingRiskCount})
                  </button>
                </div>
              </div>

              {/* Equipment Table */}
              <div className="bg-white rounded-lg border border-slate-200 shadow-2xs overflow-hidden">
                {filteredEquipment.length === 0 ? (
                  <div className="py-12 text-center text-slate-400">
                    <Layers className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="text-sm font-medium">未找到符合条件的科室在账设备</p>
                    <p className="text-xs text-slate-400 mt-1">可尝试清空搜索词或切换状态筛选器</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold">
                        <tr>
                          <th className="py-2.5 px-3 w-16">序号</th>
                          <th className="py-2.5 px-3">设备系统ID</th>
                          <th className="py-2.5 px-3">设备名称 / 规格型号</th>
                          <th className="py-2.5 px-3">国家大类</th>
                          <th className="py-2.5 px-3">出厂SN / 厂家</th>
                          <th className="py-2.5 px-3 text-center">状态</th>
                          <th className="py-2.5 px-3">法定计量</th>
                          <th className="py-2.5 px-3 text-right">购置原值</th>
                          <th className="py-2.5 px-3 text-center">AI健康分</th>
                          <th className="py-2.5 px-3 text-right">操作</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        {filteredEquipment.map((eq, idx) => {
                          const catInfo = resolveMainCategory(eq.categoryNo, eq.category, `${eq.name} ${eq.level2Category || ''}`);
                          const calInfo = getEquipmentCalibrationInfo(eq);
                          const hScore = getEquipmentHealthScore(eq);

                          return (
                            <tr key={eq.id} className="hover:bg-slate-50/80 transition group">
                              <td className="py-2 px-3 font-mono text-slate-400 font-semibold">{idx + 1}</td>
                              <td className="py-2 px-3 font-mono font-bold text-slate-900 whitespace-nowrap">{eq.id}</td>
                              <td className="py-2 px-3">
                                <div className="font-bold text-slate-900 text-xs sm:text-sm">{eq.name}</div>
                                <div className="text-slate-500 font-mono text-[11px]">{eq.model || '-'}</div>
                              </td>
                              <td className="py-2 px-3 whitespace-nowrap">
                                <div className="flex items-center gap-1">
                                  <span className="px-1 py-0.2 rounded bg-slate-100 border border-slate-300 font-mono text-[10px] text-slate-700">
                                    {catInfo.code}
                                  </span>
                                  <span className="text-slate-700 font-medium truncate max-w-[100px]" title={catInfo.name}>
                                    {catInfo.name}
                                  </span>
                                </div>
                              </td>
                              <td className="py-2 px-3">
                                <div className="font-mono text-slate-700">{eq.sn || '-'}</div>
                                <div className="text-slate-500 truncate max-w-[130px]" title={eq.manufacturer}>{eq.manufacturer || '-'}</div>
                              </td>
                              <td className="py-2 px-3 text-center whitespace-nowrap">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border inline-flex items-center gap-1 ${
                                  eq.status === '正常运行' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                  eq.status === '故障待修' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                                  eq.status === '维护保养中' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                  'bg-slate-100 text-slate-600 border-slate-200'
                                }`}>
                                  <span className={`w-1.5 h-1.5 rounded-full ${
                                    eq.status === '正常运行' ? 'bg-emerald-500' :
                                    eq.status === '故障待修' ? 'bg-rose-500' :
                                    'bg-slate-400'
                                  }`}></span>
                                  {eq.status}
                                </span>
                              </td>
                              <td className="py-2 px-3 whitespace-nowrap">
                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${calInfo.badgeClass}`}>
                                  {calInfo.statusLabel}
                                </span>
                              </td>
                              <td className="py-2 px-3 text-right font-mono font-bold text-slate-900 notranslate" translate="no">
                                ￥{(eq.purchasePrice || 0).toLocaleString()}
                              </td>
                              <td className="py-2 px-3 text-center whitespace-nowrap">
                                <span className={`px-1.5 py-0.2 rounded font-mono font-bold text-xs ${
                                  hScore.score >= 90 ? 'text-emerald-700 bg-emerald-50' :
                                  hScore.score >= 75 ? 'text-blue-700 bg-blue-50' :
                                  'text-amber-800 bg-amber-50'
                                }`}>
                                  {hScore.score}分
                                </span>
                              </td>
                              <td className="py-2 px-3 text-right whitespace-nowrap">
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      onClose();
                                      onViewEquipmentDetail?.(eq);
                                    }}
                                    className="p-1 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded transition cursor-pointer"
                                    title="查看设备详情档案"
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      onClose();
                                      onAddRepairForEquipment?.(eq);
                                    }}
                                    className="p-1 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded transition cursor-pointer"
                                    title="登记维修工单"
                                  >
                                    <Wrench className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: 空间网格与物理位置 */}
          {activeTab === 'location' && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 楼宇及楼层档案 */}
                <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-2xs space-y-3">
                  <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2 border-b border-slate-100 pb-2">
                    <MapPin className="w-4 h-4 text-rose-600" />
                    <span>实体楼宇与位置网格</span>
                  </h3>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-500">所属院区:</span>
                      <span className="font-bold text-slate-800">{deptInfo.matchedDept?.campusName || '五莲县人民医院 (总院)'}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-500">所在楼宇:</span>
                      <span className="font-bold text-slate-800">{deptInfo.building}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-500">标准楼层:</span>
                      <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                        {deptInfo.floor}F
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-500">科室类别:</span>
                      <span className="font-bold text-slate-800">{deptInfo.category || '临床病区'}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-500">学科分类:</span>
                      <span className="font-bold text-slate-800">{deptInfo.disciplineCategory || '综合'}</span>
                    </div>
                  </div>
                </div>

                {/* 紧急联系与呼叫网络 */}
                <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-2xs space-y-3">
                  <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2 border-b border-slate-100 pb-2">
                    <Phone className="w-4 h-4 text-emerald-600" />
                    <span>临床联络与应急通信</span>
                  </h3>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between items-center py-1 border-b border-slate-100">
                      <span className="text-slate-500">护士站固定分机:</span>
                      <a href={`tel:${deptInfo.nursePhone}`} className="font-mono font-bold text-blue-700 hover:underline">
                        ☎ {deptInfo.nursePhone}
                      </a>
                    </div>
                    {matchedDept?.doctorOfficePhone && (
                      <div className="flex justify-between items-center py-1 border-b border-slate-100">
                        <span className="text-slate-500">医生办公室电话:</span>
                        <span className="font-mono font-bold text-slate-800">☎ {matchedDept.doctorOfficePhone}</span>
                      </div>
                    )}
                    {matchedDept?.dutyPhone && (
                      <div className="flex justify-between items-center py-1 border-b border-slate-100">
                        <span className="text-slate-500">夜间值班热线:</span>
                        <span className="font-mono font-bold text-slate-800">☎ {matchedDept.dutyPhone}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center py-1 border-b border-slate-100">
                      <span className="text-slate-500">不良事件监测重点:</span>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        matchedDept?.adverseEventReporting ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {matchedDept?.adverseEventReporting ? '重点报告科室' : '常规科室'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-1">
                      <span className="text-slate-500">应急绿色通道保障:</span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        医疗设备应急调配覆盖
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 空间房间网格列表 */}
              <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-2xs space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <Layers className="w-4 h-4 text-blue-600" />
                    <span>下辖诊疗用房与手术间分布 ({deptRooms.length} 处)</span>
                  </h3>
                  <span className="text-xs text-slate-400">空间网格三级定位编码</span>
                </div>

                {deptRooms.length === 0 ? (
                  <p className="text-xs text-slate-400 py-4 text-center">暂未在空间主数据中登记独立房室明细，沿用大科室公共区域分配。</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                    {deptRooms.map(room => (
                      <div key={room.id} className="p-2.5 rounded-md border border-slate-200 bg-slate-50/70 text-xs flex flex-col justify-between">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900">{room.roomName}</span>
                          <span className="px-1.5 py-0.2 rounded bg-white text-slate-700 border border-slate-300 font-mono text-[10px]">
                            {room.roomCode}
                          </span>
                        </div>
                        <div className="text-slate-500 text-[11px] mt-1 flex items-center justify-between">
                          <span>{room.buildingName} · {room.floor}</span>
                          <span className="font-semibold text-blue-700">{room.roomType}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: 责任人员与医工对接 */}
          {activeTab === 'staff' && (
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-2xs">
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2 border-b border-slate-100 pb-2 mb-3">
                  <User className="w-4 h-4 text-blue-600" />
                  <span>定点医学工程服务与科室对接人员</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* 设备科责任工程师卡片 */}
                  <div className="p-3.5 rounded-lg border border-blue-200 bg-blue-50/40 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded bg-blue-600 text-white text-[10px] font-bold">
                        医疗设备科 · 分管工程师
                      </span>
                      <span className="text-xs font-mono text-blue-800 font-bold">首要对接人</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-base shadow-2xs">
                        {deptInfo.manager ? deptInfo.manager.slice(0, 1) : '工'}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 text-sm">{deptInfo.manager}</div>
                        <div className="text-xs text-slate-500">医学工程部 · 设备运维保障专员</div>
                      </div>
                    </div>
                    <div className="text-xs text-slate-600 pt-1 border-t border-blue-100 flex items-center justify-between">
                      <span>保障职责:</span>
                      <span className="font-medium text-slate-800">全流程维护、强检定标、应急调配</span>
                    </div>
                  </div>

                  {/* 科室临床负责人 */}
                  <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded bg-slate-700 text-white text-[10px] font-bold">
                        临床科室 · 负责人
                      </span>
                      <span className="text-xs text-slate-500">科室资产安全责任人</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-700 text-white flex items-center justify-center font-bold text-base shadow-2xs">
                        {matchedDept?.leader ? matchedDept.leader.slice(0, 1) : '主'}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 text-sm">{matchedDept?.leader || '科室主任/护士长'}</div>
                        <div className="text-xs text-slate-500">{deptInfo.department} · 主任/主管护师</div>
                      </div>
                    </div>
                    <div className="text-xs text-slate-600 pt-1 border-t border-slate-200 flex items-center justify-between">
                      <span>临床电话:</span>
                      <span className="font-mono font-bold text-blue-700">☎ {deptInfo.nursePhone}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 关联员工花名册 */}
              {deptStaff.length > 0 && (
                <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-2xs space-y-3">
                  <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2 border-b border-slate-100 pb-2">
                    <Briefcase className="w-4 h-4 text-purple-600" />
                    <span>关联干系人与技术支持工程师列表</span>
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                    {deptStaff.map(s => (
                      <div key={s.id} className="p-2.5 rounded-md border border-slate-200 bg-slate-50 text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900">{s.name}</span>
                          <span className="px-1.5 py-0.2 rounded bg-white text-slate-700 border border-slate-300 font-mono text-[10px]">
                            {s.role}
                          </span>
                        </div>
                        <div className="text-slate-500 text-[11px]">{s.organization || '五莲县人民医院'}</div>
                        <div className="text-blue-700 font-mono font-semibold text-[11px]">☎ {s.phone}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: 计量强检与风险评估 */}
          {activeTab === 'compliance' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 强检设备合规清单 */}
                <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                      <Scale className="w-4 h-4 text-emerald-600" />
                      <span>国家法定强检定标合规 ({stats.mandatoryCount} 台)</span>
                    </h3>
                    <span className="text-xs text-emerald-700 font-bold font-mono">
                      合规率: {stats.mandatoryRate}%
                    </span>
                  </div>

                  {deptEquipment.filter(e => getEquipmentCalibrationInfo(e).isMandatory).length === 0 ? (
                    <p className="text-xs text-slate-400 py-4 text-center">本科室暂无纳入国家法定强制检定目录的强检类设备。</p>
                  ) : (
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {deptEquipment.filter(e => getEquipmentCalibrationInfo(e).isMandatory).map(eq => {
                        const cal = getEquipmentCalibrationInfo(eq);
                        return (
                          <div key={eq.id} className="p-2 rounded bg-slate-50 border border-slate-200 text-xs flex items-center justify-between">
                            <div>
                              <div className="font-bold text-slate-900">{eq.name}</div>
                              <div className="text-slate-500 text-[11px] font-mono">ID: {eq.id} · SN: {eq.sn || '-'}</div>
                            </div>
                            <div className="text-right">
                              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${cal.badgeClass}`}>
                                {cal.statusLabel}
                              </span>
                              <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                                下次: {cal.nextDate}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* 老龄化服役与使用年限预警 */}
                <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                      <Hourglass className="w-4 h-4 text-amber-600" />
                      <span>老龄化服役与寿命评估 ({stats.agingRiskCount} 台)</span>
                    </h3>
                    <span className="text-xs text-amber-700 font-bold">设计寿命预警</span>
                  </div>

                  {deptEquipment.filter(e => {
                    const v = getEquipmentValidityInfo(e);
                    return v.riskLevel === 'high' || v.riskLevel === 'medium';
                  }).length === 0 ? (
                    <div className="py-6 text-center text-slate-400">
                      <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto mb-1" />
                      <p className="text-xs font-semibold text-emerald-700">科室设备均在标称设计寿命期内，状态优良！</p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {deptEquipment.filter(e => {
                        const v = getEquipmentValidityInfo(e);
                        return v.riskLevel === 'high' || v.riskLevel === 'medium';
                      }).map(eq => {
                        const v = getEquipmentValidityInfo(eq);
                        return (
                          <div key={eq.id} className="p-2 rounded bg-amber-50/60 border border-amber-200 text-xs flex items-center justify-between">
                            <div>
                              <div className="font-bold text-slate-900">{eq.name}</div>
                              <div className="text-slate-500 text-[11px] font-mono">投用: {eq.enableDate || '-'} · 标称{eq.productValidity || 10}年</div>
                            </div>
                            <div className="text-right">
                              <span className="px-1.5 py-0.5 rounded bg-amber-600 text-white text-[10px] font-bold">
                                {v.riskLevel === 'high' ? `超龄服役 +${v.yearsPast}年` : `临期剩${v.daysRemaining}天`}
                              </span>
                              <div className="text-[10px] text-amber-800 font-medium mt-0.5">建议预防性保养</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="bg-slate-100 border-t border-slate-200 px-6 py-3 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-500">
            <span>当前科室包含 </span>
            <strong className="text-slate-800 font-mono">{deptEquipment.length}</strong>
            <span> 台在账设备，资产总额 </span>
            <strong className="text-slate-800 font-mono notranslate" translate="no">
              ￥{stats.totalValue.toLocaleString()}
            </strong>
          </div>

          <div className="flex items-center gap-2">
            {onAddEquipmentForDepartment && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onAddEquipmentForDepartment(deptInfo.department);
                }}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition flex items-center gap-1 shadow-sm cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>为本科室新增设备</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-semibold transition cursor-pointer"
            >
              关闭
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

import React, { useState, useMemo, useEffect } from 'react';
import { 
  MedicalEquipment, 
  AuthUser 
} from '../types';
import { 
  Calendar, 
  Wrench, 
  Search, 
  Scale, 
  ShieldCheck, 
  AlertTriangle, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  FileText, 
  Send, 
  Printer, 
  FileCheck, 
  Building2, 
  Filter, 
  RefreshCw,
  Sparkles,
  TrendingDown,
  Info
} from 'lucide-react';
import { getUserDepartment, isHeadNurse, isClinicalStaff } from '../utils/authUtils';
import { Pagination } from './Pagination';
import { getEquipmentCalibrationInfo, CalibrationInfo } from '../utils/calibrationUtils';
import { MetrologyCertificateViewModal } from './metrology/MetrologyCertificateViewModal';
import { MetrologyRegistrationModal } from './metrology/MetrologyRegistrationModal';
import { MetrologyBatchDispatchModal } from './metrology/MetrologyBatchDispatchModal';

interface MaintenancePlansViewProps {
  equipmentList: MedicalEquipment[];
  currentUser?: AuthUser | null;
  onOpenRepairModalForDevice: (device: MedicalEquipment) => void;
  onUpdateEquipment?: (updated: MedicalEquipment) => void;
  onViewDeviceDetail?: (device: MedicalEquipment) => void;
}

export const MaintenancePlansView: React.FC<MaintenancePlansViewProps> = ({
  equipmentList,
  currentUser,
  onOpenRepairModalForDevice,
  onUpdateEquipment,
  onViewDeviceDetail
}) => {
  const userDept = getUserDepartment(currentUser);
  const isNurse = isHeadNurse(currentUser) || isClinicalStaff(currentUser);

  // 顶层子视图切换: 'metrology' (计量强检与校准台账) | 'pm_plans' (预防性维护PM排程) | 'agencies' (送检机构资质)
  const [activeSubTab, setActiveSubTab] = useState<'metrology' | 'pm_plans' | 'agencies'>('metrology');

  // 计量台账筛选状态
  const [deptFilter, setDeptFilter] = useState<string>(() => (isNurse && userDept ? userDept : ''));
  const [searchKey, setSearchKey] = useState<string>('');
  const [calTypeFilter, setCalTypeFilter] = useState<'all' | 'mandatory' | 'periodic' | 'due_soon' | 'overdue'>('all');
  const [quarterFilter, setQuarterFilter] = useState<'all' | 'Q1' | 'Q2' | 'Q3' | 'Q4'>('all');

  // 分页状态
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // 模态框状态
  const [certificateDevice, setCertificateDevice] = useState<MedicalEquipment | null>(null);
  const [registerDevice, setRegisterDevice] = useState<MedicalEquipment | null>(null);
  const [isBatchDispatchOpen, setIsBatchDispatchOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const departmentsList = useMemo(() => {
    const set = new Set<string>();
    equipmentList.forEach(e => {
      if (e.department) set.add(e.department);
    });
    return Array.from(set);
  }, [equipmentList]);

  // 全院计量数据聚合与统计
  const metrologyStats = useMemo(() => {
    let totalMandatory = 0;
    let totalPeriodic = 0;
    let dueSoon30Days = 0;
    let overdueCount = 0;
    let validCount = 0;
    let totalSavingsEst = 0;

    equipmentList.forEach(eq => {
      const info = getEquipmentCalibrationInfo(eq);
      if (info.isMandatory) {
        totalMandatory++;
        totalSavingsEst += 350; // 平均每台国家法定免征检定费 350 元
      } else if (info.isPeriodicCalibration) {
        totalPeriodic++;
      }

      if (info.statusType === 'overdue') {
        overdueCount++;
      } else if (info.statusType === 'due_soon') {
        dueSoon30Days++;
      } else if (info.statusType === 'valid') {
        validCount++;
      }
    });

    return {
      totalMandatory,
      totalPeriodic,
      dueSoon30Days,
      overdueCount,
      validCount,
      totalSavingsEst
    };
  }, [equipmentList]);

  // 计量台账设备列表过滤
  const filteredMetrologyList = useMemo(() => {
    return equipmentList.filter(item => {
      if (deptFilter && item.department !== deptFilter) return false;
      
      const cal = getEquipmentCalibrationInfo(item);

      if (calTypeFilter === 'mandatory' && !cal.isMandatory) return false;
      if (calTypeFilter === 'periodic' && !cal.isPeriodicCalibration) return false;
      if (calTypeFilter === 'due_soon' && cal.statusType !== 'due_soon') return false;
      if (calTypeFilter === 'overdue' && cal.statusType !== 'overdue') return false;

      if (searchKey) {
        const kw = searchKey.toLowerCase();
        const matches = 
          item.name.toLowerCase().includes(kw) ||
          item.sn.toLowerCase().includes(kw) ||
          (item.model && item.model.toLowerCase().includes(kw)) ||
          (item.assetNo && item.assetNo.toLowerCase().includes(kw)) ||
          (item.calibrationCertificateNo && item.calibrationCertificateNo.toLowerCase().includes(kw)) ||
          (item.manager && item.manager.toLowerCase().includes(kw));
        if (!matches) return false;
      }
      return true;
    });
  }, [equipmentList, deptFilter, calTypeFilter, searchKey]);

  // PM 预防性维护计划过滤
  const filteredPmList = useMemo(() => {
    return equipmentList.filter(item => {
      if (deptFilter && item.department !== deptFilter) return false;

      if (quarterFilter !== 'all') {
        const nextMonth = item.nextMaintenanceDate ? parseInt(item.nextMaintenanceDate.split('-')[1], 10) : 12;
        if (quarterFilter === 'Q1' && (nextMonth < 1 || nextMonth > 3)) return false;
        if (quarterFilter === 'Q2' && (nextMonth < 4 || nextMonth > 6)) return false;
        if (quarterFilter === 'Q3' && (nextMonth < 7 || nextMonth > 9)) return false;
        if (quarterFilter === 'Q4' && (nextMonth < 10 || nextMonth > 12)) return false;
      }

      if (searchKey) {
        const kw = searchKey.toLowerCase();
        const matches = 
          item.name.toLowerCase().includes(kw) ||
          item.sn.toLowerCase().includes(kw) ||
          (item.model && item.model.toLowerCase().includes(kw)) ||
          (item.manager && item.manager.toLowerCase().includes(kw));
        if (!matches) return false;
      }
      return true;
    });
  }, [equipmentList, deptFilter, quarterFilter, searchKey]);

  useEffect(() => {
    setCurrentPage(1);
  }, [deptFilter, calTypeFilter, quarterFilter, searchKey, activeSubTab]);

  const currentList = activeSubTab === 'metrology' ? filteredMetrologyList : filteredPmList;

  const paginatedList = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return currentList.slice(start, start + pageSize);
  }, [currentList, currentPage, pageSize]);

  // 保存检定结果登记
  const handleSaveCalibrationResult = (equipmentId: string, calData: {
    certificateNo: string;
    agency: string;
    lastDate: string;
    nextDate: string;
    conclusion: '合格' | '准用' | '不合格';
    fee: number;
    inspector: string;
    notes: string;
  }) => {
    const target = equipmentList.find(e => e.id === equipmentId);
    if (!target) return;

    const updatedEquipment: MedicalEquipment = {
      ...target,
      calibrationCertificateNo: calData.certificateNo,
      calibrationUnit: calData.agency,
      lastCalibrationDate: calData.lastDate,
      nextCalibrationDate: calData.nextDate,
      status: calData.conclusion === '不合格' ? '故障待修' : '正常运行',
      notes: `${target.notes || ''} [${calData.lastDate} 计量检定: ${calData.conclusion}]`
    };

    if (onUpdateEquipment) {
      onUpdateEquipment(updatedEquipment);
    }

    // 同步到后台数据库
    fetch(`/api/equipment/${equipmentId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedEquipment)
    }).catch(err => console.warn('Sync equipment failed', err));

    showToast(`计量检定登记成功: ${target.name} 证书已更新`);
  };

  return (
    <div className="bg-white rounded-md border border-slate-200 h-full flex flex-col min-h-0 overflow-hidden shadow-xs relative">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-50 bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-xl flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header */}
      <div className="p-3.5 border-b border-slate-200 bg-white flex flex-col md:flex-row md:items-center justify-between flex-none gap-2.5">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm md:text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Scale className="w-4 h-4 md:w-5 md:h-5 text-indigo-600" />
              医学装备计量检定与预防性维护(PM)闭环工作台
            </h2>
            <span className="hidden sm:inline-flex px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
              e-CQS 国家强检对齐
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5 font-medium">
            覆盖国家法定强检(免征)、重点科室自费定期校准、临期预警倒计时及预防性保养排程
          </p>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg border border-slate-200 self-start md:self-auto">
          <button
            onClick={() => setActiveSubTab('metrology')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
              activeSubTab === 'metrology'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Scale className="w-3.5 h-3.5 text-indigo-600" />
            <span>法定强检与校准台账</span>
          </button>

          <button
            onClick={() => setActiveSubTab('pm_plans')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
              activeSubTab === 'pm_plans'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Calendar className="w-3.5 h-3.5 text-blue-600" />
            <span>预防性维保(PM)排程</span>
          </button>

          <button
            onClick={() => setActiveSubTab('agencies')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
              activeSubTab === 'agencies'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>资质送检机构名录</span>
          </button>
        </div>
      </div>

      {/* KPI Alert Strip */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2.5 p-3 bg-slate-50/80 border-b border-slate-200 text-xs shrink-0">
        <div className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-2xs">
          <div className="text-slate-500 text-[11px] font-medium flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>法定强检在册</span>
          </div>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-lg font-bold font-mono text-emerald-700">{metrologyStats.totalMandatory}</span>
            <span className="text-[10px] text-slate-400">台 (免费)</span>
          </div>
          <div className="text-[10px] text-emerald-600 font-semibold mt-0.5">国家法定免征政策</div>
        </div>

        <div className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-2xs">
          <div className="text-slate-500 text-[11px] font-medium flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            <span>30天内到期预警</span>
          </div>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-lg font-bold font-mono text-amber-700">{metrologyStats.dueSoon30Days}</span>
            <span className="text-[10px] text-slate-400">台需送检</span>
          </div>
          <div className="text-[10px] text-amber-600 font-semibold mt-0.5">建议立即发起派工</div>
        </div>

        <div className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-2xs">
          <div className="text-slate-500 text-[11px] font-medium flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
            <span>超期脱检 (禁止使用)</span>
          </div>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-lg font-bold font-mono text-rose-700">{metrologyStats.overdueCount}</span>
            <span className="text-[10px] text-slate-400">台脱检</span>
          </div>
          <div className="text-[10px] text-rose-600 font-semibold mt-0.5">医保拒付与法规风险</div>
        </div>

        <div className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-2xs">
          <div className="text-slate-500 text-[11px] font-medium flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
            <span>在效期合格率</span>
          </div>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-lg font-bold font-mono text-indigo-700">
              {Math.round((metrologyStats.validCount / Math.max(1, metrologyStats.totalMandatory + metrologyStats.totalPeriodic)) * 100)}%
            </span>
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">三甲质控达标标准</div>
        </div>

        <div className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-2xs col-span-2 md:col-span-1">
          <div className="text-slate-500 text-[11px] font-medium flex items-center gap-1">
            <TrendingDown className="w-3.5 h-3.5 text-emerald-600" />
            <span>强检减免政策红利</span>
          </div>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-lg font-bold font-mono text-emerald-600 notranslate" translate="no">
              ￥{metrologyStats.totalSavingsEst.toLocaleString()}
            </span>
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">财税〔2017〕20号</div>
        </div>
      </div>

      {/* Filter and Action Bar */}
      <div className="p-3 border-b border-slate-200 bg-white flex flex-col md:flex-row md:items-center justify-between gap-2.5 shrink-0 text-xs">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          {/* Department Filter */}
          <div className="flex items-center gap-1">
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="">全部临床科室</option>
              {departmentsList.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
            {userDept && isNurse && (
              <button
                type="button"
                onClick={() => setDeptFilter(deptFilter === userDept ? '' : userDept)}
                className={`px-2 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  deptFilter === userDept
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                {deptFilter === userDept ? `锁定${userDept}` : `仅看${userDept}`}
              </button>
            )}
          </div>

          {/* Cal Type Filter (if on metrology tab) */}
          {activeSubTab === 'metrology' && (
            <div className="flex items-center gap-1">
              {(['all', 'mandatory', 'periodic', 'due_soon', 'overdue'] as const).map(f => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setCalTypeFilter(f)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                    calTypeFilter === f
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {f === 'all' ? '全部' : f === 'mandatory' ? '法定强检' : f === 'periodic' ? '自费校准' : f === 'due_soon' ? '临期≤30天' : '超期脱检'}
                </button>
              ))}
            </div>
          )}

          {/* Quarter Filter (if on pm_plans tab) */}
          {activeSubTab === 'pm_plans' && (
            <div className="flex items-center gap-1">
              {(['all', 'Q1', 'Q2', 'Q3', 'Q4'] as const).map(q => (
                <button
                  key={q}
                  type="button"
                  onClick={() => setQuarterFilter(q)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                    quarterFilter === q
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {q === 'all' ? '全年季度' : `${q} 季度`}
                </button>
              ))}
            </div>
          )}

          {/* Search Box */}
          <div className="relative">
            <input
              type="text"
              value={searchKey}
              onChange={(e) => setSearchKey(e.target.value)}
              placeholder="搜索设备名称、SN、证书号..."
              className="pl-8 pr-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 w-48"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setIsBatchDispatchOpen(true)}
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition active:scale-98"
            title="选择多台临期或待检设备批量生成委托送检交接单"
          >
            <Send className="w-3.5 h-3.5" />
            <span>批量委托送检派工</span>
          </button>
        </div>
      </div>

      {/* Main Table / Sub-view Content */}
      <div className="flex-1 min-h-0 overflow-auto">
        {activeSubTab === 'metrology' && (
          <table className="w-full text-left border-collapse text-xs">
            <thead className="sticky top-0 bg-slate-50 z-10 shadow-2xs border-b border-slate-200">
              <tr className="text-slate-600 text-xs font-bold uppercase tracking-wider">
                <th className="px-4 py-2.5">设备资产编号 / SN</th>
                <th className="px-4 py-2.5">设备名称 / 规格型号</th>
                <th className="px-4 py-2.5">所属科室</th>
                <th className="px-4 py-2.5">计量属性 / 政策</th>
                <th className="px-4 py-2.5">法定检定机构</th>
                <th className="px-4 py-2.5">证书编号</th>
                <th className="px-4 py-2.5">上次检定</th>
                <th className="px-4 py-2.5">下次到期日</th>
                <th className="px-4 py-2.5">效期倒计时</th>
                <th className="px-4 py-2.5 text-right">闭环操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredMetrologyList.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-slate-400 text-sm">
                    暂无符合条件的计量强检设备记录。
                  </td>
                </tr>
              ) : (
                paginatedList.map((item) => {
                  const cal = getEquipmentCalibrationInfo(item);
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition">
                      <td className="px-4 py-2.5 font-mono text-slate-700 font-medium whitespace-nowrap">
                        <div className="font-bold text-slate-900">{item.assetNo || item.id}</div>
                        <span className="text-[11px] text-slate-400">{item.sn || '-'}</span>
                      </td>

                      <td className="px-4 py-2.5 font-medium text-slate-800">
                        <div 
                          onClick={() => onViewDeviceDetail && onViewDeviceDetail(item)}
                          className="font-bold text-slate-900 hover:text-indigo-600 cursor-pointer truncate max-w-xs"
                        >
                          {item.name}
                        </div>
                        <span className="block text-[11px] text-slate-400 font-normal truncate max-w-xs">
                          {item.model || '-'}
                        </span>
                      </td>

                      <td className="px-4 py-2.5 font-medium text-slate-700 whitespace-nowrap">
                        {item.department}
                      </td>

                      <td className="px-4 py-2.5 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${cal.feePolicyBadgeClass}`}>
                          {cal.calibrationType}
                        </span>
                      </td>

                      <td className="px-4 py-2.5 text-slate-600 max-w-[140px] truncate" title={cal.agency}>
                        {cal.agency || '未登记'}
                      </td>

                      <td className="px-4 py-2.5 font-mono text-[11px] text-indigo-700 font-bold whitespace-nowrap">
                        {item.calibrationCertificateNo || cal.certificateNo}
                      </td>

                      <td className="px-4 py-2.5 font-mono text-slate-500 whitespace-nowrap">
                        {item.lastCalibrationDate || cal.lastDate}
                      </td>

                      <td className="px-4 py-2.5 font-mono font-bold text-slate-800 whitespace-nowrap">
                        {item.nextCalibrationDate || cal.nextDate}
                      </td>

                      <td className="px-4 py-2.5 whitespace-nowrap">
                        {cal.statusType === 'overdue' ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-100 text-rose-800 border border-rose-300 inline-flex items-center gap-1">
                            <AlertCircle className="w-3 h-3 text-rose-600" />
                            超期 {Math.abs(cal.daysRemaining || 0)} 天 [禁临床]
                          </span>
                        ) : cal.statusType === 'due_soon' ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300 inline-flex items-center gap-1">
                            <Clock className="w-3 h-3 text-amber-600" />
                            剩余 {cal.daysRemaining} 天
                          </span>
                        ) : cal.statusType === 'exempt' ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600">
                            免计量
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            正常在效期
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-2.5 text-right whitespace-nowrap space-x-1">
                        <button
                          type="button"
                          onClick={() => setCertificateDevice(item)}
                          className="px-2 py-1 bg-slate-100 hover:bg-indigo-50 text-indigo-700 border border-indigo-200 rounded text-xs font-semibold cursor-pointer transition"
                          title="查看国家计量检定证书档案"
                        >
                          查验证书
                        </button>

                        <button
                          type="button"
                          onClick={() => setRegisterDevice(item)}
                          className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 rounded text-xs font-semibold cursor-pointer transition"
                          title="录入并登记最新一期检定结论"
                        >
                          检定登记
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        )}

        {activeSubTab === 'pm_plans' && (
          <table className="w-full text-left border-collapse text-xs">
            <thead className="sticky top-0 bg-slate-50 z-10 shadow-2xs border-b border-slate-200">
              <tr className="text-slate-600 text-xs font-bold uppercase tracking-wider">
                <th className="px-4 py-2.5">Asset ID / 编号</th>
                <th className="px-4 py-2.5">Asset Name / 设备名称</th>
                <th className="px-4 py-2.5">Dept / 科室</th>
                <th className="px-4 py-2.5">Manager / 负责人</th>
                <th className="px-4 py-2.5">Last PM / 上次维保</th>
                <th className="px-4 py-2.5">Next PM / 预计下次</th>
                <th className="px-4 py-2.5">PM 内容要点</th>
                <th className="px-4 py-2.5 text-right">Action / 操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {paginatedList.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/80 transition">
                  <td className="px-4 py-2.5 font-mono text-slate-600 font-medium whitespace-nowrap">
                    {item.assetNo || item.id}
                  </td>
                  <td className="px-4 py-2.5 font-medium text-slate-800">
                    <div className="font-bold text-slate-900">{item.name}</div>
                    <span className="block text-[11px] text-slate-400 font-normal">{item.model || '-'}</span>
                  </td>
                  <td className="px-4 py-2.5 font-medium text-slate-700 whitespace-nowrap">{item.department}</td>
                  <td className="px-4 py-2.5 whitespace-nowrap">{item.manager || '科室管理员'}</td>
                  <td className="px-4 py-2.5 font-mono text-slate-500 whitespace-nowrap">{item.lastMaintenanceDate || '2025-06-10'}</td>
                  <td className="px-4 py-2.5 font-mono font-bold text-blue-600 whitespace-nowrap">
                    {item.nextMaintenanceDate || '2026-06-10'}
                  </td>
                  <td className="px-4 py-2.5 text-slate-500 text-[11px]">
                    常规清洁除尘、管路气密性检测、电源接地泄漏电流测试与校零
                  </td>
                  <td className="px-4 py-2.5 text-right whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => onOpenRepairModalForDevice(item)}
                      className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded text-xs font-semibold cursor-pointer transition"
                    >
                      发起保养派工
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {activeSubTab === 'agencies' && (
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              {
                name: '山东省计量科学研究院',
                level: '省级法定计量检定机构',
                cma: '202115003889',
                cnas: 'L0294',
                scope: '医学影像(CT/MR/DSA)、医用超声、心电脑电、放疗直线加速器、核医学仪器',
                address: '山东省济南市历下区千佛山东路28号',
                contact: '李工 / 0531-82605118',
                type: '免费免征法定强检承检单位'
              },
              {
                name: '日照市检验检测中心 (法定计量所)',
                level: '地市级综合检验检测机构',
                cma: '202215001204',
                cnas: 'L3890',
                scope: '常规DR机、心电图机、血压计、监护仪、生化分析仪、灭菌器压力表',
                address: '山东省日照市北京路188号',
                contact: '王工 / 0633-8772091',
                type: '五莲县属地法定送检定点单位'
              },
              {
                name: '五莲县综合检验检测中心 (计量股)',
                level: '县级法定计量检定所',
                cma: '202315009182',
                cnas: '-',
                scope: '电子血压计、人体秤、温湿度计、离心机转速',
                address: '山东省五莲县幸福路36号',
                contact: '徐主任 / 0633-5213088',
                type: '基础器具就地快速强检'
              },
              {
                name: '广州广电计量检测股份有限公司 (济南分公司)',
                level: '第三方具备 CNAS/CMA 资质校准实验室',
                cma: '202019001188',
                cnas: 'L2932',
                scope: '输液泵/注射泵、除颤监护仪、高频电刀、婴儿暖箱、呼吸机综合校准',
                address: '济南市高新区舜华路大学科技园',
                contact: '陈经理 / 0531-88891002',
                type: '商业自费定期校准协议供应商'
              }
            ].map((agency, idx) => (
              <div key={idx} className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-2 text-xs">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-sm">{agency.name}</h3>
                    <div className="text-[11px] text-slate-500 mt-0.5">{agency.level}</div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {agency.type}
                  </span>
                </div>

                <div className="space-y-1 text-slate-600 text-[11px]">
                  <div><strong>资质证书:</strong> CMA: {agency.cma} ｜ CNAS: {agency.cnas}</div>
                  <div><strong>主检范围:</strong> {agency.scope}</div>
                  <div><strong>通讯地址:</strong> {agency.address}</div>
                  <div><strong>业务联系:</strong> {agency.contact}</div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    onClick={() => setIsBatchDispatchOpen(true)}
                    className="px-3 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded text-xs font-bold cursor-pointer transition"
                  >
                    委托此机构检定
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination Footer */}
      {activeSubTab !== 'agencies' && (
        <Pagination
          currentPage={currentPage}
          pageSize={pageSize}
          totalCount={currentList.length}
          onPageChange={setCurrentPage}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setCurrentPage(1);
          }}
        />
      )}

      {/* 计量检定溯源证书预览模态框 */}
      <MetrologyCertificateViewModal
        isOpen={!!certificateDevice}
        equipment={certificateDevice}
        onClose={() => setCertificateDevice(null)}
      />

      {/* 计量检定登记模态框 */}
      <MetrologyRegistrationModal
        isOpen={!!registerDevice}
        equipment={registerDevice}
        onClose={() => setRegisterDevice(null)}
        onSubmit={handleSaveCalibrationResult}
      />

      {/* 批量送检委托派工模态框 */}
      <MetrologyBatchDispatchModal
        isOpen={isBatchDispatchOpen}
        equipments={equipmentList}
        onClose={() => setIsBatchDispatchOpen(false)}
        onDispatchSuccess={(count, agency, batchNo) => {
          showToast(`已成功生成送检委托单: 批次 ${batchNo} 共 ${count} 台设备指派至 ${agency}`);
        }}
      />

    </div>
  );
};

import React, { useState, useEffect, useMemo } from 'react';
import { MedicalEquipment, EquipmentLoanRecord, StaffPersonMaster, AuthUser, DepartmentMaster } from '../types';
import { getEquipmentPhoto } from '../utils/equipmentPhotoUtils';
import { ImagePreviewModal } from './ImagePreviewModal';
import {
  RotateCcw,
  X,
  Building2,
  Calendar,
  Clock,
  User,
  Phone,
  FileText,
  PackageCheck,
  AlertTriangle,
  CheckCircle2,
  ShieldCheck,
  Tag,
  Printer,
  Check,
  Sparkles,
  Eye,
  Camera,
  Lock
} from 'lucide-react';

interface ReturnEquipmentModalProps {
  isOpen: boolean;
  equipment: MedicalEquipment | null;
  currentUser?: AuthUser | null;
  staff?: StaffPersonMaster[];
  departments?: DepartmentMaster[];
  restrictToDepartment?: string;
  onClose: () => void;
  onConfirm: (
    equipmentId: string,
    returnDetails: {
      actualReturnTime: string;
      returnReceiverName: string;
      returnNotes: string;
      equipmentStatusAfterReturn: '正常运行' | '维护保养中' | '故障待修';
    },
    shouldPrint?: boolean
  ) => void;
}

// 辅助科室名称模糊匹配函数
const normalizeDept = (deptName?: string) => {
  if (!deptName) return '';
  return deptName.trim().replace(/[\(（].*?[\)）]/g, '').trim();
};

const isDeptMatch = (staffDept?: string, targetDept?: string) => {
  if (!staffDept || !targetDept) return false;
  const s = staffDept.trim();
  const t = targetDept.trim();
  if (s === t) return true;
  const sNorm = normalizeDept(s);
  const tNorm = normalizeDept(t);
  if (sNorm && tNorm && (sNorm === tNorm || sNorm.includes(tNorm) || tNorm.includes(sNorm))) return true;
  return false;
};

export const ReturnEquipmentModal: React.FC<ReturnEquipmentModalProps> = ({
  isOpen,
  equipment,
  currentUser,
  staff = [],
  departments = [],
  restrictToDepartment,
  onClose,
  onConfirm
}) => {
  const currentLoan = equipment?.currentLoan;

  const isUnauthorized = Boolean(
    restrictToDepartment &&
    currentLoan?.borrowingDepartment &&
    !isDeptMatch(currentLoan.borrowingDepartment, restrictToDepartment)
  );

  const now = new Date();
  const defaultReturnTime = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  const [actualReturnTime, setActualReturnTime] = useState(defaultReturnTime);
  const [returnReceiverName, setReturnReceiverName] = useState(currentUser?.name || '医工责任人');
  const [equipmentStatusAfterReturn, setEquipmentStatusAfterReturn] = useState<'正常运行' | '维护保养中' | '故障待修'>('正常运行');
  const [returnNotes, setReturnNotes] = useState('设备外观完好，通电试运行正常，随机移交配件已逐项清点无遗漏。');
  const [checkedAccessories, setCheckedAccessories] = useState<string[]>([]);
  const [printAfterSave, setPrintAfterSave] = useState(false);
  const [showPhotoPreview, setShowPhotoPreview] = useState(false);

  // Helper date format utilities
  const formatToDateTimeStr = (d: Date): string => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const mins = String(d.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${mins}`;
  };

  const toInputDateVal = (str: string): string => {
    if (!str) return '';
    const clean = str.trim().replace(' ', 'T');
    return clean.length === 16 ? clean : clean.slice(0, 16);
  };

  const fromInputDateVal = (val: string): string => {
    if (!val) return '';
    return val.replace('T', ' ');
  };

  const handleSetActualReturnToNow = () => {
    const now = new Date();
    setActualReturnTime(formatToDateTimeStr(now));
  };

  const ownerDept = equipment?.ownerDepartment || equipment?.department || '医疗设备科';
  const borrowingDept = currentLoan?.borrowingDepartment || '借用科室';

  // 设备所在产权科室人员（验收接收人严格限定在此科室范围内）
  const ownerDeptStaff = useMemo(() => {
    if (!staff || staff.length === 0) return [];
    return staff.filter(s => isDeptMatch(s.departmentName, ownerDept));
  }, [staff, ownerDept]);

  // 验收人员全量候选列表
  const receiverCandidates = ownerDeptStaff;

  // 初始化
  useEffect(() => {
    if (isOpen && equipment) {
      const n = new Date();
      setActualReturnTime(`${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')} ${String(n.getHours()).padStart(2, '0')}:${String(n.getMinutes()).padStart(2, '0')}`);
      
      // 验收人优先当前登录人（若属于所在科室），否则所在科室负责人
      if (currentUser?.name && isDeptMatch(currentUser.departmentName, ownerDept)) {
        setReturnReceiverName(currentUser.name);
      } else if (ownerDeptStaff.length > 0) {
        const primary = ownerDeptStaff.find(p => p.isEquipmentAdmin) || ownerDeptStaff.find(p => p.isPrimaryContact) || ownerDeptStaff[0];
        setReturnReceiverName(primary.name);
      } else {
        setReturnReceiverName(currentUser?.name || '');
      }

      setEquipmentStatusAfterReturn('正常运行');
      setReturnNotes('设备外观完好，通电试运行正常，随机移交配件已逐项清点无遗漏。');
      setPrintAfterSave(false);

      if (currentLoan?.accessories) {
        setCheckedAccessories([...currentLoan.accessories]);
      } else {
        setCheckedAccessories(['主机专用电源线与电源适配器']);
      }
    }
  }, [isOpen, equipment, currentLoan, currentUser, ownerDept, ownerDeptStaff]);

  if (!isOpen || !equipment || !currentLoan) return null;

  const handleToggleAccessoryCheck = (acc: string) => {
    if (checkedAccessories.includes(acc)) {
      setCheckedAccessories(checkedAccessories.filter(a => a !== acc));
    } else {
      setCheckedAccessories([...checkedAccessories, acc]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isUnauthorized) {
      alert(`⚠️ 权限受限：该设备由【${currentLoan?.borrowingDepartment}】借用，您当前仅具备【${restrictToDepartment}】的操作权限，禁止跨科室执行归还验收！`);
      return;
    }
    if (!returnReceiverName.trim()) {
      alert('请输入验收接收人姓名');
      return;
    }

    onConfirm(
      equipment.id,
      {
        actualReturnTime,
        returnReceiverName: returnReceiverName.trim(),
        returnNotes: returnNotes.trim(),
        equipmentStatusAfterReturn
      },
      printAfterSave
    );
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
      <div className="relative w-full max-w-3xl lg:max-w-4xl bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-teal-500/20 text-teal-300 flex items-center justify-center border border-teal-500/30 shrink-0">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight text-white flex items-center gap-2 flex-wrap">
                <span>医疗设备借用归还 / 验收交接登记</span>
                <span className="text-xs font-normal px-2 py-0.5 rounded bg-teal-950 text-teal-300 border border-teal-800/60">
                  原产权科室验收
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                核验归还设备运行状态、清点随借配件并更新主台账资产位置
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer shrink-0 ml-2"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 p-6 space-y-5 text-slate-800 text-xs sm:text-sm">
          
          {/* 权限受限警告横幅 */}
          {isUnauthorized && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-rose-900 shadow-2xs">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="text-xs">
                <div className="font-bold flex items-center gap-1.5 text-rose-950">
                  <Lock className="w-3.5 h-3.5 text-rose-600" />
                  <span>科室权限不符 · 禁止代其他科室执行归还验收</span>
                </div>
                <div className="mt-1 text-rose-700 leading-relaxed">
                  该设备当前借调在用科室为【<strong>{currentLoan?.borrowingDepartment}</strong>】，而您当前登录科室为【<strong>{restrictToDepartment}</strong>】。根据医疗设备流转权限隔离保护规则，您无权对其他科室借调的应急设备执行归还结案操作。
                </div>
              </div>
            </div>
          )}

          {/* 1. Loan Info Card (Optimized layout with photo) */}
          <div className="bg-gradient-to-r from-slate-50 to-teal-50/40 rounded-xl p-4 border border-slate-200/90 shadow-2xs">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3.5 pb-3.5 border-b border-slate-200/70">
              <div className="flex items-center gap-3.5 min-w-0">
                {/* Equipment Real Photo Thumbnail */}
                <div 
                  onClick={() => setShowPhotoPreview(true)}
                  className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-slate-900 overflow-hidden shrink-0 border-2 border-white ring-1 ring-slate-200/90 cursor-pointer relative group/p shadow-sm hover:ring-teal-500 transition-all duration-200"
                  title="点击查看设备高清实物照片"
                >
                  <img
                    src={getEquipmentPhoto(equipment)}
                    alt={equipment.name}
                    className="w-full h-full object-cover group-hover/p:scale-110 transition-transform duration-200"
                  />
                  <div className="absolute inset-0 bg-black/45 opacity-0 group-hover/p:opacity-100 flex flex-col items-center justify-center text-white transition-opacity gap-0.5">
                    <Eye className="w-4 h-4" />
                    <span className="text-[9px] font-bold">查看实物</span>
                  </div>
                  <div className="absolute bottom-1 right-1 px-1 py-0.2 rounded bg-black/60 text-[9px] text-white/90 font-mono backdrop-blur-xs flex items-center gap-0.5 pointer-events-none">
                    <Camera className="w-2.5 h-2.5 text-teal-300" />
                  </div>
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-bold text-teal-900 bg-white px-2 py-0.5 rounded border border-teal-200 shadow-2xs shrink-0">
                      {equipment.id}
                    </span>
                    <h3 className="font-bold text-slate-900 text-sm sm:text-base truncate" title={equipment.name}>
                      {equipment.name}
                    </h3>
                  </div>
                  <div className="text-xs text-slate-500 flex items-center gap-2 mt-1 truncate flex-wrap">
                    <span>型号: <strong className="font-medium text-slate-700">{equipment.model || '标准型'}</strong></span>
                    {equipment.sn && (
                      <>
                        <span className="text-slate-300">|</span>
                        <span>SN: <span className="font-mono text-slate-700">{equipment.sn}</span></span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 flex-wrap">
                <div className="flex items-center gap-1 text-xs">
                  <span className="text-slate-500">归属:</span>
                  <span className="font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                    {ownerDept}
                  </span>
                </div>
                <span className="text-slate-400">→</span>
                <div className="flex items-center gap-1 text-xs">
                  <span className="text-slate-500">借入方:</span>
                  <span className="font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                    {borrowingDept}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Specs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 text-xs">
              <div className="bg-white/85 p-2 rounded-lg border border-slate-200/60 shadow-2xs">
                <span className="text-slate-400 text-[11px] block mb-0.5">生产厂家</span>
                <span className="font-semibold text-slate-800 truncate block">
                  {equipment.manufacturer || '—'}
                </span>
              </div>
              <div className="bg-white/85 p-2 rounded-lg border border-slate-200/60 shadow-2xs">
                <span className="text-slate-400 text-[11px] block mb-0.5">归还原存放处</span>
                <span className="font-semibold text-slate-800 truncate block">
                  {equipment.building || '院区综合楼'} {equipment.floor ? `${equipment.floor}F` : ''}
                </span>
              </div>
              <div className="bg-white/85 p-2 rounded-lg border border-slate-200/60 shadow-2xs">
                <span className="text-slate-400 text-[11px] block mb-0.5">借出经办人</span>
                <span className="font-semibold text-slate-800 truncate block">
                  {currentLoan?.lenderName || '设备管理员'}
                </span>
              </div>
              <div className="bg-white/85 p-2 rounded-lg border border-slate-200/60 shadow-2xs">
                <span className="text-slate-400 text-[11px] block mb-0.5">当前状态</span>
                <span className="font-bold text-amber-700">
                  出借在用
                </span>
              </div>
            </div>
          </div>

          {/* 2. Original Loan Parameters */}
          <div className="bg-white rounded-lg p-4 border border-slate-200 space-y-3">
            <div className="flex items-center gap-2 font-bold text-slate-900 text-sm border-b border-slate-100 pb-2">
              <Clock className="w-4 h-4 text-teal-600" />
              <span>借调记录与时效信息</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-slate-50 p-3 rounded-lg border border-slate-200">
              <div>
                <span className="text-slate-500 block mb-0.5">借用经手人</span>
                <span className="font-bold text-slate-900">
                  {currentLoan.borrowerName} {currentLoan.borrowerPhone ? `(${currentLoan.borrowerPhone})` : ''}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block mb-0.5">出借起始时间</span>
                <span className="font-mono text-slate-800">{currentLoan.borrowTime}</span>
              </div>
              <div>
                <span className="text-slate-500 block mb-0.5">约定归还时间</span>
                <span className="font-mono font-bold text-amber-900">{currentLoan.expectedReturnTime}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-teal-600" />
                    <span>实际归还交接时间 <span className="text-rose-500">*</span></span>
                  </label>
                  <button
                    type="button"
                    onClick={handleSetActualReturnToNow}
                    className="text-[11px] text-teal-700 hover:text-teal-900 font-medium px-2 py-0.5 rounded bg-teal-50 hover:bg-teal-100 border border-teal-200/70 transition cursor-pointer flex items-center gap-1"
                    title="将归还时间设为当前时刻"
                  >
                    <Clock className="w-3 h-3 text-teal-600" />
                    <span>设为此时此刻</span>
                  </button>
                </div>
                <input
                  type="datetime-local"
                  value={toInputDateVal(actualReturnTime)}
                  onChange={(e) => {
                    const val = fromInputDateVal(e.target.value);
                    if (val) setActualReturnTime(val);
                  }}
                  required
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-teal-500 focus:border-teal-500 font-mono font-bold text-slate-900 shadow-2xs"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  可点选日历时间或点击上方一键设为当前时间
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                  <span>验收接收人 (限定设备所在科室人员) <span className="text-rose-500">*</span></span>
                  <span className="text-[11px] font-medium text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200">
                    {ownerDept} ({ownerDeptStaff.length}人)
                  </span>
                </label>
                {ownerDeptStaff.length > 0 ? (
                  <div className="space-y-1.5">
                    <select
                      value={returnReceiverName}
                      onChange={(e) => setReturnReceiverName(e.target.value)}
                      required
                      className="w-full bg-white border border-teal-400 ring-1 ring-teal-200 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-teal-500 focus:border-teal-500 font-semibold text-slate-900 cursor-pointer"
                    >
                      <option value="">-- 请选择验收接收人 ({ownerDeptStaff.length}位科室成员) --</option>
                      {ownerDeptStaff.map((p) => (
                        <option key={`rx-owner-${p.id || p.employeeNo || p.name}`} value={p.name}>
                          {p.name} {p.title ? `(${p.title})` : ''} {p.role ? `[${p.role}]` : ''} {p.phone ? `· 📞${p.phone}` : ''}
                        </option>
                      ))}
                    </select>

                    {/* Quick select pills */}
                    <div className="flex flex-wrap gap-1.5 pt-0.5">
                      <span className="text-[11px] text-slate-400 flex items-center gap-1 mr-0.5">
                        <User className="w-3 h-3 text-teal-600" /> 科室验收人:
                      </span>
                      {ownerDeptStaff.slice(0, 5).map((p) => {
                        const isSelected = returnReceiverName === p.name;
                        return (
                          <button
                            key={p.id || p.employeeNo || p.name}
                            type="button"
                            onClick={() => setReturnReceiverName(p.name)}
                            className={`px-2 py-0.5 rounded text-[11px] font-medium border transition-colors cursor-pointer ${
                              isSelected
                                ? 'bg-teal-600 text-white border-teal-600 shadow-xs'
                                : 'bg-teal-50/70 text-teal-800 border-teal-200 hover:bg-teal-100'
                            }`}
                          >
                            {p.name} {p.title ? `(${p.title})` : ''}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <input
                    type="text"
                    value={returnReceiverName}
                    onChange={(e) => setReturnReceiverName(e.target.value)}
                    placeholder={`输入【${ownerDept}】验收接收人`}
                    required
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-teal-500 focus:border-teal-500 font-medium"
                  />
                )}
                <span className="text-[11px] text-slate-400 mt-1 block">
                  验收接收人严格限定在设备所在科室【{ownerDept}】在册人员
                </span>
              </div>
            </div>
          </div>

          {/* 3. Accessories Returned Check */}
          <div className="bg-white rounded-lg p-4 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                <PackageCheck className="w-4 h-4 text-teal-600" />
                <span>随借配件归还逐项清点</span>
              </div>
              <span className="text-xs text-slate-500">
                已核验 {checkedAccessories.length} / {currentLoan.accessories?.length || 1} 项
              </span>
            </div>

            <p className="text-xs text-slate-500">
              请逐一核对借出时登记的随借配件是否完好齐全：
            </p>

            <div className="space-y-2">
              {(currentLoan.accessories && currentLoan.accessories.length > 0 ? currentLoan.accessories : ['主机专用电源线与电源适配器']).map((acc, idx) => {
                const isChecked = checkedAccessories.includes(acc);
                return (
                  <label
                    key={idx}
                    onClick={() => handleToggleAccessoryCheck(acc)}
                    className={`flex items-center gap-2.5 p-2.5 rounded-lg border text-xs cursor-pointer transition-all ${
                      isChecked
                        ? 'bg-emerald-50/80 border-emerald-400 text-emerald-950 font-medium'
                        : 'bg-rose-50/50 border-rose-300 text-rose-900'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded flex items-center justify-center border transition-colors shrink-0 ${
                        isChecked
                          ? 'bg-emerald-600 border-emerald-600 text-white'
                          : 'border-rose-400 bg-white'
                      }`}
                    >
                      {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                    <span className="flex-1 font-medium">{acc}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded font-mono">
                      {isChecked ? '已清点齐全' : '待确认/遗失'}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* 4. Equipment Status & Acceptance Conclusion */}
          <div className="bg-white rounded-lg p-4 border border-slate-200 space-y-3">
            <div className="flex items-center gap-2 font-bold text-slate-900 text-sm border-b border-slate-100 pb-2">
              <ShieldCheck className="w-4 h-4 text-teal-600" />
              <span>归还后设备运行状态判定</span>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {[
                { label: '正常运行', desc: '外观无损，开机自检与指标正常' },
                { label: '维护保养中', desc: '需进行清洁消毒、定标校准' },
                { label: '故障待修', desc: '发生故障或附件损坏，需报修' }
              ].map((item) => {
                const isSelected = equipmentStatusAfterReturn === item.label;
                return (
                  <label
                    key={item.label}
                    onClick={() => setEquipmentStatusAfterReturn(item.label as any)}
                    className={`p-3 rounded-lg border text-xs cursor-pointer transition-all text-center ${
                      isSelected
                        ? 'bg-teal-50 border-teal-500 ring-2 ring-teal-500/20 text-teal-950 font-bold'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="font-semibold text-slate-900 mb-1">{item.label}</div>
                    <div className="text-[11px] text-slate-500 font-normal leading-tight">{item.desc}</div>
                  </label>
                );
              })}
            </div>

            {/* 4. Electronic Signature & Paperless Close-out Preview */}
            <div className="bg-gradient-to-r from-emerald-50/80 to-teal-50/80 rounded-xl p-4 border border-emerald-200 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-700" />
                  <span className="text-xs font-bold text-emerald-950">
                    全流程 CA 电子签章与闭环核销存证
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-900 text-[10px] font-bold">
                    🌱 绿色无纸化
                  </span>
                </div>
                <span className="text-[11px] text-emerald-800 font-mono">
                  CA-WLH-{Date.now().toString().slice(-6)}-SEC
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="bg-white p-3 rounded-lg border border-emerald-200 shadow-2xs">
                  <div className="text-[11px] text-slate-500 flex justify-between items-center mb-1">
                    <span className="font-semibold text-slate-700">【借入科室】交机责任人</span>
                    <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1 rounded">交还确认</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-slate-900 font-semibold text-sm">
                      {currentLoan.borrowerName}
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono">{currentLoan.borrowingDepartment}</span>
                  </div>
                </div>

                <div className="bg-white p-3 rounded-lg border border-emerald-200 shadow-2xs">
                  <div className="text-[11px] text-slate-500 flex justify-between items-center mb-1">
                    <span className="font-semibold text-slate-700">【医工科】验收接收工程师</span>
                    <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1 rounded">质控验收</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-slate-900 font-semibold text-sm">
                      {returnReceiverName || '医工工程师'}
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono">医学装备中心</span>
                  </div>
                </div>
              </div>

              <p className="text-[11px] text-emerald-800/90 leading-relaxed">
                验收确认后，双阶段电子签名自动封签并存入设备全生命周期云端档案，<strong>全流程无纸化闭环，非必要无需打印纸质单据</strong>。
              </p>
            </div>

            <div className="pt-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                归还验收交接结论与备注
              </label>
              <textarea
                rows={2}
                value={returnNotes}
                onChange={(e) => setReturnNotes(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-xs focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              />
            </div>

            {/* Print paper document option */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={printAfterSave}
                  onChange={(e) => setPrintAfterSave(e.target.checked)}
                  className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500 border-slate-300"
                />
                <span className="text-xs font-medium text-slate-600 flex items-center gap-1.5">
                  <Printer className="w-3.5 h-3.5 text-slate-400" />
                  外部纸质审计特殊需求：结案后调起纸质打印（默认关闭，倡导绿色无纸化）
                </span>
              </label>
            </div>
          </div>
        </form>

        {/* Footer Actions */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-500 flex items-center gap-1">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>确认归还后，设备当前在用科室恢复为产权科室并完成无纸化电子归档</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              type="button"
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg shadow-2xs transition-colors cursor-pointer"
            >
              取消
            </button>
            <button
              onClick={handleSubmit}
              type="button"
              disabled={isUnauthorized}
              className={`inline-flex items-center gap-1.5 px-5 py-2 text-xs font-semibold rounded-lg shadow-sm transition-colors ${
                isUnauthorized
                  ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                  : 'text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 cursor-pointer'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isUnauthorized ? '无权归还其他科室设备' : '确认电子验收结案 (无纸化双签)'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Image Zoom / Photo Preview Modal */}
      {showPhotoPreview && (
        <ImagePreviewModal
          isOpen={showPhotoPreview}
          equipment={equipment}
          photoUrl={getEquipmentPhoto(equipment)}
          onClose={() => setShowPhotoPreview(false)}
        />
      )}
    </div>
  );
};

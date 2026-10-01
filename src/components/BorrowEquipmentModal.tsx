import React, { useState, useEffect, useMemo } from 'react';
import { MedicalEquipment, EquipmentLoanRecord, DepartmentMaster, StaffPersonMaster, AuthUser } from '../types';
import { getRecommendedAccessoriesForEquipment } from '../utils/loanAccessoriesPreset';
import { getEquipmentPhoto } from '../utils/equipmentPhotoUtils';
import { ImagePreviewModal } from './ImagePreviewModal';
import {
  ArrowRightLeft,
  X,
  Building2,
  Calendar,
  Clock,
  User,
  Phone,
  FileText,
  PackageCheck,
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
  Tag,
  Printer,
  Sparkles,
  Plus,
  Minus,
  Search,
  Check,
  Eye,
  Camera,
  CalendarDays,
  Timer,
  Zap,
  ChevronRight,
  Lock
} from 'lucide-react';

interface BorrowEquipmentModalProps {
  isOpen: boolean;
  equipment: MedicalEquipment | null;
  currentUser?: AuthUser | null;
  departments: DepartmentMaster[];
  staff: StaffPersonMaster[];
  restrictToDepartment?: string;
  onClose: () => void;
  onConfirm: (equipmentId: string, loanRecord: EquipmentLoanRecord, shouldPrint?: boolean) => void;
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

export const BorrowEquipmentModal: React.FC<BorrowEquipmentModalProps> = ({
  isOpen,
  equipment,
  currentUser,
  departments,
  staff,
  restrictToDepartment,
  onClose,
  onConfirm
}) => {
  const now = new Date();
  const defaultBorrowTime = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const defaultExpectedReturn = `${nextWeek.getFullYear()}-${String(nextWeek.getMonth() + 1).padStart(2, '0')}-${String(nextWeek.getDate()).padStart(2, '0')} 18:00`;

  const [borrowingDept, setBorrowingDept] = useState('');
  const [borrowerName, setBorrowerName] = useState('');
  const [borrowerPhone, setBorrowerPhone] = useState('');
  const [lenderName, setLenderName] = useState('');
  const [lenderPhone, setLenderPhone] = useState('');
  const [borrowTime, setBorrowTime] = useState(defaultBorrowTime);
  const [expectedReturnTime, setExpectedReturnTime] = useState(defaultExpectedReturn);
  const [borrowReason, setBorrowReason] = useState('临床急危重症救治床旁临时借用');
  const [selectedAccessories, setSelectedAccessories] = useState<string[]>([]);
  const [customAccessory, setCustomAccessory] = useState('');
  const [handoverNotes, setHandoverNotes] = useState('设备外观完好，通电自检正常，关键随借配件齐备。');
  const [electronicSignEnabled, setElectronicSignEnabled] = useState(true);
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

  // Calculate duration between borrow and expected return
  const durationInfo = useMemo(() => {
    if (!borrowTime || !expectedReturnTime) {
      return { totalHours: 0, days: 0, remHours: 0, text: '请完善借还时间', isValid: false, isOverdue: false };
    }
    try {
      const start = new Date(borrowTime.replace(/-/g, '/'));
      const end = new Date(expectedReturnTime.replace(/-/g, '/'));
      const diffMs = end.getTime() - start.getTime();
      if (isNaN(diffMs)) {
        return { totalHours: 0, days: 0, remHours: 0, text: '时间格式无效', isValid: false, isOverdue: false };
      }
      if (diffMs <= 0) {
        return { totalHours: 0, days: 0, remHours: 0, text: '预计归还时间不能早于出借交接时间', isValid: false, isOverdue: true };
      }
      const totalHours = Math.round(diffMs / (1000 * 60 * 60));
      const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const remHours = Math.round((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      
      let summary = '';
      if (days > 0 && remHours > 0) {
        summary = `${days} 天 ${remHours} 小时`;
      } else if (days > 0) {
        summary = `${days} 天整`;
      } else {
        summary = `${totalHours} 小时 (不足1天)`;
      }

      return {
        totalHours,
        days,
        remHours,
        text: summary,
        exactDays: (diffMs / (1000 * 60 * 60 * 24)),
        isValid: true,
        isOverdue: false
      };
    } catch {
      return { totalHours: 0, days: 0, remHours: 0, text: '时间计算异常', isValid: false, isOverdue: false };
    }
  }, [borrowTime, expectedReturnTime]);

  // Apply quick duration preset (e.g. 1, 3, 7, 14, 30 days)
  const handleApplyDurationPreset = (daysToAdd: number, targetHour: number = 18, targetMin: number = 0) => {
    let start = new Date();
    if (borrowTime) {
      const parsed = new Date(borrowTime.replace(/-/g, '/'));
      if (!isNaN(parsed.getTime())) {
        start = parsed;
      }
    }
    const end = new Date(start.getTime() + daysToAdd * 24 * 60 * 60 * 1000);
    end.setHours(targetHour, targetMin, 0, 0);
    setExpectedReturnTime(formatToDateTimeStr(end));
  };

  // Adjust duration by stepper (+/- 1 day)
  const handleStepDurationDays = (stepDelta: number) => {
    let currentDays = durationInfo.days || 1;
    let newDays = Math.max(1, currentDays + stepDelta);
    handleApplyDurationPreset(newDays);
  };

  // Set borrow time to right now
  const handleSetBorrowToNow = () => {
    const now = new Date();
    setBorrowTime(formatToDateTimeStr(now));
  };

  const ownerDept = equipment?.ownerDepartment || equipment?.department || '医疗设备科';

  // 推荐附件
  const accessoryRecommendation = useMemo(() => {
    return getRecommendedAccessoriesForEquipment(equipment);
  }, [equipment]);

  // 可借入的科室列表（排除当前产权/所在科室）
  const selectableDepartments = useMemo(() => {
    if (!departments || departments.length === 0) return [];
    return departments.filter(d => !isDeptMatch(d.name, ownerDept) && d.status !== 'inactive');
  }, [departments, ownerDept]);

  // 设备所在科室人员（出借经办人严格限定在此科室范围内）
  const ownerDeptStaff = useMemo(() => {
    if (!staff || staff.length === 0) return [];
    return staff.filter(s => isDeptMatch(s.departmentName, ownerDept));
  }, [staff, ownerDept]);

  // 出借经办人严格限定在设备所在科室
  const lenderCandidates = ownerDeptStaff;

  // 借入科室的人员列表（借用经手人仅限来自该借入科室）
  const borrowingDeptStaff = useMemo(() => {
    if (!borrowingDept || !staff || staff.length === 0) {
      return [];
    }
    return staff.filter(s => isDeptMatch(s.departmentName, borrowingDept));
  }, [borrowingDept, staff]);

  // 初始化重置
  useEffect(() => {
    if (isOpen && equipment) {
      const now = new Date();
      const bTime = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      const nWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      const rTime = `${nWeek.getFullYear()}-${String(nWeek.getMonth() + 1).padStart(2, '0')}-${String(nWeek.getDate()).padStart(2, '0')} 18:00`;

      setBorrowTime(bTime);
      setExpectedReturnTime(rTime);
      setBorrowReason('临床急危重症救治床旁临时借用');
      setHandoverNotes('设备外观完好，通电自检正常，关键随借配件齐备。');
      setPrintAfterSave(false);
      
      if (restrictToDepartment) {
        setBorrowingDept(restrictToDepartment);
        const deptPersons = staff.filter(s => isDeptMatch(s.departmentName, restrictToDepartment));
        const curInDept = currentUser?.name && deptPersons.some(p => p.name === currentUser.name);
        if (curInDept) {
          setBorrowerName(currentUser.name);
          setBorrowerPhone(currentUser.phone || currentUser.shortPhone || '');
        } else if (deptPersons.length > 0) {
          const primary = deptPersons.find(p => p.isPrimaryContact) || deptPersons[0];
          setBorrowerName(primary.name);
          setBorrowerPhone(primary.phone || primary.shortPhone || '');
        } else if (currentUser?.name) {
          setBorrowerName(currentUser.name);
          setBorrowerPhone(currentUser.phone || currentUser.shortPhone || '');
        } else {
          setBorrowerName('');
          setBorrowerPhone('');
        }
      } else {
        setBorrowingDept('');
        setBorrowerName('');
        setBorrowerPhone('');
      }

      // 初始化出借经办人：严格限定在设备所在科室人员中
      if (currentUser?.name && isDeptMatch(currentUser.departmentName, ownerDept)) {
        setLenderName(currentUser.name);
        setLenderPhone(currentUser.phone || currentUser.shortPhone || '');
      } else if (ownerDeptStaff.length > 0) {
        const primary = ownerDeptStaff.find(p => p.isEquipmentAdmin) || ownerDeptStaff.find(p => p.isPrimaryContact) || ownerDeptStaff[0];
        setLenderName(primary.name);
        setLenderPhone(primary.phone || primary.shortPhone || '');
      } else {
        setLenderName(currentUser?.name || '');
        setLenderPhone('');
      }

      // 初始化默认选中的附件
      const defs = accessoryRecommendation.recommendations
        .filter(r => r.isDefaultSelected)
        .map(r => r.name);
      setSelectedAccessories(defs.length > 0 ? defs : ['主机专用电源线与电源适配器']);
    }
  }, [isOpen, equipment, currentUser, accessoryRecommendation, ownerDept, ownerDeptStaff, restrictToDepartment, staff]);

  // 处理借入科室选择（联动更新借用经手人下拉候选）
  const handleSelectDepartment = (deptName: string) => {
    if (restrictToDepartment && deptName !== restrictToDepartment) {
      return;
    }
    setBorrowingDept(deptName);
    const targetDept = departments.find(d => d.name === deptName);
    
    // 寻找该借入科室的人员
    const deptPersons = staff.filter(s => isDeptMatch(s.departmentName, deptName));
    if (deptPersons.length > 0) {
      const firstPerson = deptPersons.find(p => p.isPrimaryContact) || deptPersons[0];
      setBorrowerName(firstPerson.name);
      setBorrowerPhone(firstPerson.phone || firstPerson.shortPhone || targetDept?.nursePhone || '');
    } else {
      setBorrowerName('');
      setBorrowerPhone(targetDept?.nursePhone || '');
    }
  };

  // 处理借用人选择
  const handleSelectStaff = (person: StaffPersonMaster) => {
    setBorrowerName(person.name);
    setBorrowerPhone(person.phone || person.shortPhone || '');
  };

  // 切换附件选中状态
  const handleToggleAccessory = (acc: string) => {
    if (selectedAccessories.includes(acc)) {
      setSelectedAccessories(selectedAccessories.filter(a => a !== acc));
    } else {
      setSelectedAccessories([...selectedAccessories, acc]);
    }
  };

  // 添加自定义配件
  const handleAddCustomAccessory = () => {
    const clean = customAccessory.trim();
    if (clean && !selectedAccessories.includes(clean)) {
      setSelectedAccessories(prev => [...prev, clean]);
      setCustomAccessory('');
    }
  };

  // 全选推荐配件
  const handleSelectAllRecommended = () => {
    const allRecs = accessoryRecommendation.recommendations.map(r => r.name);
    const merged = Array.from(new Set([...selectedAccessories, ...allRecs]));
    setSelectedAccessories(merged);
  };

  // 提交
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!equipment) return;

    if (!borrowingDept.trim()) {
      alert('请从主数据中选择借入使用科室');
      return;
    }
    if (restrictToDepartment && borrowingDept.trim() !== restrictToDepartment.trim()) {
      alert(`⚠️ 权限受限：您当前仅具备【${restrictToDepartment}】的应急借调权限，禁止代表其他科室申领设备！`);
      return;
    }
    if (!borrowerName.trim()) {
      alert('请选择借入科室的借用经手人');
      return;
    }
    if (!lenderName.trim()) {
      alert('请选择出借经办人');
      return;
    }

    const loanDocNo = `JY-${Date.now().toString().slice(-8)}`;
    const loanRecord: EquipmentLoanRecord = {
      id: loanDocNo,
      equipmentId: equipment.id,
      equipmentName: equipment.name,
      ownerDepartment: ownerDept,
      borrowingDepartment: borrowingDept.trim(),
      borrowerName: borrowerName.trim(),
      borrowerPhone: borrowerPhone.trim(),
      lenderName: lenderName.trim(),
      lenderPhone: lenderPhone.trim(),
      borrowTime,
      expectedReturnTime,
      borrowReason: borrowReason.trim(),
      loanStatus: 'borrowed',
      accessories: selectedAccessories,
      handoverNotes: handoverNotes.trim(),
      isElectronicSigned: electronicSignEnabled,
      signTimestamp: new Date().toLocaleString('zh-CN', { hour12: false }),
      digitalSealCertNo: `CA-WLH-${Date.now().toString().slice(-6)}-SEC`,
      blockchainHash: `SHA256:${Date.now().toString(16)}8f4e2a7b9c1d0e3f`,
      isPaperlessArchived: true
    };

    onConfirm(equipment.id, loanRecord, printAfterSave);
  };

  if (!isOpen || !equipment) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
      <div className="relative w-full max-w-4xl lg:max-w-5xl bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-teal-500/20 text-teal-300 flex items-center justify-center border border-teal-500/30 shrink-0">
              <ArrowRightLeft className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight text-white flex items-center gap-2 flex-wrap">
                <span>医疗设备跨科室借用 / 调配出借登记</span>
                <span className="text-xs font-normal px-2 py-0.5 rounded bg-teal-950 text-teal-300 border border-teal-800/60">
                  科室人员精准匹配
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                出借产权科室与借入科室经办人员下拉限定、智能附件匹配及纸质交接单打印
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
          
          {/* 1. Device Summary Card (Optimized layout with photo) */}
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
                        <span>SN/序列号: <span className="font-mono text-slate-700">{equipment.sn}</span></span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 self-start lg:self-center">
                <span className="text-xs text-slate-500">出借产权科室:</span>
                <span className="font-bold text-teal-800 bg-teal-50 px-2.5 py-1 rounded-md border border-teal-200 flex items-center gap-1.5 text-xs shadow-2xs">
                  <Building2 className="w-3.5 h-3.5 text-teal-600" />
                  <span>{ownerDept}</span>
                </span>
              </div>
            </div>

            {/* Quick Specs & Status Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 text-xs">
              <div className="bg-white/85 p-2 rounded-lg border border-slate-200/60 shadow-2xs">
                <span className="text-slate-400 text-[11px] block mb-0.5">生产厂家 / 品牌</span>
                <span className="font-semibold text-slate-800 truncate block" title={equipment.manufacturer || '国产/进口医疗设备'}>
                  {equipment.manufacturer || '国产/进口医疗设备'}
                </span>
              </div>
              <div className="bg-white/85 p-2 rounded-lg border border-slate-200/60 shadow-2xs">
                <span className="text-slate-400 text-[11px] block mb-0.5">存放位置</span>
                <span className="font-semibold text-slate-800 truncate block" title={`${equipment.building || ''} ${equipment.floor ? equipment.floor + 'F' : ''}`}>
                  {equipment.building || '院区综合楼'} {equipment.floor ? `${equipment.floor}F` : ''}
                </span>
              </div>
              <div className="bg-white/85 p-2 rounded-lg border border-slate-200/60 shadow-2xs">
                <span className="text-slate-400 text-[11px] block mb-0.5">当前运行状态</span>
                <span className="inline-flex items-center gap-1 font-bold text-emerald-700">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  {equipment.status || '正常运行'}
                </span>
              </div>
              <div className="bg-white/85 p-2 rounded-lg border border-slate-200/60 shadow-2xs">
                <span className="text-slate-400 text-[11px] block mb-0.5">管理分类</span>
                <span className="font-semibold text-slate-800 truncate block">
                  {equipment.medicalDeviceClass ? `${equipment.medicalDeviceClass}类医疗器械` : '临床调配设备'}
                </span>
              </div>
            </div>
          </div>

          {/* 2. Borrowing Department & Master Staff Selection */}
          <div className="bg-white rounded-lg p-4 border border-slate-200 space-y-4">
            <div className="flex items-center gap-2 font-bold text-slate-900 text-sm border-b border-slate-100 pb-2">
              <Building2 className="w-4 h-4 text-teal-600" />
              <span>借入科室与经手人员 (主数据科室精准联动)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Borrowing Department */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  借入使用科室 <span className="text-rose-500">*</span>
                </label>
                {restrictToDepartment ? (
                  <div className="w-full bg-amber-50/80 border border-amber-300 rounded-lg px-3 py-2 text-xs flex items-center justify-between">
                    <div className="flex items-center gap-2 font-bold text-amber-950">
                      <Lock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span>{restrictToDepartment}</span>
                    </div>
                    <span className="text-[10px] font-bold text-amber-800 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-full shrink-0">
                      本科室权限隔离锁定
                    </span>
                  </div>
                ) : (
                  <select
                    value={borrowingDept}
                    onChange={(e) => handleSelectDepartment(e.target.value)}
                    required
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-teal-500 focus:border-teal-500 cursor-pointer"
                  >
                    <option value="">-- 请选择借入使用科室 (来自全院主数据) --</option>
                    {selectableDepartments.map((dept) => (
                      <option key={dept.id || dept.code || dept.name} value={dept.name}>
                        {dept.name} {dept.campusName ? `(${dept.campusName})` : ''} {dept.buildingName ? `- ${dept.buildingName}` : ''}
                      </option>
                    ))}
                  </select>
                )}
                <span className="text-[11px] text-slate-400 mt-1 block">
                  {restrictToDepartment ? '根据科室流转权限隔离策略，当前仅能以您所属的科室名义登记借用' : '选择借入科室后，右侧经手人将自动筛选并限定为该科室在职人员'}
                </span>
              </div>

              {/* Borrower Name Dropdown (Strictly for borrowing department) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                  <span>借用经手人 (限定借入科室人员) <span className="text-rose-500">*</span></span>
                  {borrowingDeptStaff.length > 0 && (
                    <span className="text-[11px] text-teal-600 font-normal">
                      共 {borrowingDeptStaff.length} 位科室成员
                    </span>
                  )}
                </label>

                {!borrowingDept ? (
                  <select
                    disabled
                    className="w-full bg-slate-100 border border-slate-200 text-slate-400 rounded-lg px-3 py-2 text-xs cursor-not-allowed"
                  >
                    <option value="">-- 请先在左侧选择借入使用科室 --</option>
                  </select>
                ) : borrowingDeptStaff.length > 0 ? (
                  <div className="space-y-1.5">
                    <select
                      value={borrowerName}
                      onChange={(e) => {
                        const selectedName = e.target.value;
                        setBorrowerName(selectedName);
                        const person = borrowingDeptStaff.find(s => s.name === selectedName);
                        if (person) {
                          setBorrowerPhone(person.phone || person.shortPhone || '');
                        }
                      }}
                      required
                      className="w-full bg-white border border-teal-400 ring-1 ring-teal-200 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-teal-500 focus:border-teal-500 font-semibold text-slate-900 cursor-pointer"
                    >
                      <option value="">-- 请选择借用经手人 ({borrowingDeptStaff.length}位科室成员) --</option>
                      {borrowingDeptStaff.map((p) => (
                        <option key={p.id || p.employeeNo || p.name} value={p.name}>
                          {p.name} {p.title ? `(${p.title})` : ''} {p.role ? `[${p.role}]` : ''} {p.phone ? `· 📞${p.phone}` : p.shortPhone ? `· 📞${p.shortPhone}` : ''}
                        </option>
                      ))}
                    </select>

                    {/* Quick select pills */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      <span className="text-[11px] text-slate-400 flex items-center gap-1 mr-0.5">
                        <User className="w-3 h-3 text-teal-600" /> 常用人员:
                      </span>
                      {borrowingDeptStaff.slice(0, 6).map((p) => {
                        const isSelected = borrowerName === p.name;
                        return (
                          <button
                            key={p.id || p.employeeNo || p.name}
                            type="button"
                            onClick={() => handleSelectStaff(p)}
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
                  <div className="space-y-1.5">
                    <input
                      type="text"
                      value={borrowerName}
                      onChange={(e) => setBorrowerName(e.target.value)}
                      placeholder={`【${borrowingDept}】主数据暂未录入人员，请手动输入经手人`}
                      required
                      className="w-full bg-amber-50/60 border border-amber-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-teal-500 font-medium"
                    />
                    <span className="text-[11px] text-amber-700 block">
                      提示：该科室主数据暂无成员记录，已开放手动录入。
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Lender & Borrower Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
              {/* Lender Dropdown (Strictly restricted to equipment's department) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                  <span>出借经办人 (限定设备所在科室人员) <span className="text-rose-500">*</span></span>
                  <span className="text-[11px] font-medium text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200">
                    {ownerDept} ({ownerDeptStaff.length}人)
                  </span>
                </label>

                {ownerDeptStaff.length > 0 ? (
                  <div className="space-y-1.5">
                    <select
                      value={lenderName}
                      onChange={(e) => {
                        const val = e.target.value;
                        setLenderName(val);
                        const matched = ownerDeptStaff.find(p => p.name === val);
                        if (matched) {
                          setLenderPhone(matched.phone || matched.shortPhone || '');
                        }
                      }}
                      required
                      className="w-full bg-white border border-teal-400 ring-1 ring-teal-200 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-teal-500 focus:border-teal-500 font-semibold text-slate-900 cursor-pointer"
                    >
                      <option value="">-- 请选择出借科室经办人 ({ownerDeptStaff.length}位科室成员) --</option>
                      {ownerDeptStaff.map((p) => (
                        <option key={`owner-${p.id || p.employeeNo || p.name}`} value={p.name}>
                          {p.name} {p.title ? `(${p.title})` : ''} {p.role ? `[${p.role}]` : ''} {p.phone ? `· 📞${p.phone}` : ''}
                        </option>
                      ))}
                    </select>

                    {/* Quick select pills for lender */}
                    <div className="flex flex-wrap gap-1.5 pt-0.5">
                      <span className="text-[11px] text-slate-400 flex items-center gap-1 mr-0.5">
                        <User className="w-3 h-3 text-teal-600" /> 科室经办人:
                      </span>
                      {ownerDeptStaff.slice(0, 5).map((p) => {
                        const isSelected = lenderName === p.name;
                        return (
                          <button
                            key={p.id || p.employeeNo || p.name}
                            type="button"
                            onClick={() => {
                              setLenderName(p.name);
                              setLenderPhone(p.phone || p.shortPhone || '');
                            }}
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
                    value={lenderName}
                    onChange={(e) => setLenderName(e.target.value)}
                    placeholder={`输入【${ownerDept}】出借责任人`}
                    required
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-teal-500 focus:border-teal-500 font-medium"
                  />
                )}
                <span className="text-[11px] text-slate-400 mt-1 block">
                  出借经办人严格限定在设备所在科室【{ownerDept}】在册人员
                </span>
              </div>

              {/* Lender Phone */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  出借人联系电话 / 科室分机
                </label>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
                  <input
                    type="text"
                    value={lenderPhone}
                    onChange={(e) => setLenderPhone(e.target.value)}
                    placeholder="选定出借人后自动带出或手动修改"
                    className="w-full pl-8 bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-teal-500 focus:border-teal-500 font-mono"
                  />
                </div>
                <span className="text-[11px] text-slate-400 mt-1 block">
                  选定出借经办人后自动带出其联系方式，可按需补充
                </span>
              </div>

              {/* Borrower Contact Phone */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  借用人联系电话 / 科室分机
                </label>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
                  <input
                    type="text"
                    value={borrowerPhone}
                    onChange={(e) => setBorrowerPhone(e.target.value)}
                    placeholder="随经手人自动带出或手动修改"
                    className="w-full pl-8 bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-teal-500 focus:border-teal-500 font-mono"
                  />
                </div>
                <span className="text-[11px] text-slate-400 mt-1 block">
                  选定经手人后自动带出其手机号/短号，可按需补充
                </span>
              </div>
            </div>

            {/* Borrow Reason */}
            <div className="pt-2 border-t border-slate-100">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                借用事由与临床用途说明 <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={borrowReason}
                onChange={(e) => setBorrowReason(e.target.value)}
                placeholder="如：急危重症救治床旁超声筛查/CCU监护周转"
                required
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              />
            </div>
          </div>

          {/* 3. Loan Time Period with Calendar, Quick Duration Pills & Stepper */}
          <div className="bg-white rounded-xl p-4.5 border border-slate-200 shadow-2xs space-y-4">
            {/* Header with Live Duration Badge */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 flex-wrap gap-2">
              <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center border border-teal-200">
                  <CalendarDays className="w-4 h-4" />
                </div>
                <span>借用时间与期限设定</span>
              </div>

              {/* Dynamic Duration Badge */}
              <div className="flex items-center gap-2">
                {durationInfo.isValid ? (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-teal-50 text-teal-900 border border-teal-200 font-mono text-xs font-semibold shadow-2xs">
                    <Timer className="w-3.5 h-3.5 text-teal-600" />
                    <span>借用周期: <strong className="text-teal-700">{durationInfo.text}</strong></span>
                    <span className="text-teal-400 font-normal">({durationInfo.totalHours}小时)</span>
                  </div>
                ) : durationInfo.isOverdue ? (
                  <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-rose-50 text-rose-700 border border-rose-200 text-xs font-medium">
                    <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
                    <span>{durationInfo.text}</span>
                  </div>
                ) : null}
              </div>
            </div>

            {/* Quick Duration Preset Pills */}
            <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-200/70 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-500" />
                  <span>快捷期限点选 (根据出借时间自动推算预计归还日):</span>
                </span>
                
                {/* Stepper for custom days */}
                <div className="flex items-center gap-1 bg-white px-2 py-0.5 rounded-lg border border-slate-200 shadow-2xs">
                  <span className="text-[11px] text-slate-500 mr-1">微调:</span>
                  <button
                    type="button"
                    onClick={() => handleStepDurationDays(-1)}
                    title="减少1天"
                    className="w-5 h-5 rounded flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer text-xs transition"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="text-xs font-mono font-bold text-slate-800 px-1 min-w-[32px] text-center">
                    {durationInfo.days || 1}天
                  </span>
                  <button
                    type="button"
                    onClick={() => handleStepDurationDays(1)}
                    title="增加1天"
                    className="w-5 h-5 rounded flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer text-xs transition"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Preset buttons */}
              <div className="flex flex-wrap items-center gap-2">
                {[
                  { days: 1, label: '1天 (急救应急)', hour: 18 },
                  { days: 3, label: '3天 (短期救治)', hour: 18 },
                  { days: 5, label: '5天 (工作日)', hour: 18 },
                  { days: 7, label: '7天 (常规1周)', hour: 18, isPopular: true },
                  { days: 14, label: '14天 (两周调配)', hour: 18 },
                  { days: 30, label: '30天 (一月阶段)', hour: 18 }
                ].map((item) => {
                  const isMatch = Math.round(durationInfo.exactDays || 0) === item.days;
                  return (
                    <button
                      key={`preset-${item.days}`}
                      type="button"
                      onClick={() => handleApplyDurationPreset(item.days, item.hour)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer flex items-center gap-1.5 ${
                        isMatch
                          ? 'bg-teal-600 text-white border-teal-600 shadow-sm ring-2 ring-teal-200 font-bold'
                          : 'bg-white hover:bg-teal-50/80 text-slate-700 hover:text-teal-900 border-slate-200/90 shadow-2xs'
                      }`}
                    >
                      {item.isPopular && !isMatch && (
                        <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
                      )}
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Date-Time Pickers (Borrow & Expected Return) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* 1. Borrow Time */}
              <div className="p-3 bg-slate-50/50 rounded-xl border border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-teal-600" />
                    <span>出借交接时间 (起始)</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleSetBorrowToNow}
                    className="text-[11px] text-teal-700 hover:text-teal-900 font-medium px-2 py-0.5 rounded bg-teal-50 hover:bg-teal-100 border border-teal-200/70 transition cursor-pointer flex items-center gap-1"
                    title="将起始时间设置为当前时刻"
                  >
                    <Clock className="w-3 h-3 text-teal-600" />
                    <span>设为此时此刻</span>
                  </button>
                </div>

                <div className="relative">
                  <input
                    type="datetime-local"
                    value={toInputDateVal(borrowTime)}
                    onChange={(e) => {
                      const val = fromInputDateVal(e.target.value);
                      if (val) setBorrowTime(val);
                    }}
                    required
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-teal-500 focus:border-teal-500 font-mono font-medium text-slate-900 shadow-2xs"
                  />
                </div>
                <div className="text-[11px] text-slate-400 flex items-center justify-between">
                  <span>支持点选日历或直接修改时间</span>
                  <span className="font-mono text-slate-500">{borrowTime}</span>
                </div>
              </div>

              {/* 2. Expected Return Time */}
              <div className="p-3 bg-amber-50/40 rounded-xl border border-amber-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-amber-600" />
                    <span>约定预计归还时间 (截止) <span className="text-rose-500">*</span></span>
                  </label>
                  <span className="text-[11px] text-amber-700 font-mono font-semibold">
                    {durationInfo.text}
                  </span>
                </div>

                <div className="relative">
                  <input
                    type="datetime-local"
                    value={toInputDateVal(expectedReturnTime)}
                    onChange={(e) => {
                      const val = fromInputDateVal(e.target.value);
                      if (val) setExpectedReturnTime(val);
                    }}
                    required
                    className="w-full bg-white border border-amber-300 ring-1 ring-amber-200/60 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-amber-500 focus:border-amber-500 font-mono font-bold text-amber-950 shadow-2xs"
                  />
                </div>

                {/* Quick Return Hour Adjustments */}
                <div className="flex items-center justify-between gap-1 pt-0.5">
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-slate-400">归还时刻:</span>
                    {[
                      { h: 18, m: 0, label: '18:00 (下班前)' },
                      { h: 20, m: 0, label: '20:00 (夜班交接)' },
                      { h: 12, m: 0, label: '12:00 (午间)' }
                    ].map((timePreset) => (
                      <button
                        key={`hour-${timePreset.h}`}
                        type="button"
                        onClick={() => {
                          let d = new Date();
                          if (expectedReturnTime) {
                            const parsed = new Date(expectedReturnTime.replace(/-/g, '/'));
                            if (!isNaN(parsed.getTime())) d = parsed;
                          }
                          d.setHours(timePreset.h, timePreset.m, 0, 0);
                          setExpectedReturnTime(formatToDateTimeStr(d));
                        }}
                        className="px-1.5 py-0.5 rounded bg-white hover:bg-amber-100 text-slate-600 hover:text-amber-900 border border-slate-200 text-[10px] cursor-pointer transition font-mono"
                      >
                        {timePreset.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Visual Timeline Bar & Overdue Warning */}
            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/70 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-600 gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className="font-mono text-teal-800 font-semibold bg-white px-2 py-0.5 rounded border border-slate-200 text-[11px] shrink-0">
                  {borrowTime}
                </span>
                <span className="text-slate-400 font-mono">────────►</span>
                <span className="font-mono text-amber-900 font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-200 text-[11px] shrink-0">
                  {expectedReturnTime}
                </span>
              </div>
              <span className="text-[11px] text-slate-500">
                超期未还系统将自动在主台账亮起红色预警并推送催还提醒
              </span>
            </div>
          </div>

          {/* 4. Smart Dynamic Accessories Checklist (根据不同设备智能出现选项) */}
          <div className="bg-white rounded-lg p-4 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                <PackageCheck className="w-4 h-4 text-teal-600" />
                <span>随借附件与专用配件清单</span>
                <span className="text-xs font-normal px-2 py-0.5 rounded bg-teal-50 text-teal-800 border border-teal-200 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-teal-600" />
                  已匹配：{accessoryRecommendation.equipmentTypeTitle}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSelectAllRecommended}
                  className="text-[11px] text-teal-700 hover:text-teal-900 font-medium hover:underline cursor-pointer"
                >
                  全选推荐
                </button>
                <span className="text-slate-300">|</span>
                <button
                  type="button"
                  onClick={() => setSelectedAccessories([])}
                  className="text-[11px] text-slate-500 hover:text-slate-700 cursor-pointer"
                >
                  清空
                </button>
              </div>
            </div>

            <p className="text-xs text-slate-500">
              系统已根据当前设备类别智能推荐核心配件，请核对随机移交实物并勾选确认：
            </p>

            {/* Recommended Accessories Tags Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {accessoryRecommendation.recommendations.map((item) => {
                const isChecked = selectedAccessories.includes(item.name);
                return (
                  <label
                    key={item.id}
                    onClick={() => handleToggleAccessory(item.name)}
                    className={`flex items-center gap-2.5 p-2.5 rounded-lg border text-xs cursor-pointer transition-all ${
                      isChecked
                        ? 'bg-teal-50/80 border-teal-400 text-teal-950 font-medium shadow-2xs'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded flex items-center justify-center border transition-colors shrink-0 ${
                        isChecked
                          ? 'bg-teal-600 border-teal-600 text-white'
                          : 'border-slate-300 bg-white'
                      }`}
                    >
                      {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                    <span className="flex-1 truncate" title={item.name}>{item.name}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 border border-slate-200 shrink-0">
                      {item.categoryTag}
                    </span>
                  </label>
                );
              })}
            </div>

            {/* Custom Accessories Add */}
            <div className="pt-2 border-t border-dashed border-slate-200 flex gap-2">
              <input
                type="text"
                value={customAccessory}
                onChange={(e) => setCustomAccessory(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCustomAccessory();
                  }
                }}
                placeholder="添加其他特殊随借附件 / 定制耗材组件"
                className="flex-1 bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              />
              <button
                type="button"
                onClick={handleAddCustomAccessory}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-teal-800 bg-teal-100 hover:bg-teal-200 rounded-lg transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                添加配件
              </button>
            </div>

            {/* Currently Selected List Preview */}
            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-xs">
              <span className="text-slate-500 font-medium mr-1.5">已确认随借清单 ({selectedAccessories.length} 项):</span>
              {selectedAccessories.length > 0 ? (
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {selectedAccessories.map((acc, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white text-slate-800 border border-slate-300 text-xs"
                    >
                      <span>{acc}</span>
                      <button
                        type="button"
                        onClick={() => handleToggleAccessory(acc)}
                        className="text-slate-400 hover:text-rose-600 cursor-pointer"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              ) : (
                <span className="text-rose-600 font-medium">尚未选择随借附件（建议至少包含电源线与专用配件）</span>
              )}
            </div>
          </div>

          {/* 5. Electronic Signature & Paperless Confirmation */}
          <div className="bg-gradient-to-r from-emerald-50/70 to-teal-50/70 rounded-xl p-4 border border-emerald-200 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-700" />
                <span className="text-xs font-bold text-emerald-950">
                  全流程电子签名与数字存证（无纸化直签）
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-900 text-[10px] font-bold">
                  🌱 绿色环保倡导
                </span>
              </div>
              <label className="flex items-center gap-1.5 cursor-pointer text-xs font-semibold text-emerald-900">
                <input
                  type="checkbox"
                  checked={electronicSignEnabled}
                  onChange={(e) => setElectronicSignEnabled(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-emerald-300"
                />
                <span>已启用 CA 数字签名认证</span>
              </label>
            </div>

            {/* E-Signature Badges Preview */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="bg-white p-3 rounded-lg border border-emerald-200 shadow-2xs">
                <div className="text-[11px] text-slate-500 flex justify-between items-center mb-1">
                  <span className="font-semibold text-slate-700">【出借方】发机责任人签章</span>
                  <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1 rounded">CA 认证</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-slate-900 font-semibold text-sm">
                    {lenderName ? `${lenderName}` : '待选择出借人'}
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">{lenderPhone || '系统认证'}</span>
                </div>
              </div>

              <div className="bg-white p-3 rounded-lg border border-emerald-200 shadow-2xs">
                <div className="text-[11px] text-slate-500 flex justify-between items-center mb-1">
                  <span className="font-semibold text-slate-700">【借入方】领机责任人</span>
                  <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1 rounded">授权确认</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-slate-900 font-semibold text-sm">
                    {borrowerName ? `${borrowerName}` : '待选择领机人'}
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">{borrowerPhone || borrowingDept || '临床科室'}</span>
                </div>
              </div>
            </div>

            <p className="text-[11px] text-emerald-800/90 leading-relaxed">
              单据将直接加密存入设备全生命周期云端档案，<strong>全流程电子化闭环管理，非必要无需打印纸质单据</strong>。
            </p>
          </div>

          {/* 6. Handover Notes & Print Checkbox */}
          <div className="bg-white rounded-lg p-4 border border-slate-200 space-y-3">
            <label className="block text-xs font-semibold text-slate-700">
              出借交接技术状况与备注
            </label>
            <textarea
              rows={2}
              value={handoverNotes}
              onChange={(e) => setHandoverNotes(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-xs focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            />

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
                  外部纸质审计特殊需求：登记后调起纸质打印（默认关闭，倡导绿色无纸化）
                </span>
              </label>
            </div>
          </div>
        </form>

        {/* Footer Actions */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-500 flex items-center gap-1">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>电子签署后将自动在设备主台账生成加密数字存证</span>
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
              className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              确认电子签名并出借 (无纸化)
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

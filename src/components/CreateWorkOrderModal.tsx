import React, { useState, useMemo, useEffect } from 'react';
import { MedicalEquipment, AuthUser, RepairRecord } from '../types';
import {
  EngineeringWorkOrder,
  PriorityLevel,
  WorkOrderType,
  BiomedicalGroup
} from '../types/dispatchTypes';
import { SLA_RESPONSE_LIMITS, SLA_REPAIR_LIMITS } from '../utils/dispatchData';
import { generateNextWorkOrderId } from '../utils/workOrderCodeGenerator';
import {
  X,
  PlusCircle,
  AlertTriangle,
  Search,
  CheckCircle2,
  Clock,
  Building,
  Wrench,
  ShieldAlert,
  FileText,
  Zap,
  Sparkles,
  QrCode,
  ArrowRight,
  Filter,
  Check
} from 'lucide-react';

interface CreateWorkOrderModalProps {
  isOpen: boolean;
  equipmentList: MedicalEquipment[];
  currentUser?: AuthUser;
  initialRepairRecord?: RepairRecord | null;
  initialEquipment?: MedicalEquipment | null;
  onClose: () => void;
  onCreateWorkOrder: (newOrder: EngineeringWorkOrder) => void;
}

export const CreateWorkOrderModal: React.FC<CreateWorkOrderModalProps> = ({
  isOpen,
  equipmentList,
  currentUser,
  initialRepairRecord,
  initialEquipment,
  onClose,
  onCreateWorkOrder
}) => {
  // 模式切换：从现有报修单导入 ('from_repair') vs 手动创建派工 ('manual')
  const [creationSource, setCreationSource] = useState<'from_repair' | 'manual'>('from_repair');

  // 1. 扁平化汇总全院在册设备的报修记录池
  const allExistingRepairs = useMemo(() => {
    const list: Array<{ record: RepairRecord; equipment: MedicalEquipment }> = [];
    equipmentList.forEach(eq => {
      if (eq.repairRecords && Array.isArray(eq.repairRecords)) {
        eq.repairRecords.forEach(rec => {
          list.push({ record: rec, equipment: eq });
        });
      }
    });
    // 按日期倒序排列
    return list.sort((a, b) => {
      const dateA = a.record.faultDate || '';
      const dateB = b.record.faultDate || '';
      return dateB.localeCompare(dateA);
    });
  }, [equipmentList]);

  // 选中的报修记录
  const [selectedRepairPair, setSelectedRepairPair] = useState<{ record: RepairRecord; equipment: MedicalEquipment } | null>(null);
  const [repairSearch, setRepairSearch] = useState('');
  const [repairFilterType, setRepairFilterType] = useState<string>('all');

  // 2. 手动创建 / 自动填充状态
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEquipment, setSelectedEquipment] = useState<MedicalEquipment | null>(null);

  const [priority, setPriority] = useState<PriorityLevel>('P2_URGENT');
  const [workOrderType, setWorkOrderType] = useState<WorkOrderType>('emergency_breakdown');
  const [faultDescription, setFaultDescription] = useState('');
  const [reporterName, setReporterName] = useState('');
  const [reporterPhone, setReporterPhone] = useState('');
  const [sourceRefId, setSourceRefId] = useState<string>('');
  const [caoliaoRecordNo, setCaoliaoRecordNo] = useState<string>('');
  const [photoUrl, setPhotoUrl] = useState<string>('');

  // 初始化与重置逻辑
  useEffect(() => {
    if (!isOpen) return;

    if (initialRepairRecord) {
      setCreationSource('from_repair');
      const matchedEq = initialEquipment || equipmentList.find(e => e.id === initialRepairRecord.equipmentId || e.sn === initialRepairRecord.equipmentSn) || equipmentList[0];
      setSelectedRepairPair({ record: initialRepairRecord, equipment: matchedEq });
      applyRepairRecord(initialRepairRecord, matchedEq);
    } else if (allExistingRepairs.length > 0) {
      setCreationSource('from_repair');
      const first = allExistingRepairs[0];
      setSelectedRepairPair(first);
      applyRepairRecord(first.record, first.equipment);
    } else {
      setCreationSource('manual');
      const defaultEq = initialEquipment || equipmentList[0] || null;
      setSelectedEquipment(defaultEq);
      setReporterName(currentUser?.name || '科室责任人');
      setReporterPhone(currentUser?.phone || '13863371000');
    }
  }, [isOpen, initialRepairRecord, initialEquipment, allExistingRepairs]);

  // 将报修单内容一键注入表单状态
  const applyRepairRecord = (rec: RepairRecord, eq: MedicalEquipment) => {
    setSelectedEquipment(eq);
    setFaultDescription(rec.faultDescription || '临床设备报修故障');
    setReporterName(rec.reporterName || (currentUser?.name || '临床报修人'));
    setReporterPhone(rec.reporterPhone || '18906339915');
    setSourceRefId(rec.id);
    setCaoliaoRecordNo(rec.recordNo || (rec.id.startsWith('REP-CL-') ? rec.id.replace('REP-CL-', '') : ''));
    setPhotoUrl(rec.photoUrl || '');

    // 智能推断工单类型
    if (rec.repairType === '定期预防性保养') {
      setWorkOrderType('pm_maintenance');
      setPriority('P4_PLANNED');
    } else if (rec.repairType === '巡检维护') {
      setWorkOrderType('inspection_abnormal');
      setPriority('P3_STANDARD');
    } else {
      setWorkOrderType('emergency_breakdown');
      // 根据故障描述关键词智能推断紧缓等级
      const desc = (rec.faultDescription || '').toLowerCase();
      if (desc.includes('断气') || desc.includes('停机') || desc.includes('休克') || desc.includes('无法开机') || desc.includes('报警关不上') || desc.includes('危重')) {
        setPriority('P1_CRITICAL');
      } else if (desc.includes('不准') || desc.includes('异响') || desc.includes('摔碎') || desc.includes('警告') || desc.includes('不能复位')) {
        setPriority('P2_URGENT');
      } else {
        setPriority('P3_STANDARD');
      }
    }
  };

  // 过滤设备列表
  const filteredEquipment = useMemo(() => {
    if (!searchQuery.trim()) return equipmentList.slice(0, 10);
    const q = searchQuery.toLowerCase();
    return equipmentList.filter(eq =>
      eq.name.toLowerCase().includes(q) ||
      eq.sn.toLowerCase().includes(q) ||
      eq.department.toLowerCase().includes(q) ||
      (eq.internalNo && eq.internalNo.toLowerCase().includes(q))
    ).slice(0, 10);
  }, [equipmentList, searchQuery]);

  // 过滤报修记录池
  const filteredRepairs = useMemo(() => {
    return allExistingRepairs.filter(item => {
      if (repairFilterType !== 'all') {
        if (repairFilterType === 'caoliao' && !item.record.repairType?.includes('草料') && !item.record.id?.startsWith('REP-CL-')) return false;
        if (repairFilterType === 'emergency' && item.record.repairType !== '紧急故障维修') return false;
        if (repairFilterType === 'pm' && item.record.repairType !== '定期预防性保养' && item.record.repairType !== '巡检维护') return false;
      }
      if (!repairSearch.trim()) return true;
      const q = repairSearch.toLowerCase();
      return (
        item.record.id.toLowerCase().includes(q) ||
        (item.record.faultDescription && item.record.faultDescription.toLowerCase().includes(q)) ||
        (item.record.reporterName && item.record.reporterName.toLowerCase().includes(q)) ||
        (item.record.recordNo && item.record.recordNo.toLowerCase().includes(q)) ||
        item.equipment.name.toLowerCase().includes(q) ||
        item.equipment.department.toLowerCase().includes(q)
      );
    });
  }, [allExistingRepairs, repairSearch, repairFilterType]);

  const inferBiomedicalGroup = (eq: MedicalEquipment): BiomedicalGroup => {
    const name = (eq.name + ' ' + eq.department + ' ' + (eq.category || '')).toLowerCase();
    if (name.includes('呼吸') || name.includes('除颤') || name.includes('监护') || name.includes('icu') || name.includes('急诊') || name.includes('透析') || name.includes('crrt') || name.includes('麻醉')) {
      return '急救生命支持技术组';
    }
    if (name.includes('ct') || name.includes('磁共振') || name.includes('mri') || name.includes('x线') || name.includes('dr') || name.includes('放射') || name.includes('c臂') || name.includes('血管机') || name.includes('肌电图')) {
      return '大型放射影像技术组';
    }
    if (name.includes('生化') || name.includes('检验') || name.includes('血球') || name.includes('发光') || name.includes('质谱') || name.includes('尿沉渣')) {
      return '临床检验与生化组';
    }
    if (name.includes('腔镜') || name.includes('手术') || name.includes('电刀') || name.includes('超声刀') || name.includes('内镜') || name.includes('关节镜')) {
      return '腔镜微创手术组';
    }
    return '超声与综合诊疗组';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEquipment) {
      alert('请选择或指定报修设备！');
      return;
    }
    if (!faultDescription.trim()) {
      alert('请详细填写设备故障现象描述！');
      return;
    }

    const d = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const nowStr = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
    
    // 生成医院统一格式标准化工单号 (如 WO-REP-2026-0560 或 WO-CL-xxxx)
    const orderId = caoliaoRecordNo 
      ? `WO-CL-${caoliaoRecordNo.replace(/\D/g, '') || Math.floor(100000 + Math.random() * 900000)}`
      : generateNextWorkOrderId('REP', 2026, Math.floor(Math.random() * 200));

    const group = inferBiomedicalGroup(selectedEquipment);

    const newOrder: EngineeringWorkOrder = {
      id: orderId,
      equipmentId: selectedEquipment.id,
      equipmentName: selectedEquipment.name,
      equipmentModel: selectedEquipment.model || '标准型号',
      equipmentSn: selectedEquipment.sn || 'SN-CAOLIAO',
      internalNo: selectedEquipment.internalNo,
      category: selectedEquipment.category,
      department: selectedEquipment.department,
      location: selectedEquipment.location || `${selectedEquipment.department} 诊疗室`,
      building: selectedEquipment.building,
      floor: selectedEquipment.floor,
      reporterName: reporterName.trim() || '科室临床人员',
      reporterPhone: reporterPhone.trim() || '18906339915',
      reportTime: selectedRepairPair?.record.faultDate ? `${selectedRepairPair.record.faultDate} 14:56` : nowStr,
      priority,
      workOrderType,
      faultDescription: faultDescription.trim(),
      status: 'pending_dispatch',
      biomedicalGroup: group,
      source: caoliaoRecordNo || sourceRefId.includes('CL') ? 'caoliao' : 'manual',
      caoliaoRecordNo: caoliaoRecordNo || undefined,
      caoliaoRecordId: caoliaoRecordNo ? parseInt(caoliaoRecordNo.replace(/\D/g, '')) || 0 : undefined,
      photoUrl: photoUrl || undefined,
      partsReplaced: [],
      totalRepairCost: selectedRepairPair?.record.cost || 0,
      totalDowntimeHours: 0.1,
      slaResponseLimitMinutes: SLA_RESPONSE_LIMITS[priority],
      slaRepairLimitHours: SLA_REPAIR_LIMITS[priority],
      isSlaResponseMet: false,
      isSlaRepairMet: false
    };

    onCreateWorkOrder(newOrder);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[92vh]">
        
        {/* 顶部标题栏 */}
        <div className="px-5 py-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 flex items-center justify-center font-bold shrink-0 shadow-xs">
              <Wrench className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold tracking-tight">发起标准化医工派工工单</h3>
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                  闭环派工池
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                支持从现有报修单 (RepairRecord / 草料扫码报修) 一键自动导入设备与故障信息，快速派单
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 模式选择切换栏 */}
        <div className="px-5 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-1.5 p-1 bg-slate-200/70 rounded-xl text-xs">
            <button
              type="button"
              onClick={() => setCreationSource('from_repair')}
              className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 cursor-pointer ${
                creationSource === 'from_repair'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
              <span>从现有报修单生成 ({allExistingRepairs.length}条待转)</span>
            </button>

            <button
              type="button"
              onClick={() => setCreationSource('manual')}
              className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 cursor-pointer ${
                creationSource === 'manual'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <PlusCircle className="w-3.5 h-3.5 text-indigo-600" />
              <span>手动新登记报修</span>
            </button>
          </div>

          <div className="text-2xs text-slate-500 hidden sm:flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>自动匹配设备主数据、紧缓级别与责任工程组</span>
          </div>
        </div>

        {/* 表单内容区 */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 text-xs flex-1">
          
          {/* ================= 模式一：从现有报修单选取并一键录入 ================= */}
          {creationSource === 'from_repair' && (
            <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-200/80 space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-indigo-600" />
                  <span className="font-bold text-indigo-950 text-xs sm:text-sm">
                    第 1 步：选择现有报修单（已自动抓取草料与院内在册报修履历）
                  </span>
                </div>
                
                {/* 快捷过滤芯片 */}
                <div className="flex items-center gap-1">
                  {[
                    { id: 'all', label: '全部' },
                    { id: 'caoliao', label: '草料扫码报修' },
                    { id: 'emergency', label: '紧急故障' },
                    { id: 'pm', label: '保养与巡检' }
                  ].map(f => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setRepairFilterType(f.id)}
                      className={`px-2 py-0.5 rounded text-[11px] font-medium transition cursor-pointer ${
                        repairFilterType === f.id
                          ? 'bg-indigo-600 text-white font-bold'
                          : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 搜索过滤栏 */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={repairSearch}
                  onChange={(e) => setRepairSearch(e.target.value)}
                  placeholder="搜索报修单号 (如 L12238)、设备名称、科室、报修人 (如 孙志强) 或故障关键词..."
                  className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>

              {/* 报修单候选列表 */}
              <div className="max-h-48 overflow-y-auto space-y-2 pr-1 border border-indigo-200/70 rounded-lg p-2 bg-white divide-y divide-slate-100">
                {filteredRepairs.length === 0 ? (
                  <div className="p-6 text-center text-slate-400">
                    未检索到符合条件的报修记录，您可尝试清空搜索词或切换为手动录入。
                  </div>
                ) : (
                  filteredRepairs.map((item, idx) => {
                    const isSelected = selectedRepairPair?.record.id === item.record.id;
                    const isCaoliao = item.record.repairType?.includes('草料') || item.record.id.startsWith('REP-CL-');

                    return (
                      <div
                        key={`${item.record.id}-${idx}`}
                        onClick={() => {
                          setSelectedRepairPair(item);
                          applyRepairRecord(item.record, item.equipment);
                        }}
                        className={`p-2.5 rounded-lg transition cursor-pointer flex items-start justify-between gap-3 ${
                          isSelected
                            ? 'bg-indigo-50 border-2 border-indigo-600 shadow-2xs'
                            : 'hover:bg-slate-50 border border-transparent'
                        }`}
                      >
                        <div className="space-y-1 min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-slate-900 text-xs">{item.equipment.name}</span>
                            <span className="font-mono text-2xs text-slate-500">[{item.equipment.id}]</span>
                            <span className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 font-semibold text-2xs">
                              {item.equipment.department}
                            </span>
                            {isCaoliao && (
                              <span className="px-1.5 py-0.2 rounded bg-teal-100 text-teal-800 border border-teal-200 font-bold text-2xs flex items-center gap-1">
                                <QrCode className="w-2.5 h-2.5 text-teal-600" />
                                <span>草料扫码 {item.record.recordNo ? `[${item.record.recordNo}]` : ''}</span>
                              </span>
                            )}
                            <span className="text-2xs text-slate-400 font-mono ml-auto">
                              {item.record.faultDate}
                            </span>
                          </div>

                          <p className="text-2xs text-slate-600 line-clamp-2 leading-relaxed">
                            {item.record.faultDescription}
                          </p>

                          <div className="flex items-center gap-3 text-2xs text-slate-500">
                            <span>报修人: <strong className="text-slate-800">{item.record.reporterName || '医护'}</strong></span>
                            {item.record.reporterPhone && <span>电话: <strong className="font-mono text-slate-700">{item.record.reporterPhone}</strong></span>}
                            <span>状态: <span className="text-amber-600 font-semibold">{item.record.status}</span></span>
                          </div>
                        </div>

                        <div className="shrink-0 flex items-center pt-1">
                          <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                            isSelected ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300'
                          }`}>
                            {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* ================= 模式二：手动选择设备 ================= */}
          {creationSource === 'manual' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="font-bold text-slate-800">
                  1. 选择报修设备 <span className="text-rose-500">*</span>
                </label>
                {selectedEquipment && (
                  <span className="text-2xs text-indigo-600 font-medium">
                    已选择: {selectedEquipment.name} ({selectedEquipment.department})
                  </span>
                )}
              </div>

              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="搜索院内设备名称、SN序列号、科室自编号或使用科室..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>

              <div className="max-h-36 overflow-y-auto border border-slate-200 rounded-lg divide-y divide-slate-100 bg-slate-50/50">
                {filteredEquipment.map((eq) => {
                  const isSelected = selectedEquipment?.id === eq.id;
                  return (
                    <div
                      key={eq.id}
                      onClick={() => setSelectedEquipment(eq)}
                      className={`p-2.5 flex items-center justify-between transition cursor-pointer ${
                        isSelected ? 'bg-indigo-50/80 border-l-4 border-indigo-600' : 'hover:bg-slate-50'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-800">{eq.name}</span>
                          {eq.internalNo && (
                            <span className="px-1.5 py-0.2 rounded bg-blue-100 text-blue-800 font-mono text-2xs font-bold">
                              {eq.internalNo}
                            </span>
                          )}
                          <span className="text-2xs text-slate-500 font-mono">SN: {eq.sn}</span>
                        </div>
                        <div className="text-2xs text-slate-500 mt-0.5">
                          {eq.department} · {eq.location}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-full text-2xs font-bold ${
                          eq.status === '正常运行' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}>
                          {eq.status}
                        </span>
                        <input
                          type="radio"
                          checked={isSelected}
                          onChange={() => setSelectedEquipment(eq)}
                          className="text-indigo-600 focus:ring-indigo-500"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ================= 核心确认区：设备档案回填预览 ================= */}
          {selectedEquipment && (
            <div className="p-3 bg-slate-100/80 rounded-xl border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-2xs text-slate-700">
              <div>
                <span className="text-slate-400 block text-[10px]">报修设备名称</span>
                <strong className="text-slate-900 font-semibold">{selectedEquipment.name}</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">设备出厂SN / 序列号</span>
                <span className="font-mono text-slate-800">{selectedEquipment.sn || '未登记'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">所在科室与位置</span>
                <span>{selectedEquipment.department} · {selectedEquipment.location || '诊疗区'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">系统智能对口工程组</span>
                <strong className="text-indigo-700 font-bold">{inferBiomedicalGroup(selectedEquipment)}</strong>
              </div>
            </div>
          )}

          {/* 紧缓级别与三甲 SLA 考核等级 */}
          <div className="space-y-2">
            <label className="font-bold text-slate-800 block">
              2. 紧缓级别与响应 SLA 设定 <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {[
                {
                  id: 'P1_CRITICAL',
                  label: 'P1 特急 / 急救生命支持',
                  desc: 'ICU/急诊抢救/手术在用生命支持设备',
                  sla: 'SLA: ≤15分钟到场 | ≤2小时修复',
                  badge: 'bg-rose-50 border-rose-300 text-rose-900 ring-rose-500'
                },
                {
                  id: 'P2_URGENT',
                  label: 'P2 紧急 / 关键医技诊断',
                  desc: 'CT/核磁/大型生化流水线等关键在用机',
                  sla: 'SLA: ≤30分钟到场 | ≤4小时修复',
                  badge: 'bg-amber-50 border-amber-300 text-amber-900 ring-amber-500'
                },
                {
                  id: 'P3_STANDARD',
                  label: 'P3 常规 / 普通病区诊疗',
                  desc: '病区监护仪、心电图机、超声、注射泵',
                  sla: 'SLA: ≤2小时到场 | ≤24小时修复',
                  badge: 'bg-blue-50 border-blue-300 text-blue-900 ring-blue-500'
                },
                {
                  id: 'P4_PLANNED',
                  label: 'P4 计划 / 保养维护巡检',
                  desc: '预防性维护PM、巡检隐患排查、校准',
                  sla: 'SLA: ≤24小时响应 | ≤48小时归档',
                  badge: 'bg-slate-50 border-slate-300 text-slate-900 ring-slate-400'
                }
              ].map((lvl) => (
                <div
                  key={lvl.id}
                  onClick={() => setPriority(lvl.id as PriorityLevel)}
                  className={`p-2.5 rounded-lg border transition cursor-pointer ${
                    priority === lvl.id
                      ? `${lvl.badge} ring-1 font-semibold`
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs">{lvl.label}</span>
                    <input
                      type="radio"
                      checked={priority === lvl.id}
                      onChange={() => setPriority(lvl.id as PriorityLevel)}
                      className="text-indigo-600"
                    />
                  </div>
                  <p className="text-2xs text-slate-500 mt-1">{lvl.desc}</p>
                  <div className="text-2xs font-mono font-bold mt-1 text-indigo-700">{lvl.sla}</div>
                </div>
              ))}
            </div>
          </div>

          {/* 工单类型 */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-800 block">
              3. 工单类型
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'emergency_breakdown', label: '突发故障抢修' },
                { id: 'accessory_cable', label: '导联/探头配件受损' },
                { id: 'inspection_abnormal', label: '巡检盘点异常转单' },
                { id: 'pm_maintenance', label: 'PM维护与校准' }
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setWorkOrderType(t.id as WorkOrderType)}
                  className={`p-2 rounded-lg border text-xs text-center transition cursor-pointer ${
                    workOrderType === t.id
                      ? 'border-indigo-600 bg-indigo-50 font-bold text-indigo-900'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* 故障现象与临床诉求描述 */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-800">
                4. 故障现象与临床诉求描述 <span className="text-rose-500">*</span>
              </label>
              {creationSource === 'from_repair' && (
                <span className="text-2xs text-emerald-700 font-medium">✓ 已从现有报修单自动导入</span>
              )}
            </div>
            <textarea
              rows={3}
              value={faultDescription}
              onChange={(e) => setFaultDescription(e.target.value)}
              placeholder="请详细描述开机报错代码、声光报警信息、损坏部位、当时正在执行的操作以及对临床患者诊疗的紧急影响..."
              className="w-full p-2.5 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            />
          </div>

          {/* 报修人联系方式 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-50 border border-slate-200 rounded-lg">
            <div>
              <label className="block text-2xs font-semibold text-slate-600 mb-1">
                报修发起人姓名 <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={reporterName}
                onChange={(e) => setReporterName(e.target.value)}
                placeholder="填表人或科室护士长姓名"
                className="w-full p-2 text-xs bg-white border border-slate-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-2xs font-semibold text-slate-600 mb-1">
                临床联系电话 / 手机 <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={reporterPhone}
                onChange={(e) => setReporterPhone(e.target.value)}
                placeholder="报修人联系手机号"
                className="w-full p-2 text-xs bg-white border border-slate-200 rounded-lg"
              />
            </div>
          </div>

          {/* 现场附图或草料关联说明 */}
          {photoUrl && (
            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-2">
                <img src={photoUrl} alt="现场图" className="w-10 h-10 object-cover rounded-md border" />
                <div>
                  <span className="text-2xs font-bold text-slate-800">已关联现场报修实拍图片</span>
                  <p className="text-[10px] text-slate-400">将同步传递给负责工程师在途查看</p>
                </div>
              </div>
              <a
                href={photoUrl}
                target="_blank"
                rel="noreferrer"
                className="text-2xs text-indigo-600 hover:underline font-bold"
              >
                查看大图
              </a>
            </div>
          )}

          {/* 底部按钮栏 */}
          <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
            >
              取消
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white text-xs font-bold rounded-lg shadow-md transition flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <PlusCircle className="w-4 h-4" />
              <span>生成标准化派工工单并入池</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

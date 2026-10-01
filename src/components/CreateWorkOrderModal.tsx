import React, { useState } from 'react';
import { MedicalEquipment, AuthUser } from '../types';
import {
  EngineeringWorkOrder,
  PriorityLevel,
  WorkOrderType,
  BiomedicalGroup
} from '../types/dispatchTypes';
import { SLA_RESPONSE_LIMITS, SLA_REPAIR_LIMITS } from '../utils/dispatchData';
import {
  X,
  PlusCircle,
  AlertTriangle,
  Search,
  CheckCircle2,
  Clock,
  Building,
  Wrench,
  ShieldAlert
} from 'lucide-react';

interface CreateWorkOrderModalProps {
  isOpen: boolean;
  equipmentList: MedicalEquipment[];
  currentUser?: AuthUser;
  onClose: () => void;
  onCreateWorkOrder: (newOrder: EngineeringWorkOrder) => void;
}

export const CreateWorkOrderModal: React.FC<CreateWorkOrderModalProps> = ({
  isOpen,
  equipmentList,
  currentUser,
  onClose,
  onCreateWorkOrder
}) => {
  if (!isOpen) return null;

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEquipment, setSelectedEquipment] = useState<MedicalEquipment | null>(
    equipmentList[0] || null
  );

  const [priority, setPriority] = useState<PriorityLevel>('P1_CRITICAL');
  const [workOrderType, setWorkOrderType] = useState<WorkOrderType>('emergency_breakdown');
  const [faultDescription, setFaultDescription] = useState('');
  const [reporterName, setReporterName] = useState(
    currentUser?.name || '科室责任人'
  );
  const [reporterPhone, setReporterPhone] = useState(
    currentUser?.phone || '13863371000'
  );

  // Filtered equipment list for picker
  const filteredEquipment = equipmentList.filter(eq => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      eq.name.toLowerCase().includes(q) ||
      eq.sn.toLowerCase().includes(q) ||
      eq.department.toLowerCase().includes(q) ||
      (eq.internalNo && eq.internalNo.toLowerCase().includes(q))
    );
  }).slice(0, 8);

  const inferBiomedicalGroup = (eq: MedicalEquipment): BiomedicalGroup => {
    const name = (eq.name + ' ' + eq.department + ' ' + (eq.category || '')).toLowerCase();
    if (name.includes('呼吸') || name.includes('除颤') || name.includes('监护') || name.includes('icu') || name.includes('急诊') || name.includes('透析') || name.includes('crrt') || name.includes('麻醉')) {
      return '急救生命支持技术组';
    }
    if (name.includes('ct') || name.includes('磁共振') || name.includes('mri') || name.includes('x线') || name.includes('dr') || name.includes('放射') || name.includes('c臂') || name.includes('血管机')) {
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
      alert('请选择故障报修设备！');
      return;
    }
    if (!faultDescription.trim()) {
      alert('请详细填写设备故障现象描述！');
      return;
    }

    const d = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const nowStr = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
    const orderId = `WO-${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${Math.floor(100 + Math.random() * 900)}`;

    const group = inferBiomedicalGroup(selectedEquipment);

    const newOrder: EngineeringWorkOrder = {
      id: orderId,
      equipmentId: selectedEquipment.id,
      equipmentName: selectedEquipment.name,
      equipmentModel: selectedEquipment.model,
      equipmentSn: selectedEquipment.sn,
      internalNo: selectedEquipment.internalNo,
      category: selectedEquipment.category,
      department: selectedEquipment.department,
      location: selectedEquipment.location,
      building: selectedEquipment.building,
      floor: selectedEquipment.floor,
      reporterName: reporterName.trim() || '科室临床人员',
      reporterPhone: reporterPhone.trim() || '13863371000',
      reportTime: nowStr,
      priority,
      workOrderType,
      faultDescription: faultDescription.trim(),
      status: 'pending_dispatch',
      biomedicalGroup: group,
      partsReplaced: [],
      totalRepairCost: 0,
      totalDowntimeHours: 0.1,
      slaResponseLimitMinutes: SLA_RESPONSE_LIMITS[priority],
      slaRepairLimitHours: SLA_REPAIR_LIMITS[priority],
      isSlaResponseMet: false,
      isSlaRepairMet: false
    };

    onCreateWorkOrder(newOrder);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-4.5 bg-gradient-to-r from-blue-700 to-indigo-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-white/15 flex items-center justify-center font-bold shrink-0">
              <PlusCircle className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold">发起医工应急抢修 / 维修派工申请</h3>
              <p className="text-xs text-white/80 mt-0.5">
                全院临床科室一键极速报修 · 直连医工保障中心与责任工程师
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
          {/* Step 1: Equipment Selection */}
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

          {/* Step 2: Priority & SLA Choice */}
          <div className="space-y-2">
            <label className="font-bold text-slate-800 block">
              2. 紧缓级别与三甲 SLA 考核等级 <span className="text-rose-500">*</span>
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

          {/* Step 3: Work Order Type */}
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

          {/* Step 4: Fault Description */}
          <div className="space-y-1">
            <label className="font-bold text-slate-800 block">
              4. 故障现象与临床诉求描述 <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              value={faultDescription}
              onChange={(e) => setFaultDescription(e.target.value)}
              placeholder="请详细描述开机报错代码、声光报警信息、损坏部位、当时正在执行的操作以及对临床患者诊疗的紧急影响..."
              className="w-full p-2.5 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            />
          </div>

          {/* Step 5: Reporter Contact */}
          <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 border border-slate-200 rounded-lg">
            <div>
              <label className="block text-2xs font-semibold text-slate-600 mb-1">报修发起人姓名</label>
              <input
                type="text"
                value={reporterName}
                onChange={(e) => setReporterName(e.target.value)}
                className="w-full p-2 text-xs bg-white border border-slate-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-2xs font-semibold text-slate-600 mb-1">临床联系电话 / 手机</label>
              <input
                type="text"
                value={reporterPhone}
                onChange={(e) => setReporterPhone(e.target.value)}
                className="w-full p-2 text-xs bg-white border border-slate-200 rounded-lg"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
            >
              取消
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-xs transition flex items-center gap-1.5 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>立即提交报修并进入派工调度池</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

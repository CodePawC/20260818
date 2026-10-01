import React, { useState } from 'react';
import { 
  X, 
  Wrench, 
  AlertTriangle, 
  Upload, 
  Sparkles, 
  CheckCircle2, 
  Building2, 
  User, 
  Phone, 
  Clock, 
  ShieldAlert,
  Search,
  Check
} from 'lucide-react';
import { MedicalEquipment, AuthUser } from '../../types';
import { ClosedLoopRepairTask } from '../../types/closedLoopRepairTypes';

interface NewRepairReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (newTask: ClosedLoopRepairTask) => void;
  equipmentList: MedicalEquipment[];
  currentUser: AuthUser | null;
}

const FAULT_TEMPLATES = [
  {
    title: '输尿管硬镜视野起雾模糊/内部受潮',
    type: '光学成像模糊 / 镜体起雾 / 柱镜微裂',
    desc: '术中发现输尿管镜视野严重模糊起雾，光轴反光，内部受潮，透光率剧降，无法清晰分辨输尿管壁与结石边界，需设备科紧急现场检测。',
    impact: '科室仅剩 1 条备用镜，无法支持全天排台，存在急诊碎石停台风险，亟需现场核验处置。',
    urgency: 'critical' as const
  },
  {
    title: '麻醉机流量传感器校准报警/潮气量漂移',
    type: '流量传感器校准失败 / 潮气量监测漂移',
    desc: '晨起开机自检报错 Err-32，呼气潮气量与设定值偏差超过 25%，机械通气回路存在微量泄漏声，已停用并切换备用气源。',
    impact: '本日排期 4 台全麻手术，手术室需准时接台，急需工程师到室排查排除故障。',
    urgency: 'high' as const
  },
  {
    title: '高频电刀双极输出异常/触控屏失效',
    type: '高频能量输出中断 / 触控失灵',
    desc: '电凝双极输出功率不稳定，偶发断档无能量输出，面板触控参数调节反应迟钝，影响术中止血效率。',
    impact: '涉及术中精准凝血安全，需工程师现场安全复测。',
    urgency: 'high' as const
  }
];

export const NewRepairReportModal: React.FC<NewRepairReportModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  equipmentList,
  currentUser
}) => {
  if (!isOpen) return null;

  // 默认过滤麻醉手术科设备
  const anesthesiaEquipments = equipmentList.filter(
    e => e.department === '麻醉手术科' || e.ownerDepartment === '麻醉手术科' || e.category.includes('内窥镜') || e.category.includes('麻醉')
  );

  const [selectedEqId, setSelectedEqId] = useState<string>(
    anesthesiaEquipments.find(e => e.name.includes('输尿管') || e.sn.includes('RW-'))?.id ||
    anesthesiaEquipments[0]?.id ||
    equipmentList[0]?.id ||
    ''
  );

  const [searchKw, setSearchKw] = useState('');
  const selectedEquipment = equipmentList.find(e => e.id === selectedEqId);

  // 报修表单数据
  const [department, setDepartment] = useState('麻醉手术科');
  const [reporterName, setReporterName] = useState(currentUser?.name || '黄晓彤');
  const [reporterRole, setReporterRole] = useState(currentUser?.role || '麻醉手术科护士长');
  const [reporterPhone, setReporterPhone] = useState('7991086 / 13863371086');
  const [faultTime, setFaultTime] = useState(new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-').slice(0, 16));
  const [urgency, setUrgency] = useState<'critical' | 'high' | 'normal'>('critical');
  const [faultType, setFaultType] = useState('光学成像模糊 / 镜体起雾 / 柱镜微裂');
  const [faultDescription, setFaultDescription] = useState(
    '术中发现输尿管镜视野严重模糊起雾，图像光轴反光，无法清晰分辨输尿管壁与结石边界，严重影响手术安全。紧急更换备用镜后，该镜需设备科现场紧急勘查鉴定。'
  );
  const [clinicalImpact, setClinicalImpact] = useState(
    '科室仅剩 1 条备用镜，无法支持全天高密度碎石台次排期，存在急诊微创停台风险，亟需加急核验处置。'
  );
  const [photoUrl, setPhotoUrl] = useState<string>(
    'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=600&q=80'
  );

  // 快速套用模板
  const handleApplyTemplate = (tmpl: typeof FAULT_TEMPLATES[0]) => {
    setFaultType(tmpl.type);
    setFaultDescription(tmpl.desc);
    setClinicalImpact(tmpl.impact);
    setUrgency(tmpl.urgency);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEquipment) return;

    const nowStr = new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-').slice(0, 16);
    const taskId = `TASK-${Date.now().toString().slice(-8)}`;
    const taskNo = `CL-REP-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(new Date().getDate()).padStart(2, '0')}-${Date.now().toString().slice(-3)}`;

    const newTask: ClosedLoopRepairTask = {
      id: taskId,
      taskNo,
      equipmentId: selectedEquipment.id,
      equipmentName: selectedEquipment.name,
      equipmentModel: selectedEquipment.model,
      equipmentSn: selectedEquipment.sn,
      assetNo: selectedEquipment.assetNo || `ZC-${selectedEquipment.id}`,
      internalNo: selectedEquipment.internalNo,
      equipmentCategory: selectedEquipment.category,
      purchasePrice: selectedEquipment.purchasePrice || 168000,
      enableDate: selectedEquipment.enableDate || '2023-04-20',
      equipmentLocation: selectedEquipment.location || `${selectedEquipment.building || '1号楼'} ${selectedEquipment.floor || '8F'} 麻醉手术科`,
      
      department,
      reporterId: currentUser?.id || 'STAFF-267-02',
      reporterName,
      reporterRole,
      reporterPhone,
      faultTime,
      urgency,
      faultType,
      faultDescription,
      clinicalImpact,
      evidencePhotos: photoUrl ? [photoUrl] : [],
      
      stage: 'reported',
      status: '待现场核验',

      timeline: [
        {
          id: `EVT-${Date.now()}-01`,
          stage: '科室报修',
          title: `${department}提交设备故障报修申请`,
          actorName: reporterName,
          actorRole: reporterRole,
          actorDept: department,
          time: nowStr,
          notes: `报修设备【${selectedEquipment.name}】(${selectedEquipment.model})，紧迫度【${urgency === 'critical' ? '紧急' : urgency === 'high' ? '高急' : '常规'}】，已呼叫设备科紧急现场核验。`,
          badgeColor: 'blue'
        },
        {
          id: `EVT-${Date.now()}-02`,
          stage: '任务生成',
          title: '系统自动生成维修闭环工单记录',
          actorName: '智慧医学中枢',
          actorRole: '闭环调度引擎',
          actorDept: '设备调度中心',
          time: nowStr,
          notes: `生成关联维修任务编号【${taskNo}】，资产状态已联动更新为【故障待修】，已推送通知至设备科责任工程师。`,
          badgeColor: 'indigo'
        }
      ],

      createdAt: nowStr,
      updatedAt: nowStr
    };

    onSubmit(newTask);
    onClose();
  };

  const filteredEquipments = equipmentList.filter(eq => {
    if (!searchKw) return true;
    const kw = searchKw.toLowerCase();
    return (
      eq.name.toLowerCase().includes(kw) ||
      eq.model.toLowerCase().includes(kw) ||
      eq.sn.toLowerCase().includes(kw) ||
      (eq.assetNo && eq.assetNo.toLowerCase().includes(kw)) ||
      eq.department.toLowerCase().includes(kw)
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-700 via-teal-800 to-indigo-900 px-6 py-5 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20 shadow-inner">
              <Wrench className="w-5 h-5 text-teal-200" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-lg font-bold">麻醉手术科 · 提交临床设备故障报修申请</h3>
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-teal-400/20 text-teal-200 border border-teal-300/30">
                  闭环第 1 阶
                </span>
              </div>
              <p className="text-xs text-teal-100/80 mt-0.5">
                报修提交后将自动生成关联闭环维修任务记录，并实时推送至医学设备科现场核验
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-teal-100 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[82vh] overflow-y-auto">
          {/* Quick Template Selector */}
          <div className="bg-teal-50/70 border border-teal-200/80 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-teal-900 flex items-center space-x-1.5">
                <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                <span>手术室高频故障快速模板（一键填单）：</span>
              </span>
              <span className="text-[11px] text-teal-700">点击自动填充故障类型、详细描述与紧迫度</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              {FAULT_TEMPLATES.map((tmpl, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleApplyTemplate(tmpl)}
                  className="text-left p-2.5 rounded-lg bg-white border border-teal-100 hover:border-teal-400 hover:shadow-sm transition-all group"
                >
                  <div className="text-xs font-semibold text-slate-800 group-hover:text-teal-700">
                    {tmpl.title}
                  </div>
                  <div className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                    {tmpl.desc}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Equipment Asset Selection */}
          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/60">
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-bold text-slate-800 flex items-center space-x-2">
                <Building2 className="w-4 h-4 text-teal-600" />
                <span>选择报修关联设备资产 *</span>
              </label>
              <div className="relative w-64">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="搜索科室设备名称/型号/SN..."
                  value={searchKw}
                  onChange={e => setSearchKw(e.target.value)}
                  className="w-full text-xs pl-8 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-48 overflow-y-auto p-1">
              {filteredEquipments.slice(0, 8).map(eq => {
                const isSelected = eq.id === selectedEqId;
                const isWolfEndoscope = eq.name.includes('输尿管') || eq.sn.includes('RW-');
                return (
                  <div
                    key={eq.id}
                    onClick={() => setSelectedEqId(eq.id)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start space-x-3 ${
                      isSelected
                        ? 'bg-teal-50/90 border-teal-500 ring-2 ring-teal-500/20 shadow-sm'
                        : 'bg-white border-slate-200 hover:border-teal-300'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-lg bg-teal-100/60 text-teal-700 flex items-center justify-center shrink-0 font-bold text-xs">
                      {eq.name.slice(0, 2)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-800 truncate">{eq.name}</span>
                        {isWolfEndoscope && (
                          <span className="px-1.5 py-0.2 rounded text-[10px] bg-amber-100 text-amber-800 font-semibold">
                            重点内镜
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 truncate mt-0.5">{eq.model}</p>
                      <div className="flex items-center space-x-2 text-[10px] text-slate-400 mt-1">
                        <span>SN: {eq.sn}</span>
                        <span>•</span>
                        <span>{eq.department}</span>
                      </div>
                    </div>
                    {isSelected && (
                      <div className="w-4 h-4 rounded-full bg-teal-600 text-white flex items-center justify-center shrink-0">
                        <Check className="w-3 h-3" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {selectedEquipment && (
              <div className="mt-3 bg-white p-3 rounded-lg border border-teal-200 text-xs flex flex-wrap items-center justify-between gap-2 text-slate-700">
                <div>
                  <span className="text-slate-400">当前锁定资产：</span>
                  <span className="font-bold text-teal-800">{selectedEquipment.name}</span>
                  <span className="text-slate-500 ml-2">({selectedEquipment.model})</span>
                </div>
                <div className="flex items-center space-x-3 text-slate-500">
                  <span>编号: <b className="text-slate-800">{selectedEquipment.assetNo || selectedEquipment.id}</b></span>
                  <span>原值: <b className="text-emerald-700">¥{(selectedEquipment.purchasePrice || 168000).toLocaleString()}</b></span>
                  <span>位置: <b className="text-slate-800">{selectedEquipment.location || '综合楼8F 手术室'}</b></span>
                </div>
              </div>
            )}
          </div>

          {/* Reporter & Contact Info */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">报修科室</label>
              <div className="relative">
                <Building2 className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={department}
                  onChange={e => setDepartment(e.target.value)}
                  className="w-full text-xs pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">报修人姓名</label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={reporterName}
                  onChange={e => setReporterName(e.target.value)}
                  className="w-full text-xs pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">报修人职务</label>
              <input
                type="text"
                value={reporterRole}
                onChange={e => setReporterRole(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">联系电话 / 短号</label>
              <div className="relative">
                <Phone className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={reporterPhone}
                  onChange={e => setReporterPhone(e.target.value)}
                  className="w-full text-xs pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  required
                />
              </div>
            </div>
          </div>

          {/* Fault Category, Urgency & Time */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">故障分类 *</label>
              <input
                type="text"
                value={faultType}
                onChange={e => setFaultType(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">紧迫程度 *</label>
              <div className="flex space-x-2">
                {[
                  { key: 'critical', label: '紧急 (影响急诊/手术)', color: 'border-rose-500 bg-rose-50 text-rose-700' },
                  { key: 'high', label: '高急 (4小时内响应)', color: 'border-amber-500 bg-amber-50 text-amber-700' },
                  { key: 'normal', label: '常规 (24小时内)', color: 'border-slate-300 bg-white text-slate-700' }
                ].map(item => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setUrgency(item.key as any)}
                    className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold border text-center transition-all ${
                      urgency === item.key ? `${item.color} shadow-xs ring-1 ring-rose-500/20` : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">发现时间</label>
              <div className="relative">
                <Clock className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={faultTime}
                  onChange={e => setFaultTime(e.target.value)}
                  className="w-full text-xs pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>
          </div>

          {/* Fault Description & Clinical Impact */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              故障具体现象与详细陈述 *
            </label>
            <textarea
              rows={3}
              value={faultDescription}
              onChange={e => setFaultDescription(e.target.value)}
              className="w-full text-xs p-3 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
              placeholder="请详细描述故障现象、发生工况及初步排查情况..."
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              临床手术与排台影响评估
            </label>
            <input
              type="text"
              value={clinicalImpact}
              onChange={e => setClinicalImpact(e.target.value)}
              className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              placeholder="例：科室仅剩1条备用镜，存在停台风险..."
            />
          </div>

          {/* Photo Evidence */}
          <div className="border border-dashed border-slate-300 rounded-xl p-4 bg-slate-50/50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-700 flex items-center space-x-1.5">
                <Upload className="w-4 h-4 text-teal-600" />
                <span>现场故障照片存证 (光学内窥镜视野/机器报错)</span>
              </span>
              <span className="text-[11px] text-slate-400">支持上传或预览</span>
            </div>
            <div className="flex items-center space-x-4">
              {photoUrl && (
                <div className="w-24 h-24 rounded-lg overflow-hidden border border-slate-200 relative group shrink-0">
                  <img src={photoUrl} alt="故障现场照片" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px]">
                    已存证
                  </div>
                </div>
              )}
              <div className="flex-1 space-y-2">
                <input
                  type="text"
                  placeholder="输入照片 URL 或保留默认存证照片..."
                  value={photoUrl}
                  onChange={e => setPhotoUrl(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
                <p className="text-[11px] text-slate-400">
                  可上传手术室内窥镜成像显示屏视野起雾、反光或错误代码照片，便于设备科工程师核验时比对。
                </p>
              </div>
            </div>
          </div>

          {/* Action Footer */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
            <div className="flex items-center space-x-2 text-xs text-slate-500">
              <CheckCircle2 className="w-4 h-4 text-teal-600" />
              <span>提交后将立即生成专属任务记录【CL-REP-20260923-xx】</span>
            </div>
            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                取消
              </button>
              <button
                type="submit"
                className="px-6 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 shadow-md hover:shadow-lg transition-all flex items-center space-x-2"
              >
                <Wrench className="w-4 h-4" />
                <span>确认提交报修并生成维修任务</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

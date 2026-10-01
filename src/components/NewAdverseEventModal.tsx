import React, { useState } from 'react';
import { 
  X, 
  AlertTriangle, 
  ShieldAlert, 
  Search, 
  Building2, 
  User, 
  Clock, 
  CheckCircle2, 
  FileText,
  Stethoscope,
  Activity,
  AlertCircle
} from 'lucide-react';
import { 
  AdverseEventRecord, 
  AdverseEventSeverity, 
  ReporterProfession, 
  AdverseEventOutcome, 
  CausalityConclusion 
} from '../types/adverseEventTypes';
import { MedicalEquipment } from '../types';

interface NewAdverseEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  equipmentList: MedicalEquipment[];
  currentUserName?: string;
  defaultEquipment?: MedicalEquipment | null;
  onSubmit: (record: AdverseEventRecord) => void;
}

export const NewAdverseEventModal: React.FC<NewAdverseEventModalProps> = ({
  isOpen,
  onClose,
  equipmentList = [],
  currentUserName = '崔工',
  defaultEquipment,
  onSubmit
}) => {
  if (!isOpen) return null;

  // Step wizard: 1. 器械与科室 2. 患者与临床过程 3. 故障表现与处置 4. 因果评价
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // 设备检索与联动
  const [searchKey, setSearchKey] = useState('');
  const [selectedEq, setSelectedEq] = useState<MedicalEquipment | null>(defaultEquipment || null);

  // 表单字段
  const [title, setTitle] = useState(
    defaultEquipment ? `${defaultEquipment.department}${defaultEquipment.name}异常事件初报` : ''
  );
  const [severity, setSeverity] = useState<AdverseEventSeverity>('potential_serious_harm');
  const [department, setDepartment] = useState(defaultEquipment?.department || '重症医学科(ICU)');
  const [reporterName, setReporterName] = useState(currentUserName);
  const [reporterPhone, setReporterPhone] = useState('13854128899');
  const [reporterProfession, setReporterProfession] = useState<ReporterProfession>('nurse');

  // 时间
  const nowStr = new Date().toISOString().slice(0, 16).replace('T', ' ');
  const [occurredAt, setOccurredAt] = useState(nowStr);
  const [discoveredAt, setDiscoveredAt] = useState(nowStr);

  // 器械明细
  const [equipmentName, setEquipmentName] = useState(defaultEquipment?.name || '');
  const [equipmentModel, setEquipmentModel] = useState(defaultEquipment?.model || '');
  const [equipmentSn, setEquipmentSn] = useState(defaultEquipment?.sn || '');
  const [manufacturer, setManufacturer] = useState(defaultEquipment?.manufacturer || '');
  const [registrationNo, setRegistrationNo] = useState('国械注准20213081234');
  const [deviceRiskClass, setDeviceRiskClass] = useState<'I' | 'II' | 'III'>('III');
  const [deviceUsageState, setDeviceUsageState] = useState<'in_use' | 'standby' | 'calibration' | 'cleaning'>('in_use');
  const [consumablesName, setConsumablesName] = useState('');
  const [consumablesBatchNo, setConsumablesBatchNo] = useState('');

  // 患者与临床
  const [patientNameMasked, setPatientNameMasked] = useState('李*生');
  const [patientMedicalRecordNo, setPatientMedicalRecordNo] = useState(`ZY-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`);
  const [patientGender, setPatientGender] = useState<'男' | '女' | '其他'>('男');
  const [patientAge, setPatientAge] = useState<number>(58);
  const [primaryDiagnosis, setPrimaryDiagnosis] = useState('重症监护救治');
  const [deviceUsagePurpose, setDeviceUsagePurpose] = useState('临床监测与治疗支持');
  const [harmDescription, setHarmDescription] = useState('');
  const [clinicalOutcome, setClinicalOutcome] = useState<AdverseEventOutcome>('no_harm');
  const [remedialMedicalAction, setRemedialMedicalAction] = useState('立即脱机使用应急备机替代，评估生命体征平稳');

  // 故障与处置
  const [faultPhenomenon, setFaultPhenomenon] = useState('');
  const [immediateAction, setImmediateAction] = useState('现场立即停机并贴封存标识，换用应急备机，保留原装耗材批次');
  const [samplePreserved, setSamplePreserved] = useState(true);

  // 因果准则
  const [crit1, setCrit1] = useState(true);
  const [crit2, setCrit2] = useState(true);
  const [crit3, setCrit3] = useState<boolean | null>(true);
  const [crit4, setCrit4] = useState<boolean | null>(null);
  const [crit5, setCrit5] = useState<'excluded' | 'partial' | 'cannot_exclude'>('excluded');
  const [causalityConclusion, setCausalityConclusion] = useState<CausalityConclusion>('probable');

  // 选中设备自动回填
  const handleSelectEquipment = (eq: MedicalEquipment) => {
    setSelectedEq(eq);
    setEquipmentName(eq.name);
    setEquipmentModel(eq.model);
    setEquipmentSn(eq.sn);
    setManufacturer(eq.manufacturer);
    setDepartment(eq.department);
    if (!title) {
      setTitle(`${eq.department}${eq.name}使用异常与疑似不良事件初报`);
    }
  };

  const filteredEquipment = searchKey.trim()
    ? (equipmentList || []).filter(e => 
        e.name.toLowerCase().includes(searchKey.toLowerCase()) ||
        e.sn.toLowerCase().includes(searchKey.toLowerCase()) ||
        (e.assetNo && e.assetNo.toLowerCase().includes(searchKey.toLowerCase())) ||
        e.department.toLowerCase().includes(searchKey.toLowerCase())
      ).slice(0, 6)
    : [];

  const handleFinalSubmit = () => {
    if (!equipmentName.trim() || !equipmentSn.trim()) {
      alert('请先选择或填写涉及的医疗器械名称及出厂SN编号');
      setStep(1);
      return;
    }
    if (!harmDescription.trim() && !faultPhenomenon.trim()) {
      alert('请简要描述事件过程或设备故障现象');
      setStep(3);
      return;
    }

    const reportId = `MDR-${new Date().getFullYear()}${(new Date().getMonth() + 1).toString().padStart(2, '0')}${new Date().getDate().toString().padStart(2, '0')}-${Math.floor(100 + Math.random() * 900)}`;
    
    // 法定时限计算：死亡24小时内，严重伤害7日内，其他20日内
    const deadlineDate = new Date();
    if (severity === 'death') {
      deadlineDate.setDate(deadlineDate.getDate() + 1);
    } else if (severity === 'serious_injury' || severity === 'potential_serious_harm') {
      deadlineDate.setDate(deadlineDate.getDate() + 7);
    } else {
      deadlineDate.setDate(deadlineDate.getDate() + 20);
    }
    const statutoryDeadline = `${deadlineDate.toISOString().slice(0, 10)} 23:59`;

    const newRecord: AdverseEventRecord = {
      id: reportId,
      title: title.trim() || `${department}${equipmentName}不良事件报告`,
      status: 'pending_review',
      severity,
      occurredAt,
      discoveredAt,
      reportedAt: nowStr,
      statutoryDeadline,
      isOverdueRisk: false,
      department,
      reporterName,
      reporterPhone,
      reporterProfession,
      isAdverseKeyDepartment: ['重症医学科', 'ICU', '麻醉', '手术室', '血液透析', '急诊'].some(k => department.includes(k)),

      equipmentId: selectedEq?.id,
      equipmentAssetNo: selectedEq?.assetNo,
      equipmentName,
      equipmentModel,
      equipmentSn,
      udiCode: selectedEq?.codeId ? `(01)06912345678901(21)${selectedEq.sn}` : undefined,
      manufacturer: manufacturer || '合规医疗器械制造商',
      manufacturerContact: '400-800-6688',
      registrationNo,
      deviceRiskClass,
      enableDate: selectedEq?.enableDate,
      deviceUsageState,
      consumablesName: consumablesName || undefined,
      consumablesBatchNo: consumablesBatchNo || undefined,

      patientNameMasked,
      patientMedicalRecordNo,
      patientGender,
      patientAge,
      primaryDiagnosis,
      deviceUsagePurpose,
      harmDescription: harmDescription || '使用过程中突发异常，现场立即启动安全应急预案，患者生命体征平稳。',
      clinicalOutcome,
      remedialMedicalAction,

      faultPhenomenon: faultPhenomenon || '仪器运行中声光报错中断，参数显示异常。',
      immediateAction,
      deviceCurrentStatus: 'quarantined',
      samplePreserved,
      associatedWorkOrderId: undefined,

      causalityCriterion1_timeSequence: crit1,
      causalityCriterion2_knownRisk: crit2,
      causalityCriterion3_dechallenge: crit3,
      causalityCriterion4_rechallenge: crit4,
      causalityCriterion5_alternativeCause: crit5,
      causalityConclusion,
      evaluatorName: currentUserName,
      evaluatedAt: nowStr,

      capaList: [],
      timeline: [
        {
          id: `LOG-${Date.now()}`,
          timestamp: nowStr,
          operator: `${reporterName} (${reporterProfession === 'nurse' ? '临床护理' : reporterProfession === 'physician' ? '临床医师' : '医学工程师'})`,
          action: '填报不良事件初报单',
          details: `提交直报单，严重程度评定为【${severity === 'death' ? '死亡' : severity === 'serious_injury' ? '严重伤害' : severity === 'potential_serious_harm' ? '可能导致严重伤害' : '其他'}】，等待医工处联合技术排查。`
        }
      ]
    };

    onSubmit(newRecord);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white px-5 py-4 flex items-center justify-between border-b border-indigo-900/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold tracking-tight">医疗器械不良事件（MDR）监测与警戒直报</h3>
                <span className="px-2 py-0.5 text-2xs rounded bg-rose-500/30 text-rose-200 border border-rose-400/40 font-mono">
                  国家标准表单
                </span>
              </div>
              <p className="text-xs text-slate-300">
                依据《医疗器械不良事件监测和再评价管理办法》规范填报，直连国家不良事件监测网直报中心
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Wizard Steps Navigation */}
        <div className="bg-slate-50 px-6 py-2.5 border-b border-slate-200 flex items-center justify-between text-xs">
          {[
            { stepNum: 1, label: '涉及器械与科室' },
            { stepNum: 2, label: '患者临床转归' },
            { stepNum: 3, label: '故障表现与应急处置' },
            { stepNum: 4, label: '因果关系自评与提交' }
          ].map((s) => (
            <button
              key={s.stepNum}
              type="button"
              onClick={() => setStep(s.stepNum as any)}
              className={`flex items-center gap-2 font-medium transition cursor-pointer pb-0.5 ${
                step === s.stepNum 
                  ? 'text-indigo-600 border-b-2 border-indigo-600 font-bold' 
                  : step > s.stepNum 
                  ? 'text-emerald-600 hover:text-emerald-700' 
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-2xs font-mono ${
                step === s.stepNum 
                  ? 'bg-indigo-600 text-white' 
                  : step > s.stepNum 
                  ? 'bg-emerald-100 text-emerald-700' 
                  : 'bg-slate-200 text-slate-500'
              }`}>
                {s.stepNum}
              </span>
              <span>{s.label}</span>
            </button>
          ))}
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 text-xs">

          {/* STEP 1: 涉及器械与科室 */}
          {step === 1 && (
            <div className="space-y-4">
              {/* 严重度与法定时效警示栏 */}
              <div className="p-3.5 rounded-lg border bg-rose-50/50 border-rose-200 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="text-xs font-bold text-rose-900 flex items-center gap-2">
                    <span>事件严重程度等级判定（法定直报红线）</span>
                    <span className="text-2xs font-normal text-rose-700">
                      * 导致死亡必须在24小时内报告；严重伤害/险失事件必须在7日内报告
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                    {[
                      { key: 'death', label: '死亡事件', desc: '导致患者或他人死亡', color: 'border-rose-600 bg-rose-100/60 text-rose-900' },
                      { key: 'serious_injury', label: '严重伤害', desc: '危及生命/机体结构永久性伤害', color: 'border-rose-400 bg-rose-50 text-rose-800' },
                      { key: 'potential_serious_harm', label: '可能导致严重伤害 (Near-Miss)', desc: '器械险失事件/再次发生极可能致死伤', color: 'border-amber-400 bg-amber-50 text-amber-800' },
                      { key: 'other', label: '其他不良事件', desc: '其他器械不良反应或轻微故障', color: 'border-slate-300 bg-white text-slate-700' }
                    ].map(item => (
                      <label
                        key={item.key}
                        className={`p-2 rounded-lg border cursor-pointer flex flex-col justify-between transition ${
                          severity === item.key 
                            ? `${item.color} ring-2 ring-indigo-500/50 font-bold shadow-xs` 
                            : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs">{item.label}</span>
                          <input
                            type="radio"
                            name="severity"
                            checked={severity === item.key}
                            onChange={() => setSeverity(item.key as any)}
                            className="text-indigo-600"
                          />
                        </div>
                        <span className="text-3xs text-slate-500 font-normal mt-1 leading-tight">{item.desc}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {/* 台账检索联动选择器 */}
              <div className="p-3.5 bg-indigo-50/40 rounded-lg border border-indigo-100 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-indigo-950 flex items-center gap-1.5">
                    <Search className="w-3.5 h-3.5 text-indigo-600" />
                    <span>快速检索并关联全院医疗设备台账（自动提取SN、注册证号、企业）</span>
                  </div>
                  {selectedEq && (
                    <span className="px-2 py-0.5 rounded text-2xs bg-emerald-100 text-emerald-800 font-bold">
                      已绑定：{selectedEq.name} ({selectedEq.sn})
                    </span>
                  )}
                </div>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="输入设备名称、SN编号、资产编号或科室快速模糊匹配..."
                    value={searchKey}
                    onChange={(e) => setSearchKey(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded text-xs focus:ring-1 focus:ring-indigo-500"
                  />
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                </div>
                {filteredEquipment.length > 0 && (
                  <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-1.5 space-y-1">
                    {filteredEquipment.map(eq => (
                      <div
                        key={eq.id}
                        onClick={() => handleSelectEquipment(eq)}
                        className="p-1.5 hover:bg-indigo-50/80 rounded flex items-center justify-between cursor-pointer transition"
                      >
                        <div className="space-y-0.5">
                          <div className="font-bold text-slate-800 flex items-center gap-2">
                            <span>{eq.name}</span>
                            <span className="text-3xs font-mono text-slate-500">{eq.model}</span>
                            <span className="text-3xs px-1 rounded bg-slate-100 text-slate-600">{eq.department}</span>
                          </div>
                          <div className="text-3xs text-slate-500">
                            SN: <span className="font-mono">{eq.sn}</span> | 厂商: {eq.manufacturer}
                          </div>
                        </div>
                        <button
                          type="button"
                          className="px-2 py-0.5 bg-indigo-600 text-white rounded text-3xs font-bold hover:bg-indigo-700 cursor-pointer"
                        >
                          选用
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 器械信息明细表单 */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">事件名称/标题概要 *</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="如: 重症医学科呼吸机呼气阀卡阻高压报警"
                    className="w-full p-2 bg-white border border-slate-200 rounded text-xs focus:ring-1 focus:ring-indigo-500 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">器械名称 *</label>
                  <input
                    type="text"
                    value={equipmentName}
                    onChange={(e) => setEquipmentName(e.target.value)}
                    placeholder="设备名称"
                    className="w-full p-2 bg-white border border-slate-200 rounded text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">规格型号 *</label>
                  <input
                    type="text"
                    value={equipmentModel}
                    onChange={(e) => setEquipmentModel(e.target.value)}
                    placeholder="型号规格"
                    className="w-full p-2 bg-white border border-slate-200 rounded text-xs"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">出厂编号 (SN) *</label>
                  <input
                    type="text"
                    value={equipmentSn}
                    onChange={(e) => setEquipmentSn(e.target.value)}
                    placeholder="出厂SN流水号"
                    className="w-full p-2 bg-white border border-slate-200 rounded text-xs font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">生产企业名称 *</label>
                  <input
                    type="text"
                    value={manufacturer}
                    onChange={(e) => setManufacturer(e.target.value)}
                    placeholder="如: 深圳迈瑞生物医疗电子股份有限公司"
                    className="w-full p-2 bg-white border border-slate-200 rounded text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">医疗器械注册证号/备案号</label>
                  <input
                    type="text"
                    value={registrationNo}
                    onChange={(e) => setRegistrationNo(e.target.value)}
                    placeholder="如: 国械注准20213081234"
                    className="w-full p-2 bg-white border border-slate-200 rounded text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">医疗器械管理分类</label>
                  <select
                    value={deviceRiskClass}
                    onChange={(e) => setDeviceRiskClass(e.target.value as any)}
                    className="w-full p-2 bg-white border border-slate-200 rounded text-xs"
                  >
                    <option value="III">第三类 (高风险生命支持设备，如呼吸机/除颤仪/电刀)</option>
                    <option value="II">第二类 (中风险设备，如常规监护仪/注射泵/心电图机)</option>
                    <option value="I">第一类 (低风险器械/普通检查床)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">事件发生时器械状态</label>
                  <select
                    value={deviceUsageState}
                    onChange={(e) => setDeviceUsageState(e.target.value as any)}
                    className="w-full p-2 bg-white border border-slate-200 rounded text-xs"
                  >
                    <option value="in_use">在用 (正连接患者使用中)</option>
                    <option value="standby">待机准备 (交接班或抢救备用)</option>
                    <option value="calibration">自检校准 / 定标中</option>
                    <option value="cleaning">清洁消毒 / 维保调试中</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">涉及配套耗材名称/批号</label>
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      placeholder="耗材名称"
                      value={consumablesName}
                      onChange={(e) => setConsumablesName(e.target.value)}
                      className="w-1/2 p-2 bg-white border border-slate-200 rounded text-xs"
                    />
                    <input
                      type="text"
                      placeholder="批号LOT"
                      value={consumablesBatchNo}
                      onChange={(e) => setConsumablesBatchNo(e.target.value)}
                      className="w-1/2 p-2 bg-white border border-slate-200 rounded text-xs font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* 报告人信息 */}
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-slate-600 font-bold mb-1">报告科室</label>
                  <input
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full p-1.5 bg-white border border-slate-200 rounded text-xs font-medium"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-bold mb-1">报告人姓名</label>
                  <input
                    type="text"
                    value={reporterName}
                    onChange={(e) => setReporterName(e.target.value)}
                    className="w-full p-1.5 bg-white border border-slate-200 rounded text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-bold mb-1">报告人电话</label>
                  <input
                    type="text"
                    value={reporterPhone}
                    onChange={(e) => setReporterPhone(e.target.value)}
                    className="w-full p-1.5 bg-white border border-slate-200 rounded text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-bold mb-1">报告人职务类别</label>
                  <select
                    value={reporterProfession}
                    onChange={(e) => setReporterProfession(e.target.value as any)}
                    className="w-full p-1.5 bg-white border border-slate-200 rounded text-xs"
                  >
                    <option value="nurse">临床护士 / 护士长</option>
                    <option value="physician">主管医生 / 临床医师</option>
                    <option value="clinical_engineer">医学工程师 / 设备科</option>
                    <option value="technician">医技技师</option>
                    <option value="other">其他人员</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: 患者临床过程与转归 */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="p-3 bg-indigo-50/50 rounded-lg border border-indigo-100 flex items-center gap-2">
                <Stethoscope className="w-4 h-4 text-indigo-600" />
                <span className="font-bold text-indigo-900">患者临床病史、机体损害及救治转归记录（已执行隐私脱敏保护）</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">患者姓名 (脱敏) *</label>
                  <input
                    type="text"
                    value={patientNameMasked}
                    onChange={(e) => setPatientNameMasked(e.target.value)}
                    placeholder="如: 赵*刚"
                    className="w-full p-2 bg-white border border-slate-200 rounded text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">住院号/病历号 *</label>
                  <input
                    type="text"
                    value={patientMedicalRecordNo}
                    onChange={(e) => setPatientMedicalRecordNo(e.target.value)}
                    placeholder="如: ZY-2026-88301"
                    className="w-full p-2 bg-white border border-slate-200 rounded text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">性别 / 年龄</label>
                  <div className="flex gap-2">
                    <select
                      value={patientGender}
                      onChange={(e) => setPatientGender(e.target.value as any)}
                      className="w-1/2 p-2 bg-white border border-slate-200 rounded text-xs"
                    >
                      <option value="男">男</option>
                      <option value="女">女</option>
                      <option value="其他">其他</option>
                    </select>
                    <input
                      type="number"
                      value={patientAge}
                      onChange={(e) => setPatientAge(Number(e.target.value))}
                      placeholder="岁"
                      className="w-1/2 p-2 bg-white border border-slate-200 rounded text-xs font-mono"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">临床转归结局 *</label>
                  <select
                    value={clinicalOutcome}
                    onChange={(e) => setClinicalOutcome(e.target.value as any)}
                    className="w-full p-2 bg-white border border-slate-200 rounded text-xs font-bold text-slate-800"
                  >
                    <option value="no_harm">未发生损害 (及时干预/险失事件)</option>
                    <option value="cured">痊愈 (经抢救已康复)</option>
                    <option value="improved">好转</option>
                    <option value="sequelae">遗留后遗症</option>
                    <option value="death">死亡</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">原发疾病与临床诊断</label>
                <input
                  type="text"
                  value={primaryDiagnosis}
                  onChange={(e) => setPrimaryDiagnosis(e.target.value)}
                  placeholder="如: 急性呼吸衰竭、重症肺炎、术后生命支持"
                  className="w-full p-2 bg-white border border-slate-200 rounded text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">使用该医疗器械目的</label>
                <input
                  type="text"
                  value={deviceUsagePurpose}
                  onChange={(e) => setDeviceUsagePurpose(e.target.value)}
                  placeholder="如: 机械通气维持血氧饱和度、微量泵入血管活性药物"
                  className="w-full p-2 bg-white border border-slate-200 rounded text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  对患者造成的机体伤害或潜在威胁陈述 *
                </label>
                <textarea
                  rows={3}
                  value={harmDescription}
                  onChange={(e) => setHarmDescription(e.target.value)}
                  placeholder="详细描述患者在事件发生时的生命体征变化、临床表现（如低氧血症、电击感、局部红肿烫伤、用药量突变等），以及医护人员的第一反应。"
                  className="w-full p-2 bg-white border border-slate-200 rounded text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">采取的急救医疗处置措施</label>
                <input
                  type="text"
                  value={remedialMedicalAction}
                  onChange={(e) => setRemedialMedicalAction(e.target.value)}
                  placeholder="如: 立即换用简易呼吸气囊给氧、静脉推注地塞米松、急请专科会诊"
                  className="w-full p-2 bg-white border border-slate-200 rounded text-xs"
                />
              </div>
            </div>
          )}

          {/* STEP 3: 故障表现与应急处置 */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                <span className="font-bold text-amber-900">器械故障现场现象、实物封存与应急库设备替换协同</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">事件发生时间</label>
                  <input
                    type="text"
                    value={occurredAt}
                    onChange={(e) => setOccurredAt(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-200 rounded text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">发现时间</label>
                  <input
                    type="text"
                    value={discoveredAt}
                    onChange={(e) => setDiscoveredAt(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-200 rounded text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">医疗器械故障现象详述 *</label>
                <textarea
                  rows={3}
                  value={faultPhenomenon}
                  onChange={(e) => setFaultPhenomenon(e.target.value)}
                  placeholder="如: 运行中突发黑屏复位、气道压力传感器漂移报错代码 E-04、薄膜按键连击跳档、外壳发热伴焦糊味..."
                  className="w-full p-2 bg-white border border-slate-200 rounded text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">现场紧急处置与控制措施</label>
                <textarea
                  rows={2}
                  value={immediateAction}
                  onChange={(e) => setImmediateAction(e.target.value)}
                  placeholder="如: 立即切断交流电源并贴红签封存，从全院应急储备库调拨同型号备机，已通知医学工程科驻场工程师现场勘查。"
                  className="w-full p-2 bg-white border border-slate-200 rounded text-xs"
                />
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-800">实物与耗材样品留存状态</div>
                  <div className="text-3xs text-slate-500">依据法规要求，造成严重不良反应的实物应就地封存以备药监核查检验</div>
                </div>
                <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700">
                  <input
                    type="checkbox"
                    checked={samplePreserved}
                    onChange={(e) => setSamplePreserved(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded"
                  />
                  <span>已规范就地封存实物及同批次耗材</span>
                </label>
              </div>
            </div>
          )}

          {/* STEP 4: 因果关系自评与提交 */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span className="font-bold text-emerald-900">
                  国家标准医疗器械不良事件因果关系评价（五项准则法）
                </span>
              </div>

              <div className="space-y-2.5 bg-slate-50 p-3.5 rounded-lg border border-slate-200">
                <div className="flex items-center justify-between py-1 border-b border-slate-200">
                  <span className="text-slate-700">1. 使用器械与不良事件发生是否存在明确的时间先后顺序？</span>
                  <div className="flex gap-3">
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input type="radio" checked={crit1 === true} onChange={() => setCrit1(true)} /> 是
                    </label>
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input type="radio" checked={crit1 === false} onChange={() => setCrit1(false)} /> 否
                    </label>
                  </div>
                </div>

                <div className="flex items-center justify-between py-1 border-b border-slate-200">
                  <span className="text-slate-700">2. 事件表现是否属于该器械已知可能发生的不良事件（说明书或警示函）？</span>
                  <div className="flex gap-3">
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input type="radio" checked={crit2 === true} onChange={() => setCrit2(true)} /> 是
                    </label>
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input type="radio" checked={crit2 === false} onChange={() => setCrit2(false)} /> 否
                    </label>
                  </div>
                </div>

                <div className="flex items-center justify-between py-1 border-b border-slate-200">
                  <span className="text-slate-700">3. 停用该器械或排除故障后，不良反应是否停止或好转？</span>
                  <div className="flex gap-3">
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input type="radio" checked={crit3 === true} onChange={() => setCrit3(true)} /> 是
                    </label>
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input type="radio" checked={crit3 === false} onChange={() => setCrit3(false)} /> 否
                    </label>
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input type="radio" checked={crit3 === null} onChange={() => setCrit3(null)} /> 不适用
                    </label>
                  </div>
                </div>

                <div className="flex items-center justify-between py-1 border-b border-slate-200">
                  <span className="text-slate-700">4. 再次使用同类器械是否再次出现类似异常（再激发试验）？</span>
                  <div className="flex gap-3">
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input type="radio" checked={crit4 === true} onChange={() => setCrit4(true)} /> 是
                    </label>
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input type="radio" checked={crit4 === false} onChange={() => setCrit4(false)} /> 否
                    </label>
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input type="radio" checked={crit4 === null} onChange={() => setCrit4(null)} /> 未再次使用
                    </label>
                  </div>
                </div>

                <div className="flex items-center justify-between py-1">
                  <span className="text-slate-700">5. 事件是否可由患者自身病情进展、合并用药或其他因素完全解释？</span>
                  <select
                    value={crit5}
                    onChange={(e) => setCrit5(e.target.value as any)}
                    className="p-1 bg-white border border-slate-200 rounded text-xs"
                  >
                    <option value="excluded">可明确排除自身病情 (纯器械原因)</option>
                    <option value="partial">可能存在部分病情相互影响</option>
                    <option value="cannot_exclude">不能排除病情或操作因素影响</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">因果关系综合评价结论 *</label>
                <select
                  value={causalityConclusion}
                  onChange={(e) => setCausalityConclusion(e.target.value as any)}
                  className="w-full p-2.5 bg-white border-2 border-indigo-200 rounded-lg text-xs font-bold text-indigo-950 focus:border-indigo-600"
                >
                  <option value="definite">肯定相关 (Definite) - 明确为器械自身故障或设计缺陷直接所致</option>
                  <option value="probable">很可能相关 (Probable) - 时间与因果规律符合，基本排除其他因素</option>
                  <option value="possible">可能相关 (Possible) - 符合时间顺序，但不能完全排除病情或用药</option>
                  <option value="unlikely">可能无关 (Unlikely) - 与器械故障无因果逻辑，属自身病情恶化</option>
                  <option value="unassessable">待评价 (Pending) - 资料尚不完备，待原厂拆解检测结论</option>
                  <option value="unclassifiable">无法评价 (Unclassifiable)</option>
                </select>
              </div>

              <div className="p-3 bg-slate-100 rounded text-3xs text-slate-500 leading-relaxed">
                提示：提交后直报单将自动进入<strong>「待医工审核 (Pending Review)」</strong>池，系统将自动核算国家直报时限（死亡24小时 / 严重伤害7日）。医工处审核后可一键直报国家监测中心并打印纸质存档表。
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer Buttons */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex items-center justify-between">
          <div>
            {step > 1 && (
              <button
                type="button"
                onClick={() => setStep((step - 1) as any)}
                className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg text-xs font-medium hover:bg-slate-100 transition cursor-pointer"
              >
                上一步
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:text-slate-800 rounded-lg text-xs font-medium cursor-pointer"
            >
              取消
            </button>
            {step < 4 ? (
              <button
                type="button"
                onClick={() => setStep((step + 1) as any)}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-xs transition cursor-pointer"
              >
                下一步
              </button>
            ) : (
              <button
                type="button"
                onClick={handleFinalSubmit}
                className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>立即提交直报审核</span>
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

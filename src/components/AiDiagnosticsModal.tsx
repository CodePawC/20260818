import React, { useState, useEffect } from 'react';
import { MedicalEquipment } from '../types';
import { 
  X, 
  Bot, 
  Sparkles, 
  Loader2, 
  Wrench, 
  ShieldAlert, 
  CheckCircle, 
  Stethoscope, 
  Cpu, 
  Layers, 
  FileText, 
  TrendingUp, 
  CheckSquare, 
  Square,
  Copy,
  Check,
  Tag,
  History,
  Calendar,
  DollarSign,
  AlertOctagon,
  Activity,
  Clock,
  ArrowRight
} from 'lucide-react';
import { 
  AiStructuredDiagnosticResult, 
  generateLocalRuleBasedDiagnosis, 
  generateLocalPmPlan,
  AiPmPlanItem
} from '../utils/aiBiomedicalEngine';
import { AiDiagnosticConclusionPdfModal } from './AiDiagnosticConclusionPdfModal';

interface AiDiagnosticsModalProps {
  isOpen: boolean;
  equipmentList: MedicalEquipment[];
  preSelectedDevice?: MedicalEquipment | null;
  onClose: () => void;
  onOpenRepairModalWithData?: (device: MedicalEquipment, initialFaultDesc?: string, initialResolution?: string) => void;
  onOpenStatusChange?: (device: MedicalEquipment) => void;
}

export const AiDiagnosticsModal: React.FC<AiDiagnosticsModalProps> = ({
  isOpen,
  equipmentList,
  preSelectedDevice,
  onClose,
  onOpenRepairModalWithData,
  onOpenStatusChange,
}) => {
  const [selectedEquipmentId, setSelectedEquipmentId] = useState<string>('');
  const [equipmentName, setEquipmentName] = useState<string>('');
  const [model, setModel] = useState<string>('');
  const [department, setDepartment] = useState<string>('');
  const [faultDescription, setFaultDescription] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [diagnosticData, setDiagnosticData] = useState<AiStructuredDiagnosticResult | null>(null);
  const [analysisText, setAnalysisText] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'lifecycle' | 'root_causes' | 'troubleshoot' | 'parts' | 'pm_plan' | 'raw_text'>('lifecycle');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isConclusionPdfOpen, setIsConclusionPdfOpen] = useState<boolean>(false);

  useEffect(() => {
    if (preSelectedDevice) {
      setSelectedEquipmentId(preSelectedDevice.id);
      setEquipmentName(preSelectedDevice.name);
      setModel(preSelectedDevice.model);
      setDepartment(preSelectedDevice.department);
      const latestRepair = preSelectedDevice.repairRecords?.[0];
      setFaultDescription(latestRepair ? latestRepair.faultDescription : '设备运行异常，需排查故障原因。');
    } else if (equipmentList.length > 0 && !selectedEquipmentId) {
      const first = equipmentList[0];
      setSelectedEquipmentId(first.id);
      setEquipmentName(first.name);
      setModel(first.model);
      setDepartment(first.department);
      setFaultDescription('设备开机自检报警，提示模块通信超时或测量数据漂移，需医工协助排查。');
    }
  }, [preSelectedDevice, equipmentList, isOpen]);

  const handleDeviceSelectChange = (id: string) => {
    setSelectedEquipmentId(id);
    const equip = equipmentList.find(e => e.id === id);
    if (equip) {
      setEquipmentName(equip.name);
      setModel(equip.model);
      setDepartment(equip.department);
      const latestRepair = equip.repairRecords?.[0];
      setFaultDescription(latestRepair ? latestRepair.faultDescription : '设备自检报警，需工程排查。');
      setDiagnosticData(null);
      setAnalysisText('');
    }
  };

  if (!isOpen) return null;

  const currentDevice = equipmentList.find(e => e.id === selectedEquipmentId) || preSelectedDevice || null;

  const handleRunAiDiagnosis = async (): Promise<AiStructuredDiagnosticResult | null> => {
    if (!equipmentName.trim() || !faultDescription.trim()) {
      alert('请补充设备名称与故障现象描述！');
      return null;
    }

    setLoading(true);
    setErrorMsg('');
    setDiagnosticData(null);
    setAnalysisText('');

    let resultData: AiStructuredDiagnosticResult | null = null;

    try {
      const response = await fetch('/api/ai-diagnose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          equipmentName,
          model,
          department,
          faultDescription,
          category: currentDevice?.category,
          manufacturer: currentDevice?.manufacturer,
          enableDate: currentDevice?.enableDate,
          manufactureDate: currentDevice?.manufactureDate,
          purchasePrice: currentDevice?.purchasePrice,
          purchaseDate: currentDevice?.purchaseDate,
          serviceYears: currentDevice?.serviceYears,
          repairRecords: currentDevice?.repairRecords,
          lastMaintenanceDate: currentDevice?.lastMaintenanceDate,
          lastCalibrationDate: currentDevice?.lastCalibrationDate,
          equipment: currentDevice
        })
      });

      const data = await response.json();
      if (data.success && data.data) {
        resultData = data.data;
        setDiagnosticData(data.data);
        setAnalysisText(data.analysis || '');
      } else {
        const local = generateLocalRuleBasedDiagnosis(equipmentName, model, department, faultDescription, currentDevice || undefined);
        resultData = local;
        setDiagnosticData(local);
        setAnalysisText(data.analysis || `【专家规则分析】\n${local.standardizedDescription}`);
      }
    } catch (err: any) {
      console.warn('AI diagnose network error, using local fallback:', err);
      const local = generateLocalRuleBasedDiagnosis(equipmentName, model, department, faultDescription, currentDevice || undefined);
      resultData = local;
      setDiagnosticData(local);
      setAnalysisText(`【专家规则分析】\n${local.standardizedDescription}`);
    } finally {
      setLoading(false);
    }

    return resultData;
  };

  // 一键生成研判结论书 (如尚未运行AI诊断，则先运行后展开PDF)
  const handleOpenConclusionPdf = async () => {
    if (!currentDevice) {
      alert('请先选择一台设备！');
      return;
    }
    if (!faultDescription.trim()) {
      alert('请先填写故障现象与临床报修描述！');
      return;
    }

    if (!diagnosticData) {
      const result = await handleRunAiDiagnosis();
      if (result) {
        setIsConclusionPdfOpen(true);
      }
    } else {
      setIsConclusionPdfOpen(true);
    }
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleLaunchRepairModal = () => {
    if (onOpenRepairModalWithData && currentDevice) {
      const desc = diagnosticData?.standardizedDescription || faultDescription;
      const resol = diagnosticData?.suggestedResolution || '';
      onClose();
      onOpenRepairModalWithData(currentDevice, desc, resol);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 md:p-6">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-linear-to-r from-slate-900 via-slate-800 to-indigo-950 text-white flex items-center justify-between flex-none">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center border border-cyan-500/30">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base md:text-lg font-bold">AI 医疗设备故障智能诊断与统筹分析系统</h2>
                <span className="px-2 py-0.5 rounded-full text-2xs font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
                  型号特性 + 历史故障 + 年限统筹
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                结合设备规格型号、投用年限衰减、历史维修履历与浴盆曲线故障率进行全生命周期智能统筹诊断
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 3-Step Guided Workflow Banner */}
        <div className="bg-slate-100 border-b border-slate-200 px-6 py-2.5 flex items-center justify-between text-xs overflow-x-auto gap-4 flex-none">
          <div className="flex items-center gap-2 text-slate-700 font-bold">
            <span className="w-5 h-5 rounded-full bg-cyan-700 text-white flex items-center justify-center text-2xs shadow-xs">1</span>
            <span>确认目标设备与档案</span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <div className="flex items-center gap-2 text-cyan-900 font-bold bg-cyan-50 px-2.5 py-1 rounded-lg border border-cyan-200">
            <span className="w-5 h-5 rounded-full bg-cyan-600 text-white flex items-center justify-center text-2xs shadow-xs">2</span>
            <span>输入或点选故障代码/现象</span>
            <ArrowRight className="w-3.5 h-3.5 text-cyan-500" />
          </div>
          <div className="flex items-center gap-2 text-slate-600 font-bold">
            <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-2xs shadow-xs">3</span>
            <span>点击【执行 AI 智能统筹诊断】</span>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 md:p-6 space-y-4 text-sm">
          
          {/* Device & Fault Input Card */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded bg-slate-700 text-white text-2xs font-bold flex items-center justify-center">1</span>
                  选择台账已有设备
                </label>
                <select
                  value={selectedEquipmentId}
                  onChange={(e) => handleDeviceSelectChange(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-cyan-500 shadow-2xs"
                >
                  {equipmentList.map(e => (
                    <option key={e.id} value={e.id}>
                      {e.name} ({e.model}) [{e.sn}] - {e.department} ({e.status})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">使用科室</label>
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium"
                />
              </div>
            </div>

            {/* Equipment Context Badges */}
            {currentDevice && (
              <div className="flex flex-wrap items-center gap-2 p-2.5 bg-white rounded-lg border border-slate-200 text-2xs text-slate-600">
                <span className="flex items-center gap-1 font-semibold text-slate-700">
                  <Calendar className="w-3.5 h-3.5 text-cyan-600" />
                  投用日期: {currentDevice.enableDate || currentDevice.purchaseDate || '未填'}
                </span>
                <span className="text-slate-300">|</span>
                <span className="flex items-center gap-1 font-semibold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded">
                  <Clock className="w-3.5 h-3.5 text-indigo-600" />
                  在用年限: {currentDevice.serviceYears ? `${currentDevice.serviceYears} 年` : '计算中'}
                </span>
                <span className="text-slate-300">|</span>
                <span className="flex items-center gap-1 font-semibold text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded">
                  <History className="w-3.5 h-3.5 text-amber-600" />
                  历史维修履历: {currentDevice.repairRecords?.length || 0} 条
                </span>
                <span className="text-slate-300">|</span>
                <span className="flex items-center gap-1">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                  设备原值: ￥{currentDevice.purchasePrice?.toLocaleString() || '0'}
                </span>
                <span className="text-slate-300">|</span>
                <span>品牌厂商: {currentDevice.manufacturer || '原厂标配'}</span>
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded bg-cyan-700 text-white text-2xs font-bold flex items-center justify-center">2</span>
                  故障现象与临床报修描述 <span className="text-rose-500">*</span>
                </label>
                <span className="text-2xs text-slate-400">支持输入报错代码、声光报警表现或异常波形</span>
              </div>
              <textarea
                rows={2}
                value={faultDescription}
                onChange={(e) => setFaultDescription(e.target.value)}
                placeholder="例如：在使用过程中弹出报错窗口提示：发生意外情况（0x107F），系统遇到问题需要重新启动。使用人员重启后故障依旧。前期还报过0x1099/0x5222/0x5212等故障代码..."
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 font-medium leading-relaxed"
              />
            </div>

            {/* Quick Fault Code Shortcuts */}
            <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
              <span className="text-2xs font-bold text-slate-600 flex items-center gap-1">
                <Tag className="w-3 h-3 text-cyan-600" /> 快捷填入代码与现象:
              </span>
              <button
                type="button"
                onClick={() => setFaultDescription(prev => prev ? `${prev}，发生意外情况（0x107F），系统遇到问题需要重新启动。重启后故障依旧。` : '发生意外情况（0x107F），系统遇到问题需要重新启动。使用人员重启后故障依旧。')}
                className="px-2 py-0.5 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 rounded-full text-2xs transition font-bold cursor-pointer"
              >
                + 0x107F 报错 (重启依旧)
              </button>
              <button
                type="button"
                onClick={() => setFaultDescription(prev => prev ? `${prev}，前期还报过0x1099/0x5222/0x5212等故障代码。` : '前期还报过0x1099/0x5222/0x5212等故障代码。')}
                className="px-2 py-0.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-full text-2xs transition font-bold cursor-pointer"
              >
                + 曾报 0x1099/0x5222/0x5212
              </button>
              <button
                type="button"
                onClick={() => setFaultDescription(prev => prev ? `${prev}，开机黑屏，电源指示灯闪烁但无法启动。` : '开机黑屏，电源指示灯闪烁但无法启动。')}
                className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 rounded-full text-2xs transition font-medium cursor-pointer"
              >
                + 开机黑屏/不启动
              </button>
              <button
                type="button"
                onClick={() => setFaultDescription(prev => prev ? `${prev}，测量参数严重漂移，心电多导联杂波大。` : '测量参数严重漂移，心电多导联杂波大。')}
                className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 rounded-full text-2xs transition font-medium cursor-pointer"
              >
                + 导联干扰/参数漂移
              </button>
            </div>

            {/* STEP 3: Action Trigger Button */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-2 border-t border-slate-200">
              <div className="text-2xs text-slate-500 flex items-center gap-1">
                <span className="w-4 h-4 rounded bg-blue-600 text-white text-2xs font-bold flex items-center justify-center">3</span>
                <span>输入描述后，点击启动诊断或直接生成PDF结论书：</span>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  id="direct-generate-conclusion-pdf-btn"
                  disabled={loading}
                  onClick={handleOpenConclusionPdf}
                  className="w-full sm:w-auto px-4 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs md:text-sm font-bold transition flex items-center justify-center gap-1.5 shadow-2xs hover:shadow-xs cursor-pointer active:scale-95 disabled:opacity-50"
                  title="基于维修记录、运行环境数据和当前故障生成结构化研判结论书(PDF)"
                >
                  <FileText className="w-4 h-4 text-indigo-600" />
                  <span>生成研判结论书</span>
                </button>
                <button
                  disabled={loading}
                  onClick={handleRunAiDiagnosis}
                  className="w-full sm:w-auto px-5 py-2.5 bg-linear-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-700 hover:to-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs md:text-sm font-bold transition flex items-center justify-center gap-2 shadow-md hover:shadow-lg cursor-pointer"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-cyan-200" />
                      AI 正在统筹诊断...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-cyan-200" />
                      执行 AI 智能统筹诊断
                      <ArrowRight className="w-4 h-4 text-cyan-200" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Results section */}
          {diagnosticData && (
            <div className="space-y-3 animate-in fade-in duration-200">
              
              {/* Diagnosis Quick Summary Bar */}
              <div className="bg-linear-to-r from-cyan-900 via-blue-900 to-slate-900 text-white rounded-xl p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-sm">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-cyan-300">
                      {diagnosticData.equipmentName} ({diagnosticData.model})
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-2xs font-bold bg-rose-500/80 text-white">
                      {diagnosticData.symptomSummary.urgencyLevel}
                    </span>
                    {diagnosticData.lifecycleSynthesis && (
                      <span className="px-2 py-0.5 rounded-full text-2xs font-semibold bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                        {diagnosticData.lifecycleSynthesis.lifecyclePhase}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-300 mt-1">
                    受影响模块: <span className="text-cyan-200 font-semibold">{diagnosticData.symptomSummary.affectedModule}</span>
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    id="summary-bar-generate-conclusion-pdf-btn"
                    type="button"
                    onClick={handleOpenConclusionPdf}
                    className="px-3.5 py-1.5 bg-linear-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 text-white font-bold rounded-lg text-xs transition flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95"
                    title="基于该设备过往的维修记录、运行环境数据和当前故障，生成一份包含维修建议和风险评估的结构化PDF摘要"
                  >
                    <FileText className="w-3.5 h-3.5 text-indigo-100" />
                    <span>生成研判结论书</span>
                  </button>
                  <button
                    onClick={handleLaunchRepairModal}
                    className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg text-xs transition flex items-center gap-1 shadow-xs cursor-pointer"
                  >
                    <Wrench className="w-3.5 h-3.5" />
                    一键发起维保工单 (带入AI结论)
                  </button>
                </div>
              </div>

              {/* Multi-Tab Navigation */}
              <div className="border-b border-slate-200 flex items-center gap-2 overflow-x-auto pb-1 text-xs font-bold">
                <button
                  onClick={() => setActiveTab('lifecycle')}
                  className={`px-3 py-2 rounded-t-lg transition cursor-pointer flex items-center gap-1.5 border-b-2 ${
                    activeTab === 'lifecycle'
                      ? 'border-indigo-600 text-indigo-700 bg-indigo-50/70'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5" />
                  设备年限与历史故障统筹
                </button>

                <button
                  onClick={() => setActiveTab('root_causes')}
                  className={`px-3 py-2 rounded-t-lg transition cursor-pointer flex items-center gap-1.5 border-b-2 ${
                    activeTab === 'root_causes'
                      ? 'border-cyan-600 text-cyan-700 bg-cyan-50/60'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <TrendingUp className="w-3.5 h-3.5" />
                  Top 3 故障根因与机理
                </button>

                <button
                  onClick={() => setActiveTab('troubleshoot')}
                  className={`px-3 py-2 rounded-t-lg transition cursor-pointer flex items-center gap-1.5 border-b-2 ${
                    activeTab === 'troubleshoot'
                      ? 'border-emerald-600 text-emerald-700 bg-emerald-50/60'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Stethoscope className="w-3.5 h-3.5" />
                  临床现场 4 步应急自查
                </button>

                <button
                  onClick={() => setActiveTab('parts')}
                  className={`px-3 py-2 rounded-t-lg transition cursor-pointer flex items-center gap-1.5 border-b-2 ${
                    activeTab === 'parts'
                      ? 'border-blue-600 text-blue-700 bg-blue-50/60'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Cpu className="w-3.5 h-3.5" />
                  备品备件与排查指南
                </button>

                <button
                  onClick={() => setActiveTab('pm_plan')}
                  className={`px-3 py-2 rounded-t-lg transition cursor-pointer flex items-center gap-1.5 border-b-2 ${
                    activeTab === 'pm_plan'
                      ? 'border-amber-600 text-amber-700 bg-amber-50/60'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  PM 预防性维保规程
                </button>

                <button
                  onClick={() => setActiveTab('raw_text')}
                  className={`px-3 py-2 rounded-t-lg transition cursor-pointer flex items-center gap-1.5 border-b-2 ${
                    activeTab === 'raw_text'
                      ? 'border-slate-800 text-slate-900 bg-slate-100'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  完整专家诊断报告
                </button>
              </div>

              {/* Tab 0: Lifecycle & History Synthesis */}
              {activeTab === 'lifecycle' && diagnosticData.lifecycleSynthesis && (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* Lifecycle & Bathtub Curve */}
                    <div className="bg-white p-4 rounded-xl border border-indigo-200/80 shadow-2xs space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
                          <Clock className="w-4 h-4 text-indigo-600" />
                          在用年限与浴盆曲线老化阶段
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-2xs font-bold bg-indigo-100 text-indigo-800">
                          {diagnosticData.lifecycleSynthesis.lifecyclePhase}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="p-2 bg-slate-50 rounded-lg">
                          <span className="text-2xs text-slate-500 block">累计服役时间</span>
                          <span className="font-bold text-slate-800 text-sm font-mono">
                            {diagnosticData.lifecycleSynthesis.serviceYears} 年
                          </span>
                        </div>
                        <div className="p-2 bg-slate-50 rounded-lg">
                          <span className="text-2xs text-slate-500 block">浴盆曲线故障风险</span>
                          <span className="font-bold text-amber-700 text-sm">
                            {diagnosticData.lifecycleSynthesis.bathtubCurveRisk}
                          </span>
                        </div>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed bg-indigo-50/40 p-2.5 rounded-lg border border-indigo-100">
                        {diagnosticData.lifecycleSynthesis.modelSpecificNotes}
                      </p>
                    </div>

                    {/* Historical Fault Correlation */}
                    <div className="bg-white p-4 rounded-xl border border-amber-200/80 shadow-2xs space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                          <History className="w-4 h-4 text-amber-600" />
                          历史故障与复发性隐患关联
                        </span>
                        {diagnosticData.lifecycleSynthesis.repeatFaultWarning && (
                          <span className="px-2 py-0.5 rounded-full text-2xs font-bold bg-rose-100 text-rose-700 border border-rose-200">
                            复发性隐患预警
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-700 leading-relaxed">
                        {diagnosticData.lifecycleSynthesis.historicalFaultSummary}
                      </p>
                      {diagnosticData.lifecycleSynthesis.repeatFaultDetail && (
                        <div className="p-2.5 bg-amber-50/80 rounded-lg border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
                          <AlertOctagon className="w-4 h-4 text-amber-600 flex-none mt-0.5" />
                          <span>{diagnosticData.lifecycleSynthesis.repeatFaultDetail}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Economic Feasibility & Replacement Advice */}
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <DollarSign className="w-4 h-4 text-emerald-600" />
                        全生命周期经济性评估与处置建议
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-full text-2xs font-bold ${
                        diagnosticData.lifecycleSynthesis.economicFeasibility.includes('报废')
                          ? 'bg-rose-100 text-rose-800'
                          : diagnosticData.lifecycleSynthesis.economicFeasibility.includes('性价比')
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {diagnosticData.lifecycleSynthesis.economicFeasibility}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                      {diagnosticData.lifecycleSynthesis.economicAdvice}
                    </p>
                  </div>

                  {/* Past Repair Records Table */}
                  {currentDevice?.repairRecords && currentDevice.repairRecords.length > 0 && (
                    <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-2 shadow-2xs">
                      <div className="text-xs font-bold text-slate-700 flex items-center justify-between">
                        <span>📋 该设备历史维保台账（共 {currentDevice.repairRecords.length} 条记录）</span>
                        <span className="text-2xs text-slate-400">已同步纳入 AI 诊断上下文</span>
                      </div>
                      <div className="divide-y divide-slate-100 max-h-40 overflow-y-auto">
                        {currentDevice.repairRecords.map((rec, i) => (
                          <div key={i} className="py-1.5 text-2xs flex items-center justify-between">
                            <div>
                              <span className="font-bold text-slate-700 mr-2">{rec.faultDate}</span>
                              <span className="text-slate-600">{rec.faultDescription}</span>
                              {rec.partsReplaced && (
                                <span className="text-blue-600 ml-1.5">[更换: {rec.partsReplaced}]</span>
                              )}
                            </div>
                            <span className="font-mono text-slate-500 font-semibold">￥{rec.cost || 0}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Tab 1: Root Causes */}
              {activeTab === 'root_causes' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {diagnosticData.rootCauses.map((rc) => (
                      <div key={rc.rank} className="bg-white p-3.5 rounded-xl border border-cyan-200/80 shadow-2xs space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-cyan-100 text-cyan-800">
                            Top {rc.rank} 概率 ({rc.probability})
                          </span>
                          <span className="text-2xs font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                            {rc.category}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-slate-900 leading-snug">
                          {rc.cause}
                        </h4>
                        <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-2 rounded-lg border border-slate-100">
                          {rc.mechanism}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 flex items-start gap-2.5">
                    <ShieldAlert className="w-5 h-5 text-amber-600 flex-none mt-0.5" />
                    <div className="text-xs text-amber-900 leading-relaxed">
                      <span className="font-bold">安全规范与应急替代建议：</span>
                      {diagnosticData.safetyPrecautions.join('；')}
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: Clinical First Line */}
              {activeTab === 'troubleshoot' && (
                <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                      <Stethoscope className="w-4 h-4 text-emerald-600" />
                      临床报修人员现场 4 步应急自查清单
                    </h4>
                    <span className="text-2xs text-emerald-700">适用于现场护士/医生操作</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                    {diagnosticData.clinicalFirstLineSteps.map((step) => (
                      <div key={step.step} className="bg-white p-3 rounded-lg border border-emerald-200 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-800">
                            {step.step}. {step.title}
                          </span>
                          <span className="text-2xs font-semibold px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded">
                            {step.checkType}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed">
                          {step.action}
                        </p>
                        <p className="text-2xs text-emerald-700 font-medium pt-1 border-t border-slate-100">
                          ✓ 正常参考: {step.expectedNormalState}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tab 3: Parts & Engineer Steps */}
              {activeTab === 'parts' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3 shadow-2xs">
                    <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Wrench className="w-4 h-4 text-blue-600" />
                      医工工程师现场排查指南
                    </h4>
                    <div className="space-y-2">
                      {diagnosticData.engineerSteps.map((st, idx) => (
                        <div key={idx} className="text-xs p-2 bg-slate-50 rounded-lg border border-slate-100 text-slate-700 flex items-start gap-2">
                          <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-800 font-bold flex items-center justify-center text-2xs flex-none">
                            {idx + 1}
                          </span>
                          <span className="leading-relaxed">{st}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3 shadow-2xs">
                    <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Cpu className="w-4 h-4 text-amber-600" />
                      推荐备品备件与耗材
                    </h4>
                    <div className="space-y-2">
                      {diagnosticData.recommendedParts.map((part, idx) => (
                        <div key={idx} className="p-2.5 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-between text-xs">
                          <div>
                            <span className="font-bold text-slate-800">{part.name}</span>
                            {part.specification && (
                              <span className="block text-2xs text-slate-400">{part.specification}</span>
                            )}
                          </div>
                          <div className="text-right">
                            <span className="font-bold font-mono text-blue-700">￥{part.estCost}</span>
                            <span className="block text-2xs text-slate-500">[{part.necessity}]</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 4: PM Plan */}
              {activeTab === 'pm_plan' && currentDevice && (
                <div className="bg-white p-4 rounded-xl border border-amber-200 space-y-3 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Layers className="w-4 h-4 text-amber-600" />
                      该设备标准 PM 预防性维保检测要点与质控标准
                    </h4>
                    <span className="text-2xs text-amber-800 font-semibold bg-amber-100 px-2 py-0.5 rounded-full">
                      依据 GB 9706.1 与国家计量规程
                    </span>
                  </div>

                  <div className="divide-y divide-slate-100">
                    {generateLocalPmPlan(currentDevice).map((pm) => (
                      <div key={pm.itemNo} className="py-2.5 text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-800">
                            [{pm.category}] {pm.title}
                          </span>
                          <span className="text-2xs font-mono text-slate-500 font-medium">
                            周期: {pm.recommendedCycle}
                          </span>
                        </div>
                        <p className="text-2xs text-slate-600">
                          {pm.standardMethod}
                        </p>
                        <p className="text-2xs text-emerald-700 font-medium">
                          ✓ 验收指标: {pm.acceptanceCriteria}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tab 5: Raw Text */}
              {activeTab === 'raw_text' && (
                <div className="bg-slate-900 text-slate-100 p-4 rounded-xl font-sans text-xs leading-relaxed space-y-3 max-h-72 overflow-y-auto">
                  <div className="flex justify-end">
                    <button
                      onClick={() => copyToClipboard(analysisText, 'full_report')}
                      className="px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded text-2xs text-cyan-300 flex items-center gap-1 cursor-pointer"
                    >
                      {copiedKey === 'full_report' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      {copiedKey === 'full_report' ? '已复制' : '复制全文'}
                    </button>
                  </div>
                  <pre className="whitespace-pre-wrap font-sans text-xs leading-relaxed">
                    {analysisText}
                  </pre>
                </div>
              )}

            </div>
          )}

          {!diagnosticData && !loading && !errorMsg && (
            <div className="p-8 text-center text-slate-400 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
              <Bot className="w-10 h-10 mx-auto text-slate-300 mb-2" />
              <p className="text-sm font-semibold text-slate-700">点击“执行 AI 医疗设备智能统筹诊断”开启专家分析</p>
              <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                系统将实时结合所选设备型号、投用年限、历史故障及维修履历，进行全生命周期故障树推导、4 步临床自查、备品备件清单及 PM 预防性维护建议。
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-2 flex-none">
          <div className="text-2xs text-slate-400">
            医学装备全生命周期 AI 质控与辅助诊断系统 v3.7
          </div>
          <div className="flex items-center gap-2">
            {currentDevice && (
              <button
                type="button"
                id="footer-generate-conclusion-pdf-btn"
                onClick={handleOpenConclusionPdf}
                disabled={loading}
                className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
                title="基于该设备过往维修记录、运行环境数据与当前故障，生成结构化PDF研判结论书"
              >
                <FileText className="w-3.5 h-3.5 text-indigo-200" />
                <span>生成研判结论书 (PDF)</span>
              </button>
            )}
            {onOpenStatusChange && currentDevice && currentDevice.status === '故障待修' && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenStatusChange(currentDevice);
                }}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                title="已参考AI排查指引完成处理，点击修复故障并恢复正常运行"
              >
                <CheckCircle className="w-3.5 h-3.5" />
                <span>现场排除故障 · 恢复正常运行</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-1.5 bg-slate-700 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition cursor-pointer"
            >
              关闭视窗
            </button>
          </div>
        </div>
      </div>

      {/* Structured Conclusion Report PDF Preview Modal */}
      {currentDevice && isConclusionPdfOpen && (
        <AiDiagnosticConclusionPdfModal
          isOpen={isConclusionPdfOpen}
          onClose={() => setIsConclusionPdfOpen(false)}
          equipment={currentDevice}
          faultDescription={faultDescription}
          diagnosticData={diagnosticData}
        />
      )}
    </div>
  );
};


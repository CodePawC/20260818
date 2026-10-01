import React, { useState, useEffect, useMemo } from 'react';
import { MedicalEquipment, EquipmentStatus, AuthUser } from '../types';
import { 
  X, 
  Wrench, 
  CheckCircle2, 
  Sparkles, 
  Stethoscope, 
  AlertTriangle, 
  CheckSquare, 
  Square, 
  Cpu, 
  FileText, 
  Layers, 
  Zap, 
  ShieldAlert, 
  ArrowRight, 
  RotateCcw, 
  Plus, 
  Copy, 
  Check, 
  Activity, 
  HelpCircle,
  TrendingUp,
  Tag,
  Calendar,
  History,
  DollarSign,
  AlertOctagon,
  Clock,
  FileCheck
} from 'lucide-react';
import { 
  AiStructuredDiagnosticResult, 
  AiTroubleshootingStep, 
  generateLocalRuleBasedDiagnosis, 
  generateLocalPmPlan,
  generateAiEngineerTechnicalAssessment,
  AiPmPlanItem 
} from '../utils/aiBiomedicalEngine';
import { isClinicalStaff, isHeadNurse } from '../utils/authUtils';
import { ApprovalApplication } from '../types/approvalTypes';
import { SmartEquipmentPicker } from './SmartEquipmentPicker';

interface AddRepairModalProps {
  isOpen: boolean;
  equipmentList: MedicalEquipment[];
  preSelectedDevice?: MedicalEquipment | null;
  currentUser?: AuthUser | null;
  onClose: () => void;
  onSubmitRepair: (repairData: any) => void;
  onNavigateToApprovals?: (data: Partial<ApprovalApplication>) => void;
}

export const AddRepairModal: React.FC<AddRepairModalProps> = ({
  isOpen,
  equipmentList,
  preSelectedDevice,
  currentUser,
  onClose,
  onSubmitRepair,
  onNavigateToApprovals,
}) => {
  const isClinicalUser = isClinicalStaff(currentUser) || isHeadNurse(currentUser);
  const [activePerspective, setActivePerspective] = useState<'clinical' | 'engineer'>(
    isClinicalUser ? 'clinical' : 'engineer'
  );

  const [selectedEquipmentId, setSelectedEquipmentId] = useState<string>('');
  const [faultDate, setFaultDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [repairType, setRepairType] = useState<'紧急故障维修' | '定期预防性保养' | '计量校准' | '巡检维护' | '全院零星维保框架批次'>('紧急故障维修');
  const [faultDescription, setFaultDescription] = useState<string>('');
  const [technician, setTechnician] = useState<string>(
    currentUser?.name ? `${currentUser.name} (${currentUser.role || '登记人'})` : '崔工（医学装备科）'
  );
  const [cost, setCost] = useState<number>(0);
  const [partsReplaced, setPartsReplaced] = useState<string>('');
  const [resolution, setResolution] = useState<string>('已现场勘查并报备，排查修复中...');
  const [repairStatus, setRepairStatus] = useState<'处理中' | '已完成' | '待配件'>('处理中');
  const [updateEquipmentStatus, setUpdateEquipmentStatus] = useState<boolean>(true);
  const [newEquipmentStatus, setNewEquipmentStatus] = useState<EquipmentStatus>('故障待修');

  // AI Assistant States
  const [isAiRewriting, setIsAiRewriting] = useState<boolean>(false);
  const [aiRewrittenResult, setAiRewrittenResult] = useState<{
    standardizedDescription: string;
    urgencyLevel: string;
    affectedModule: string;
    alarmCodes: string[];
    clinicalImpact: string;
  } | null>(null);

  const [isAiTroubleshooting, setIsAiTroubleshooting] = useState<boolean>(false);
  const [troubleshootSteps, setTroubleshootSteps] = useState<AiTroubleshootingStep[]>([]);
  const [completedSteps, setCompletedSteps] = useState<Record<number, boolean>>({});
  const [showTroubleshootPanel, setShowTroubleshootPanel] = useState<boolean>(false);
  const [troubleshootResolved, setTroubleshootResolved] = useState<boolean>(false);

  const [isAiDiagnosing, setIsAiDiagnosing] = useState<boolean>(false);
  const [diagnosticResult, setDiagnosticResult] = useState<AiStructuredDiagnosticResult | null>(null);
  const [showDiagnosticPanel, setShowDiagnosticPanel] = useState<boolean>(false);

  const [copiedNotification, setCopiedNotification] = useState<string | null>(null);

  // Selected Equipment Object
  const currentEquipment = useMemo(() => {
    return equipmentList.find(e => e.id === selectedEquipmentId) || preSelectedDevice || equipmentList[0] || null;
  }, [selectedEquipmentId, preSelectedDevice, equipmentList]);

  // Common quick fault tag suggestions based on category
  const quickFaultTags = useMemo(() => {
    const name = currentEquipment?.name || '';
    if (/监护|ecg|心电|spo2|血氧|血压/i.test(name)) {
      return ['导联脱落/杂波大', '血氧无波形/测不出', 'NIBP袖带漏气/充气超时', '报警声无法消除', '屏幕触控失灵', '电池虚电开机自熄'];
    }
    if (/呼吸|麻醉|ventilat/i.test(name)) {
      return ['气道高压报警', '低潮气量报警', '空氧混合比失真', '呼气阀漏气', '集水杯积水过多', 'Pre-use自检不通过'];
    }
    if (/除颤|defibrill/i.test(name)) {
      return ['充电超时/无法除颤', '手柄接触不良报警', '每日能量自检未通过', '心电波形干扰', '电池欠压报警'];
    }
    if (/输液|注射泵/i.test(name)) {
      return ['频繁误报管路气泡', '下端压力阻塞报警', '滴速明显失准', '推注滑块卡死异响', '按键无响应'];
    }
    if (/超声|彩超|探头/i.test(name)) {
      return ['探头图像伪影/暗道', '探头声头过热', '无法切换探头通道', '死机蓝屏', '报错代码 0x107F/总线异常', '脚踏开关失灵'];
    }
    return ['使用中报错: 故障代码 0x107F', '开机无反应/黑屏', '机身异响/震动大', '总线通信超时报错', '接口松动/虚接', '测量参数严重漂移', '机身漏电/保护跳闸'];
  }, [currentEquipment]);

  useEffect(() => {
    if (preSelectedDevice) {
      setSelectedEquipmentId(preSelectedDevice.id);
    } else if (equipmentList.length > 0 && !selectedEquipmentId) {
      setSelectedEquipmentId(equipmentList[0].id);
    }
  }, [preSelectedDevice, equipmentList, isOpen]);

  useEffect(() => {
    if (repairStatus === '处理中' || repairStatus === '待配件') {
      setNewEquipmentStatus('故障待修');
    } else if (repairStatus === '已完成') {
      setNewEquipmentStatus('正常运行');
    }
  }, [repairStatus]);

  // If repair type changes to PM / Inspection, auto suggest PM resolution template
  useEffect(() => {
    if (repairType === '定期预防性保养' || repairType === '巡检维护') {
      if (resolution === '已现场勘查并报备，排查修复中...' || !resolution) {
        setResolution('已按季度/月度医疗设备预防性维护(PM)规程完成机身除尘、电气安全检测(GB9706.1)、核心参数模拟器定标与备用电池充放电校验，各项检测数据均符合出厂标准。');
      }
    }
  }, [repairType]);

  if (!isOpen) return null;

  // 1. AI 规范化描述 (AI Fault Rewriter)
  const handleAiRewrite = async () => {
    if (!faultDescription.trim()) {
      alert('请先输入简要的口语化故障现象或点击下方快捷标签，再由 AI 进行规范化重写！');
      return;
    }

    setIsAiRewriting(true);
    try {
      const res = await fetch('/api/ai-fault-rewriter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          equipmentName: currentEquipment?.name || '医疗设备',
          model: currentEquipment?.model || '',
          department: currentEquipment?.department || '',
          category: currentEquipment?.category || '急救监护类',
          manufacturer: currentEquipment?.manufacturer || '',
          enableDate: currentEquipment?.enableDate,
          manufactureDate: currentEquipment?.manufactureDate,
          purchaseDate: currentEquipment?.purchaseDate,
          purchasePrice: currentEquipment?.purchasePrice,
          serviceYears: currentEquipment?.serviceYears,
          repairRecords: currentEquipment?.repairRecords,
          equipment: currentEquipment,
          rawDescription: faultDescription,
        })
      });
      const data = await res.json();
      if (data.success && data.standardizedDescription) {
        setAiRewrittenResult({
          standardizedDescription: data.standardizedDescription,
          urgencyLevel: data.urgencyLevel || '高(影响临床运行)',
          affectedModule: data.affectedModule || '核心传感/控制回路',
          alarmCodes: data.alarmCodes || [],
          clinicalImpact: data.clinicalImpact || '需及时排查以保障临床医疗安全'
        });
      } else {
        // Fallback locally
        const local = generateLocalRuleBasedDiagnosis(
          currentEquipment?.name || '医疗设备',
          currentEquipment?.model || '',
          currentEquipment?.department || '',
          faultDescription,
          currentEquipment || undefined
        );
        setAiRewrittenResult({
          standardizedDescription: local.standardizedDescription,
          urgencyLevel: local.symptomSummary.urgencyLevel,
          affectedModule: local.symptomSummary.affectedModule,
          alarmCodes: local.symptomSummary.alarmCodes || [],
          clinicalImpact: local.symptomSummary.clinicalImpact
        });
      }
    } catch (e) {
      console.warn('AI Rewrite request failed, using local engine:', e);
      const local = generateLocalRuleBasedDiagnosis(
        currentEquipment?.name || '医疗设备',
        currentEquipment?.model || '',
        currentEquipment?.department || '',
        faultDescription,
        currentEquipment || undefined
      );
      setAiRewrittenResult({
        standardizedDescription: local.standardizedDescription,
        urgencyLevel: local.symptomSummary.urgencyLevel,
        affectedModule: local.symptomSummary.affectedModule,
        alarmCodes: local.symptomSummary.alarmCodes || [],
        clinicalImpact: local.symptomSummary.clinicalImpact
      });
    } finally {
      setIsAiRewriting(false);
    }
  };

  const applyRewrittenDescription = () => {
    if (aiRewrittenResult) {
      setFaultDescription(aiRewrittenResult.standardizedDescription);
      setAiRewrittenResult(null);
    }
  };

  // 2. 临床现场应急自查 (Clinical First-Line Troubleshooting)
  const handleTriggerTroubleshoot = async () => {
    setIsAiTroubleshooting(true);
    setShowTroubleshootPanel(true);
    setCompletedSteps({});
    setTroubleshootResolved(false);

    try {
      const res = await fetch('/api/ai-clinical-troubleshoot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          equipmentName: currentEquipment?.name || '医疗设备',
          model: currentEquipment?.model || '',
          department: currentEquipment?.department || '',
          faultDescription: faultDescription || '设备异常报警，无法正常使用',
          enableDate: currentEquipment?.enableDate,
          purchaseDate: currentEquipment?.purchaseDate,
          serviceYears: currentEquipment?.serviceYears,
          repairRecords: currentEquipment?.repairRecords,
          equipment: currentEquipment
        })
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.steps) && data.steps.length > 0) {
        setTroubleshootSteps(data.steps);
      } else {
        const local = generateLocalRuleBasedDiagnosis(
          currentEquipment?.name || '医疗设备',
          currentEquipment?.model || '',
          currentEquipment?.department || '',
          faultDescription,
          currentEquipment || undefined
        );
        setTroubleshootSteps(local.clinicalFirstLineSteps);
      }
    } catch (e) {
      const local = generateLocalRuleBasedDiagnosis(
        currentEquipment?.name || '医疗设备',
        currentEquipment?.model || '',
        currentEquipment?.department || '',
        faultDescription,
        currentEquipment || undefined
      );
      setTroubleshootSteps(local.clinicalFirstLineSteps);
    } finally {
      setIsAiTroubleshooting(false);
    }
  };

  const toggleStep = (stepNum: number) => {
    setCompletedSteps(prev => ({
      ...prev,
      [stepNum]: !prev[stepNum]
    }));
  };

  // 临床自查成功排除故障 -> 自动转化为已完成闭环记录
  const handleClinicalSelfResolved = () => {
    setTroubleshootResolved(true);
    setRepairStatus('已完成');
    setNewEquipmentStatus('正常运行');
    setUpdateEquipmentStatus(true);
    setCost(0);
    setPartsReplaced('无（临床自查排除假故障）');
    setResolution(`【临床现场自查排除】报修人员经 AI 临床自查清单逐项核对：${
      troubleshootSteps.map(s => s.title).join('、')
    }，确认已恢复正常工作状态，设备自检通过，无需工程师现场拆机。`);
  };

  // 将自查记录附带到故障描述中
  const handleAppendTroubleshootNotes = () => {
    const attemptedTitles = troubleshootSteps
      .filter(s => completedSteps[s.step])
      .map(s => s.title);
    
    const note = `\n【临床已尝试自查】：已核对 ${attemptedTitles.length > 0 ? attemptedTitles.join('、') : '接口与电源'}，仍未排除故障，请求工程师携带专业工具现场支援。`;
    setFaultDescription(prev => prev + note);
    setShowTroubleshootPanel(false);
  };

  // 3. 医工工程师 AI 辅助诊断 (Engineer Diagnostic Advisor)
  const handleTriggerEngineerDiagnose = async () => {
    if (!faultDescription.trim()) {
      alert('请先填写故障描述，以便 AI 结合设备型号、年限与历史故障进行深度分析与备件推导！');
      return;
    }

    setIsAiDiagnosing(true);
    setShowDiagnosticPanel(true);

    try {
      const res = await fetch('/api/ai-diagnose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          equipmentName: currentEquipment?.name || '医疗设备',
          model: currentEquipment?.model || '',
          department: currentEquipment?.department || '',
          faultDescription: faultDescription,
          category: currentEquipment?.category,
          manufacturer: currentEquipment?.manufacturer,
          enableDate: currentEquipment?.enableDate,
          manufactureDate: currentEquipment?.manufactureDate,
          purchasePrice: currentEquipment?.purchasePrice,
          purchaseDate: currentEquipment?.purchaseDate,
          serviceYears: currentEquipment?.serviceYears,
          repairRecords: currentEquipment?.repairRecords,
          lastMaintenanceDate: currentEquipment?.lastMaintenanceDate,
          lastCalibrationDate: currentEquipment?.lastCalibrationDate,
          equipment: currentEquipment
        })
      });
      const data = await res.json();
      if (data.success && data.data) {
        setDiagnosticResult(data.data);
      } else {
        const local = generateLocalRuleBasedDiagnosis(
          currentEquipment?.name || '医疗设备',
          currentEquipment?.model || '',
          currentEquipment?.department || '',
          faultDescription,
          currentEquipment || undefined
        );
        setDiagnosticResult(local);
      }
    } catch (e) {
      const local = generateLocalRuleBasedDiagnosis(
        currentEquipment?.name || '医疗设备',
        currentEquipment?.model || '',
        currentEquipment?.department || '',
        faultDescription,
        currentEquipment || undefined
      );
      setDiagnosticResult(local);
    } finally {
      setIsAiDiagnosing(false);
    }
  };

  // 4. 一键生成 PM 保养规程
  const handleGeneratePmPlan = () => {
    if (!currentEquipment) return;
    const planItems = generateLocalPmPlan(currentEquipment);
    const pmContent = `【AI 标准化 PM 预防性维保规程】：\n` +
      planItems.map(p => `• [${p.category}] ${p.title}：${p.standardMethod}（验收指标：${p.acceptanceCriteria}）`).join('\n') +
      `\n\n【维护结论】：各项电气安全及模拟器定标数据均在合格限值内，准予继续在临床投入使用。`;
    setResolution(pmContent);
  };

  // 4.2 一键生成工程师技术鉴定与方案
  const handleGenerateTechnicalAssessment = () => {
    if (!currentEquipment) return;
    const assessment = generateAiEngineerTechnicalAssessment(
      currentEquipment,
      faultDescription,
      partsReplaced,
      Number(cost)
    );
    setResolution(assessment);
  };

  // Click tag to append
  const handleAddTag = (tag: string) => {
    setFaultDescription(prev => {
      if (!prev.trim()) return tag;
      if (prev.includes(tag)) return prev;
      return `${prev}，${tag}`;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEquipmentId) {
      alert('请选择报修设备！');
      return;
    }
    if (!faultDescription.trim()) {
      alert('请填写故障现象描述！');
      return;
    }

    onSubmitRepair({
      equipmentId: selectedEquipmentId,
      faultDate,
      repairType,
      faultDescription,
      technician,
      cost: Number(cost),
      partsReplaced,
      resolution,
      status: repairStatus,
      updateEquipmentStatus,
      newEquipmentStatus
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 md:p-6">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-linear-to-r from-amber-500 via-amber-600 to-orange-600 text-white flex items-center justify-between flex-none shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/15 rounded-xl backdrop-blur-xs">
              <Wrench className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base md:text-lg font-bold tracking-tight">登记设备维修与保养工单</h2>
                <span className="px-2 py-0.5 rounded-full text-2xs font-bold bg-white/20 text-white backdrop-blur-xs border border-white/30 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-200" />
                  Gemini 3.7 AI 赋能
                </span>
              </div>
              <p className="text-xs text-amber-100/90 mt-0.5">
                支持临床报修规范书写、现场 4 步应急排查与医工工程师智能故障树分析
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Perspective Switcher */}
            <div className="bg-black/20 p-0.5 rounded-lg flex items-center text-xs">
              <button
                type="button"
                onClick={() => setActivePerspective('clinical')}
                className={`px-2.5 py-1 rounded-md font-semibold transition cursor-pointer flex items-center gap-1 ${
                  activePerspective === 'clinical'
                    ? 'bg-white text-amber-800 shadow-xs'
                    : 'text-amber-100 hover:text-white'
                }`}
              >
                <Stethoscope className="w-3.5 h-3.5" />
                临床报修视角
              </button>
              <button
                type="button"
                onClick={() => setActivePerspective('engineer')}
                className={`px-2.5 py-1 rounded-md font-semibold transition cursor-pointer flex items-center gap-1 ${
                  activePerspective === 'engineer'
                    ? 'bg-white text-amber-800 shadow-xs'
                    : 'text-amber-100 hover:text-white'
                }`}
              >
                <Cpu className="w-3.5 h-3.5" />
                医工维保视角
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-amber-100 hover:text-white hover:bg-white/20 rounded-lg transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 3-Step Guided Workflow Banner */}
        <div className="bg-amber-50/80 border-b border-amber-200 px-6 py-2.5 flex items-center justify-between text-xs overflow-x-auto gap-4 flex-none">
          <div className="flex items-center gap-2 text-amber-950 font-bold">
            <span className="w-5 h-5 rounded-full bg-amber-600 text-white flex items-center justify-center text-2xs shadow-xs">1</span>
            <span>选择设备与工单性质</span>
            <ArrowRight className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="flex items-center gap-2 text-amber-900 font-bold bg-amber-200/60 px-2.5 py-1 rounded-lg border border-amber-300">
            <span className="w-5 h-5 rounded-full bg-amber-700 text-white flex items-center justify-center text-2xs shadow-xs">2</span>
            <span>输入故障表现 ➔ 点选对应 AI 辅助按钮</span>
            <ArrowRight className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <div className="flex items-center gap-2 text-slate-500 font-medium">
            <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-2xs">3</span>
            <span>确认处置方案并提交建档</span>
          </div>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 md:p-6 space-y-5 text-sm">
          
          {/* STEP 1: Equipment Selection Card (Smart Equipment Picker with 1000+ support) */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
            <SmartEquipmentPicker
              equipmentList={equipmentList}
              selectedEquipmentId={selectedEquipmentId}
              currentUser={currentUser || undefined}
              onSelectEquipment={(id) => {
                setSelectedEquipmentId(id);
                setAiRewrittenResult(null);
                setDiagnosticResult(null);
                setShowTroubleshootPanel(false);
              }}
              label="报修/维保目标设备信息"
              placeholder="快速搜索 1,000+ 台设备：输入型号 / SN / 资产号 / 科室 / 拼音(如 hxj, icu)..."
            />
          </div>

          {/* 2. Order Meta (Type, Date, Technician) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            <div>
              <label className="block font-semibold text-slate-700 mb-1 text-xs">
                工单性质与类型
              </label>
              <select
                value={repairType}
                onChange={(e) => setRepairType(e.target.value as any)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium text-xs md:text-sm"
              >
                <option value="紧急故障维修">🔴 紧急故障维修</option>
                <option value="定期预防性保养">🟢 定期预防性保养 (PM)</option>
                <option value="计量校准">🔵 计量检定/校准</option>
                <option value="巡检维护">🟡 临床巡检维护</option>
                <option value="全院零星维保框架批次">⚡ 全院零星维保框架批次 (零修工单)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1 text-xs">
                报修/发生日期
              </label>
              <input
                type="date"
                value={faultDate}
                onChange={(e) => setFaultDate(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium text-xs md:text-sm"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1 text-xs">
                经手人员 / 责任工程师
              </label>
              <input
                type="text"
                value={technician}
                onChange={(e) => setTechnician(e.target.value)}
                placeholder="例：崔工（医工科）"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium text-xs md:text-sm"
              />
            </div>
          </div>

          {/* STEP 2: FAULT PHENOMENON & AI WRITING ASSISTANT SECTION */}
          <div className="border-2 border-amber-300 rounded-xl p-4 bg-amber-50/40 space-y-3.5 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 rounded bg-amber-600 text-white text-2xs font-bold flex items-center justify-center">2</span>
                <label className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                  故障现象与临床反馈描述 <span className="text-rose-500">*</span>
                </label>
              </div>
              <span className="text-2xs text-amber-900 font-medium bg-amber-100 px-2 py-0.5 rounded-full border border-amber-200">
                👇 输入现象后，点击下方对应角色的 AI 辅助按钮
              </span>
            </div>

            {/* Textarea */}
            <div className="relative">
              <textarea
                required
                rows={3}
                value={faultDescription}
                onChange={(e) => setFaultDescription(e.target.value)}
                placeholder="例如：在使用过程中弹出报错窗口提示：发生意外情况（0x107F），系统遇到问题需要重新启动。使用人员重启后故障依旧。前期还报过0x1099/0x5222/0x5212等故障代码..."
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium text-slate-800 text-xs md:text-sm placeholder:text-slate-400 leading-relaxed shadow-2xs"
              />
            </div>

            {/* Quick Fault Tags & Code Shortcuts */}
            <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
              <span className="text-2xs font-bold text-slate-600 flex items-center gap-1">
                <Tag className="w-3 h-3 text-amber-600" /> 常用代码与现象快捷填入:
              </span>
              <button
                type="button"
                onClick={() => handleAddTag('报错代码 0x107F（重启依旧）')}
                className="px-2 py-0.5 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 rounded-full text-2xs transition font-bold cursor-pointer"
              >
                + 0x107F 报错 (重启依旧)
              </button>
              <button
                type="button"
                onClick={() => handleAddTag('前期曾报代码 0x1099/0x5222/0x5212')}
                className="px-2 py-0.5 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 rounded-full text-2xs transition font-bold cursor-pointer"
              >
                + 曾报 0x1099/0x5222/0x5212
              </button>
              {quickFaultTags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => handleAddTag(tag)}
                  className="px-2 py-0.5 bg-white hover:bg-amber-100 text-slate-700 hover:text-amber-900 border border-slate-200 hover:border-amber-300 rounded-full text-2xs transition font-medium cursor-pointer"
                >
                  + {tag}
                </button>
              ))}
            </div>

            {/* DUAL-ROLE AI ACTION CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1 border-t border-amber-200/80">
              
              {/* Card A: Clinical Staff (Doctors/Nurses) */}
              <div className="bg-white p-3 rounded-xl border border-emerald-200 shadow-2xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                    <Stethoscope className="w-4 h-4 text-emerald-600" />
                    🏥 临床医护人员快速通道
                  </span>
                  <span className="text-2xs font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                    临床报修专用
                  </span>
                </div>
                <p className="text-2xs text-slate-500">
                  输入口语化描述后，点击将描述转为三甲规范工单，或自查现场插头与环境排除假故障：
                </p>
                <div className="grid grid-cols-2 gap-2 pt-0.5">
                  <button
                    type="button"
                    onClick={handleAiRewrite}
                    disabled={isAiRewriting}
                    className="px-2.5 py-2 bg-linear-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white rounded-lg text-xs font-bold transition flex flex-col items-center justify-center gap-0.5 shadow-2xs cursor-pointer disabled:opacity-50"
                  >
                    <span className="flex items-center gap-1">
                      <Sparkles className={`w-3.5 h-3.5 ${isAiRewriting ? 'animate-spin' : 'text-amber-200'}`} />
                      {isAiRewriting ? '正在规范化...' : 'AI 规范工单描述'}
                    </span>
                    <span className="text-3xs text-amber-100 font-normal">一键转为标准医工病历</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleTriggerTroubleshoot}
                    disabled={isAiTroubleshooting}
                    className="px-2.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg text-xs font-bold transition flex flex-col items-center justify-center gap-0.5 cursor-pointer disabled:opacity-50"
                  >
                    <span className="flex items-center gap-1">
                      <CheckSquare className="w-3.5 h-3.5 text-emerald-600" />
                      {isAiTroubleshooting ? '生成自查清单...' : '现场 4 步应急自查'}
                    </span>
                    <span className="text-3xs text-emerald-600 font-normal">快速排除假故障/松动</span>
                  </button>
                </div>
              </div>

              {/* Card B: Biomedical Engineers */}
              <div className="bg-white p-3 rounded-xl border border-blue-200 shadow-2xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-blue-950 flex items-center gap-1.5">
                    <Cpu className="w-4 h-4 text-blue-600" />
                    🛠️ 医学工程技术决策区
                  </span>
                  <span className="text-2xs font-semibold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                    工程师/质控专用
                  </span>
                </div>
                <p className="text-2xs text-slate-500">
                  结合在役年限、浴盆曲线与历史故障代码，推导故障树根因、备件推荐与 PM 规程：
                </p>
                <div className="grid grid-cols-2 gap-2 pt-0.5">
                  <button
                    type="button"
                    onClick={handleTriggerEngineerDiagnose}
                    disabled={isAiDiagnosing}
                    className="px-2.5 py-2 bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg text-xs font-bold transition flex flex-col items-center justify-center gap-0.5 shadow-2xs cursor-pointer disabled:opacity-50"
                  >
                    <span className="flex items-center gap-1">
                      <TrendingUp className="w-3.5 h-3.5 text-blue-200" />
                      {isAiDiagnosing ? '深度统筹分析中...' : 'AI 医工深度诊断'}
                    </span>
                    <span className="text-3xs text-blue-100 font-normal">故障树推导与备件清单</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleGeneratePmPlan}
                    className="px-2.5 py-2 bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-300 rounded-lg text-xs font-bold transition flex flex-col items-center justify-center gap-0.5 cursor-pointer"
                  >
                    <span className="flex items-center gap-1">
                      <Layers className="w-3.5 h-3.5 text-amber-600" />
                      生成 PM 维保规程
                    </span>
                    <span className="text-3xs text-slate-500 font-normal">按 GB 9706 质控定标</span>
                  </button>
                </div>
              </div>

            </div>

            {/* AI Rewritten Result Preview Card */}
            {aiRewrittenResult && (
              <div className="bg-linear-to-br from-amber-50 to-orange-50/50 border border-amber-300 rounded-xl p-3.5 space-y-2.5 animate-in fade-in duration-150">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="p-1 bg-amber-600 text-white rounded-md">
                      <Sparkles className="w-3.5 h-3.5" />
                    </span>
                    <span className="text-xs font-bold text-amber-900">
                      AI 规范化重写建议 (标准医工工单格式)
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-2xs font-bold bg-amber-200 text-amber-900">
                      {aiRewrittenResult.urgencyLevel}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setAiRewrittenResult(null)}
                      className="text-xs text-slate-500 hover:text-slate-700"
                    >
                      忽略
                    </button>
                    <button
                      type="button"
                      onClick={applyRewrittenDescription}
                      className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 shadow-2xs cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                      采纳规范描述
                    </button>
                  </div>
                </div>

                <div className="bg-white/80 rounded-lg p-2.5 border border-amber-200/80 text-xs text-slate-800 leading-relaxed font-medium">
                  {aiRewrittenResult.standardizedDescription}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-2xs text-slate-600">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-slate-700">受影响模块:</span>
                    <span className="text-amber-800 bg-amber-100/70 px-1.5 py-0.5 rounded">
                      {aiRewrittenResult.affectedModule}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-slate-700">临床影响:</span>
                    <span className="text-slate-700 truncate">
                      {aiRewrittenResult.clinicalImpact}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 4. CLINICAL TROUBLESHOOTING CHECKLIST (Interactive First-Line Guide) */}
          {showTroubleshootPanel && (
            <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-4 space-y-3 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-emerald-600 text-white rounded-lg">
                    <Stethoscope className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs md:text-sm font-bold text-emerald-950 flex items-center gap-1.5">
                      临床报修人员现场自查清单 (First-Line Check)
                      <span className="text-2xs font-normal text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                        先排查假故障，节约派工时间
                      </span>
                    </h4>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowTroubleshootPanel(false)}
                  className="text-xs text-emerald-700 hover:text-emerald-900"
                >
                  收起
                </button>
              </div>

              {/* Checklist Items */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-1">
                {troubleshootSteps.map((step) => {
                  const isDone = !!completedSteps[step.step];
                  return (
                    <div
                      key={step.step}
                      onClick={() => toggleStep(step.step)}
                      className={`p-2.5 rounded-lg border transition cursor-pointer flex items-start gap-2.5 ${
                        isDone
                          ? 'bg-emerald-100/70 border-emerald-300 text-emerald-900'
                          : 'bg-white border-emerald-200/80 text-slate-700 hover:bg-emerald-50/50'
                      }`}
                    >
                      <button
                        type="button"
                        className="mt-0.5 text-emerald-600 flex-none"
                      >
                        {isDone ? <CheckSquare className="w-4 h-4 text-emerald-600" /> : <Square className="w-4 h-4 text-slate-400" />}
                      </button>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold flex items-center justify-between">
                          <span>{step.step}. {step.title}</span>
                          <span className="text-2xs font-normal px-1.5 py-0.2 bg-emerald-200/60 rounded text-emerald-800">
                            {step.checkType}
                          </span>
                        </div>
                        <p className="text-2xs text-slate-600 mt-1 leading-relaxed">
                          {step.action}
                        </p>
                        <p className="text-2xs text-emerald-700 mt-0.5 font-medium">
                          ✓ 正常参考: {step.expectedNormalState}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Resolution options */}
              <div className="pt-2 border-t border-emerald-200/60 flex flex-wrap items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={handleClinicalSelfResolved}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  🎉 临床自查已排除故障（转为自查闭环记录，无需派工）
                </button>

                <button
                  type="button"
                  onClick={handleAppendTroubleshootNotes}
                  className="px-3 py-1.5 bg-white hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  附带已自查记录继续提交工程师
                </button>
              </div>
            </div>
          )}

          {/* 5. ENGINEER DIAGNOSTIC & SPARE PARTS ADVISOR PANEL */}
          {showDiagnosticPanel && diagnosticResult && (
            <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-4 space-y-3.5 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-blue-600 text-white rounded-lg">
                    <Cpu className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs md:text-sm font-bold text-blue-950 flex items-center gap-1.5">
                      医工工程师 AI 辅助诊断与备件方案
                      <span className="text-2xs font-normal text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">
                        失效物理分析与备件推演
                      </span>
                    </h4>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowDiagnosticPanel(false)}
                  className="text-xs text-blue-700 hover:text-blue-900"
                >
                  收起
                </button>
              </div>

              {/* Lifecycle & History Synthesis Banner */}
              {diagnosticResult.lifecycleSynthesis && (
                <div className="bg-white p-3 rounded-lg border border-indigo-200 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-indigo-950">
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-indigo-600" />
                      设备全生命周期与历史故障统筹分析
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-2xs font-semibold bg-indigo-100 text-indigo-800">
                      服役 {diagnosticResult.lifecycleSynthesis.serviceYears} 年 · {diagnosticResult.lifecycleSynthesis.lifecyclePhase}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-2xs">
                    <div className="p-2 bg-indigo-50/50 rounded border border-indigo-100/80">
                      <span className="font-bold text-indigo-900 block mb-0.5">历史故障归纳与隐患关联：</span>
                      <p className="text-slate-600 leading-relaxed">
                        {diagnosticResult.lifecycleSynthesis.historicalFaultSummary}
                      </p>
                      {diagnosticResult.lifecycleSynthesis.repeatFaultWarning && (
                        <span className="inline-block mt-1 text-rose-700 font-bold bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                          ⚠️ {diagnosticResult.lifecycleSynthesis.repeatFaultDetail || '提示同类故障复发风险'}
                        </span>
                      )}
                    </div>

                    <div className="p-2 bg-slate-50 rounded border border-slate-200">
                      <span className="font-bold text-slate-800 block mb-0.5">
                        经济可行性：
                        <span className="text-emerald-700 font-semibold ml-1">
                          {diagnosticResult.lifecycleSynthesis.economicFeasibility}
                        </span>
                      </span>
                      <p className="text-slate-600 leading-relaxed">
                        {diagnosticResult.lifecycleSynthesis.economicAdvice}
                      </p>
                      {diagnosticResult.lifecycleSynthesis.modelSpecificNotes && (
                        <p className="text-slate-500 mt-1 italic border-t border-slate-200/60 pt-1">
                          型号注意：{diagnosticResult.lifecycleSynthesis.modelSpecificNotes}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Root Cause Cards */}
              <div className="space-y-2">
                <div className="text-xs font-bold text-slate-700 flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5 text-blue-600" />
                  Top 3 故障根因分析与发生概率：
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  {diagnosticResult.rootCauses.map((rc) => (
                    <div key={rc.rank} className="bg-white p-2.5 rounded-lg border border-blue-200/80 shadow-2xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-2xs font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                          Top {rc.rank} ({rc.probability})
                        </span>
                        <span className="text-2xs text-slate-500 font-medium">{rc.category}</span>
                      </div>
                      <div className="text-xs font-bold text-slate-800 leading-snug">
                        {rc.cause}
                      </div>
                      <p className="text-2xs text-slate-500 leading-relaxed">
                        {rc.mechanism}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recommended Parts & Engineer Steps */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Parts */}
                <div className="bg-white p-3 rounded-lg border border-blue-200/80 space-y-2">
                  <div className="text-xs font-bold text-slate-700 flex items-center justify-between">
                    <span>💡 推荐备品备件及耗材：</span>
                    <button
                      type="button"
                      onClick={() => {
                        const partsStr = diagnosticResult.recommendedParts.map(p => p.name).join('、');
                        const totalEst = diagnosticResult.recommendedParts.reduce((sum, p) => sum + p.estCost, 0);
                        setPartsReplaced(partsStr);
                        setCost(totalEst);
                      }}
                      className="text-2xs font-bold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                    >
                      一键带入零部件与费用
                    </button>
                  </div>
                  <div className="space-y-1.5">
                    {diagnosticResult.recommendedParts.map((part, idx) => (
                      <div key={idx} className="flex items-center justify-between text-2xs p-1.5 bg-slate-50 rounded border border-slate-100">
                        <span className="font-medium text-slate-800">{part.name}</span>
                        <span className="text-blue-700 font-mono font-bold">￥{part.estCost} ({part.necessity})</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Steps & Solution autofill */}
                <div className="bg-white p-3 rounded-lg border border-blue-200/80 space-y-2">
                  <div className="text-xs font-bold text-slate-700 flex items-center justify-between">
                    <span>📋 推荐处理方案建议：</span>
                    <button
                      type="button"
                      onClick={() => {
                        setResolution(diagnosticResult.suggestedResolution);
                      }}
                      className="text-2xs font-bold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                    >
                      一键填入修复结论
                    </button>
                  </div>
                  <p className="text-2xs text-slate-600 leading-relaxed bg-slate-50 p-2 rounded border border-slate-100">
                    {diagnosticResult.suggestedResolution}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 6. PARTS & RESOLUTION FIELDS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-semibold text-slate-700 text-xs">
                  更换零部件/耗材明细
                </label>
                {diagnosticResult && (
                  <button
                    type="button"
                    onClick={() => {
                      const str = diagnosticResult.recommendedParts.map(p => p.name).join('、');
                      setPartsReplaced(str);
                    }}
                    className="text-2xs text-amber-600 hover:underline cursor-pointer"
                  >
                    填入AI推荐配件
                  </button>
                )}
              </div>
              <input
                type="text"
                value={partsReplaced}
                onChange={(e) => setPartsReplaced(e.target.value)}
                placeholder="例：高压储能电容、血氧探头、呼气阀膜片、进气滤网"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium text-xs md:text-sm shadow-2xs"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-semibold text-slate-700 text-xs flex items-center gap-1">
                  <span>预估/结算费用 (元/人民币)</span>
                  {Number(cost) > 5000 && (
                    <span className="px-1.5 py-0.2 text-2xs font-bold bg-rose-100 text-rose-700 border border-rose-200 rounded animate-pulse">
                      超5000元需审批
                    </span>
                  )}
                </label>
                {Number(cost) > 5000 && onNavigateToApprovals && (
                  <button
                    type="button"
                    onClick={() => {
                      onNavigateToApprovals({
                        type: 'part_replacement',
                        equipmentId: currentEquipment?.id,
                        equipmentName: currentEquipment?.name,
                        equipmentModel: currentEquipment?.model,
                        equipmentLocation: currentEquipment?.usageLocation || currentEquipment?.location,
                        equipmentPurchasePrice: currentEquipment?.purchasePrice,
                        equipmentPurchaseDate: currentEquipment?.purchaseDate || currentEquipment?.enableDate,
                        applicantDepartment: currentEquipment?.department || currentUser?.departmentName || '医学工程科',
                        applicantName: currentUser?.name || technician || '维修工程师',
                        applicantPhone: currentUser?.phone || '13800000000',
                        partEstimatedCost: Number(cost),
                        partName: partsReplaced || '关键配件更换/重大维修',
                        faultSymptoms: faultDescription,
                        technicalAssessment: resolution || `经检测该设备故障维修涉及高额配件或重大维修，预估费用达 ¥${Number(cost).toLocaleString()}，已超过5,000元院内审批红线，需转入审批流完成跨部门论证审核。`,
                        urgency: Number(cost) >= 30000 ? 'critical' : 'high',
                        title: `【${currentEquipment?.department || '临床科室'}】${currentEquipment?.name || '医疗设备'} 大额配件更换/重大维修审批 (¥${Number(cost).toLocaleString()})`
                      });
                      onClose();
                    }}
                    className="text-2xs font-bold text-rose-700 hover:text-rose-900 bg-rose-50 hover:bg-rose-100 border border-rose-300 px-2 py-0.5 rounded flex items-center gap-1 transition cursor-pointer"
                    title="预估费用超过5000元，立即转入大额维修审批流"
                  >
                    <FileCheck className="w-3 h-3 text-rose-600" />
                    <span>立即转入审批流程 ➔</span>
                  </button>
                )}
              </div>
              <input
                type="number"
                value={cost}
                onChange={(e) => setCost(Number(e.target.value))}
                placeholder="0"
                className={`w-full px-3 py-2 bg-white border rounded-lg focus:outline-none focus:ring-2 font-medium text-xs md:text-sm font-mono shadow-2xs ${
                  Number(cost) > 5000 
                    ? 'border-rose-300 focus:ring-rose-500 bg-rose-50/20 text-rose-900 font-bold' 
                    : 'border-slate-300 focus:ring-amber-500'
                }`}
              />
            </div>
          </div>

          {/* 5000元审批流合规警示横幅 (Approval Policy Alert) */}
          {Number(cost) > 5000 && (
            <div className="p-3 bg-linear-to-r from-rose-50 via-amber-50 to-orange-50 rounded-xl border border-rose-200 flex items-start justify-between gap-3 text-xs animate-in fade-in duration-200">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <div className="font-bold text-rose-900 flex items-center gap-1.5">
                    <span>⚠️ 触发大额维修审批监管机制（预估费用 ¥{Number(cost).toLocaleString()} &gt; ¥5,000）</span>
                  </div>
                  <p className="text-2xs text-rose-800 leading-relaxed">
                    依据三甲公立医院医学装备经济管理规范，单次维修或换件预算超过 <strong>5,000 元</strong> 须经【使用科室主任 ➔ 医工处技术论证 ➔ 医学装备委员会/分管院长】签批后方可实施外修或采购配件。
                  </p>
                </div>
              </div>

              {onNavigateToApprovals && (
                <button
                  type="button"
                  onClick={() => {
                    onNavigateToApprovals({
                      type: 'part_replacement',
                      equipmentId: currentEquipment?.id,
                      equipmentName: currentEquipment?.name,
                      equipmentModel: currentEquipment?.model,
                      equipmentLocation: currentEquipment?.usageLocation || currentEquipment?.location,
                      equipmentPurchasePrice: currentEquipment?.purchasePrice,
                      equipmentPurchaseDate: currentEquipment?.purchaseDate || currentEquipment?.enableDate,
                      applicantDepartment: currentEquipment?.department || currentUser?.departmentName || '医学工程科',
                      applicantName: currentUser?.name || technician || '维修工程师',
                      applicantPhone: currentUser?.phone || '13800000000',
                      partEstimatedCost: Number(cost),
                      partName: partsReplaced || '关键配件更换/重大维修',
                      faultSymptoms: faultDescription,
                      technicalAssessment: resolution || `经检测该设备故障维修涉及高额配件或重大维修，预估费用达 ¥${Number(cost).toLocaleString()}，已超过5,000元院内审批红线，需转入审批流完成跨部门论证审核。`,
                      urgency: Number(cost) >= 30000 ? 'critical' : 'high',
                      title: `【${currentEquipment?.department || '临床科室'}】${currentEquipment?.name || '医疗设备'} 大额配件更换/重大维修审批 (¥${Number(cost).toLocaleString()})`
                    });
                    onClose();
                  }}
                  className="shrink-0 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 shadow-xs cursor-pointer"
                >
                  <FileCheck className="w-3.5 h-3.5" />
                  <span>转入审批流程</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              )}
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-semibold text-slate-700 text-xs">
                处理方案与维修结论
              </label>
              <div className="flex items-center gap-2">
                {(repairType === '定期预防性保养' || repairType === '巡检维护') ? (
                  <button
                    type="button"
                    onClick={handleGeneratePmPlan}
                    className="text-2xs font-bold text-amber-600 hover:text-amber-800 flex items-center gap-1 hover:underline cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3 text-amber-500" />
                    AI 生成标准 PM 保养检修内容
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleGenerateTechnicalAssessment}
                    className="text-2xs font-bold text-purple-700 hover:text-purple-900 bg-purple-50 hover:bg-purple-100 border border-purple-200 px-2 py-0.5 rounded flex items-center gap-1 cursor-pointer transition shadow-2xs"
                  >
                    <Sparkles className="w-3 h-3 text-purple-600" />
                    ✨ AI 工程师技术鉴定与方案
                  </button>
                )}
              </div>
            </div>
            <textarea
              rows={3}
              value={resolution}
              onChange={(e) => setResolution(e.target.value)}
              placeholder="例：已排除电源线路故障，重做质量控制测试，各项功能恢复正常。"
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium text-xs md:text-sm leading-relaxed shadow-2xs font-mono"
            />
          </div>

          {/* 7. STATUS & SYNC OPTIONS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            <div>
              <label className="block font-semibold text-slate-700 mb-1 text-xs">
                维保工单当前状态
              </label>
              <select
                value={repairStatus}
                onChange={(e) => setRepairStatus(e.target.value as any)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 font-bold text-xs md:text-sm text-slate-800 shadow-2xs"
              >
                <option value="处理中">🟡 处理中 (待派工/检修中)</option>
                <option value="待配件">🟠 待配件 (已向原厂/供应商申购备件)</option>
                <option value="已完成">🟢 已完成 (质控验收合格，恢复使用)</option>
              </select>
            </div>

            <div className="p-3 bg-amber-50/80 rounded-xl border border-amber-200 flex flex-col justify-center">
              <label className="flex items-center gap-2 cursor-pointer font-semibold text-amber-950 text-xs">
                <input
                  type="checkbox"
                  checked={updateEquipmentStatus}
                  onChange={(e) => setUpdateEquipmentStatus(e.target.checked)}
                  className="w-4 h-4 rounded border-amber-400 text-amber-600 focus:ring-amber-500 cursor-pointer"
                />
                同步联动更新设备在台账中的运行状态
              </label>
              {updateEquipmentStatus && (
                <select
                  value={newEquipmentStatus}
                  onChange={(e) => setNewEquipmentStatus(e.target.value as EquipmentStatus)}
                  className="mt-2 w-full px-2.5 py-1 bg-white border border-amber-300 rounded-lg text-xs font-bold text-amber-900 cursor-pointer"
                >
                  <option value="故障待修">➔ 联动设为【故障待修】</option>
                  <option value="维护保养中">➔ 联动设为【维护保养中】</option>
                  <option value="正常运行">➔ 联动恢复为【正常运行】</option>
                  <option value="停用/报废">➔ 联动设为【停用/报废】</option>
                </select>
              )}
            </div>
          </div>

          {/* Modal Footer Actions */}
          <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-2xs text-slate-500 flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
              工单提交后将实时写入全院设备履历与生命周期质量追踪总库
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-100 font-semibold text-xs md:text-sm transition cursor-pointer"
              >
                取消
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-linear-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white rounded-xl font-bold text-xs md:text-sm transition flex items-center gap-1.5 shadow-md hover:shadow-lg cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                提交维保工单与记录
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

import React, { useState, useEffect, useMemo } from 'react';
import { MedicalEquipment } from '../types';
import {
  AiAnalysisDimension,
  InteractiveDimensionParams,
  AiDimensionAnalysisResult,
  QuantitativeMetricItem,
  DIMENSION_DEFINITIONS,
  generateLocalDimensionAnalysis,
  calculateEquipmentDateLifecycle,
  BatchFleetAnalysisResult,
  BatchFleetDeviceAnalysis,
  generateLocalBatchFleetAnalysis
} from '../utils/aiDimensionEngine';
import {
  X,
  Sparkles,
  Bot,
  Loader2,
  ShieldAlert,
  Wrench,
  TrendingUp,
  Scale,
  RotateCcw,
  Sliders,
  Send,
  Copy,
  Check,
  AlertTriangle,
  CheckCircle2,
  Building2,
  DollarSign,
  Calendar,
  Layers,
  ChevronRight,
  HelpCircle,
  FileText,
  Activity,
  ArrowRight,
  MessageSquare,
  RefreshCw,
  Clock,
  ArrowUpRight,
  Zap,
  Flame,
  FileSpreadsheet,
  Info,
  Printer,
  Download,
  Filter,
  Eye,
  BarChart3,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { AiAnalysisReportPdfModal } from './AiAnalysisReportPdfModal';

interface AiDimensionAnalysisModalProps {
  isOpen: boolean;
  equipmentList: MedicalEquipment[];
  preSelectedDevice?: MedicalEquipment | null;
  selectedIds?: string[];
  initialDimension?: AiAnalysisDimension;
  onClose: () => void;
  onOpenRepairModalWithData?: (device: MedicalEquipment, faultDesc?: string, resolution?: string) => void;
  onOpenRepairModal?: (device: MedicalEquipment) => void;
  onOpenRoiDashboard?: (equipmentId: string) => void;
  onOpenDetailsModal?: (device: MedicalEquipment) => void;
  onChangeStatusForDevice?: (device: MedicalEquipment) => void;
}

export const AiDimensionAnalysisModal: React.FC<AiDimensionAnalysisModalProps> = ({
  isOpen,
  equipmentList,
  preSelectedDevice,
  selectedIds = [],
  initialDimension = 'comprehensive',
  onClose,
  onOpenRepairModalWithData,
  onOpenRepairModal,
  onOpenRoiDashboard,
  onOpenDetailsModal,
  onChangeStatusForDevice
}) => {
  // Candidate devices pool (support single selection, multi selection, or full list)
  const candidateDevices = useMemo(() => {
    if (selectedIds && selectedIds.length > 0) {
      const selected = equipmentList.filter(e => selectedIds.includes(e.id));
      if (selected.length > 0) return selected;
    }
    return equipmentList;
  }, [equipmentList, selectedIds]);

  // Mode: 'batch' (多台设备群体研判) or 'single' (单台设备深度研判)
  const [analysisScope, setAnalysisScope] = useState<'batch' | 'single'>('single');
  const [activeDeviceId, setActiveDeviceId] = useState<string>('');
  const [activeDimension, setActiveDimension] = useState<AiAnalysisDimension>(initialDimension);

  // Batch Fleet Analysis State
  const [batchLoading, setBatchLoading] = useState<boolean>(false);
  const [batchResult, setBatchResult] = useState<BatchFleetAnalysisResult | null>(null);
  const [batchFilterRisk, setBatchFilterRisk] = useState<'all' | 'danger' | 'warning' | 'overaged' | 'high_cost'>('all');

  // Single Device Interactive parameters
  const [scenario, setScenario] = useState<string>('ICU');
  const [workloadLevel, setWorkloadLevel] = useState<'super_high' | 'normal' | 'standby'>('normal');
  const [patientCriticality, setPatientCriticality] = useState<'critical' | 'moderate' | 'stable'>('critical');
  const [faultCodeOrSymptom, setFaultCodeOrSymptom] = useState<string>('');
  const [monthlyPatients, setMonthlyPatients] = useState<number>(800);
  const [avgFee, setAvgFee] = useState<number>(120);
  const [consumableRatio, setConsumableRatio] = useState<number>(0.2);
  const [disciplineStrategy, setDisciplineStrategy] = useState<'cost_control' | 'discipline_leader' | 'research_teaching'>('discipline_leader');

  // Single Device Loading & State
  const [loading, setLoading] = useState<boolean>(false);
  const [analysisResult, setAnalysisResult] = useState<AiDimensionAnalysisResult | null>(null);
  const [copiedText, setCopiedText] = useState<boolean>(false);
  const [aiSource, setAiSource] = useState<string>('gemini-3.7-flash');
  const [viewMode, setViewMode] = useState<'brief' | 'full'>('brief'); // 'brief': 简明要点决策视图, 'full': 完整多维推演视图
  const [showParams, setShowParams] = useState<boolean>(false); // 折叠繁杂工况参数
  const [showPdfPreview, setShowPdfPreview] = useState<boolean>(false); // PDF 报告预览弹窗

  // Chat & Q&A
  const [chatMessages, setChatMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string; time: string }>>([]);
  const [chatInput, setChatInput] = useState<string>('');
  const [chatLoading, setChatLoading] = useState<boolean>(false);

  // Auto initialize scope and active device when modal opens
  useEffect(() => {
    if (isOpen) {
      if (selectedIds && selectedIds.length > 1) {
        setAnalysisScope('batch');
        setActiveDeviceId(selectedIds[0] || (candidateDevices[0]?.id || ''));
      } else if (preSelectedDevice && preSelectedDevice.id) {
        setActiveDeviceId(preSelectedDevice.id);
        setAnalysisScope('single');
      } else if (candidateDevices.length > 1) {
        setAnalysisScope('batch');
        setActiveDeviceId(candidateDevices[0].id);
      } else if (candidateDevices.length === 1) {
        setActiveDeviceId(candidateDevices[0].id);
        setAnalysisScope('single');
      } else if (equipmentList.length > 0) {
        setActiveDeviceId(equipmentList[0].id);
        setAnalysisScope('single');
      }
      if (initialDimension) {
        setActiveDimension(initialDimension);
      }
    }
  }, [isOpen, selectedIds?.length, preSelectedDevice?.id, initialDimension]);

  const currentDevice = useMemo(() => {
    let dev: MedicalEquipment | null = null;
    if (activeDeviceId) {
      dev = equipmentList.find(e => e.id === activeDeviceId) || null;
    }
    if (!dev && preSelectedDevice && preSelectedDevice.id) {
      dev = preSelectedDevice;
    }
    if (!dev && candidateDevices.length > 0) {
      dev = candidateDevices[0];
    }
    if (!dev && equipmentList.length > 0) {
      dev = equipmentList[0];
    }
    return dev;
  }, [equipmentList, activeDeviceId, preSelectedDevice, candidateDevices]);

  // Comprehensive Date Lifecycle Analytics (出厂与有效期限全生命周期深度推演)
  const lifecycle = useMemo(() => {
    return currentDevice ? calculateEquipmentDateLifecycle(currentDevice) : null;
  }, [currentDevice]);

  // Adjust default interactive parameters when device changes
  useEffect(() => {
    if (currentDevice) {
      const price = currentDevice.purchasePrice || 120000;
      if (price > 1000000) {
        setMonthlyPatients(450);
        setAvgFee(320);
        setConsumableRatio(0.15);
      } else if (price > 300000) {
        setMonthlyPatients(900);
        setAvgFee(150);
        setConsumableRatio(0.20);
      } else {
        setMonthlyPatients(1800);
        setAvgFee(45);
        setConsumableRatio(0.25);
      }
      if (currentDevice.department?.includes('ICU') || currentDevice.department?.includes('重症')) {
        setScenario('ICU');
        setPatientCriticality('critical');
      } else if (currentDevice.department?.includes('急诊')) {
        setScenario('Emergency');
        setPatientCriticality('critical');
      } else if (currentDevice.department?.includes('手术')) {
        setScenario('OR');
        setPatientCriticality('critical');
      } else {
        setScenario('Ward');
        setPatientCriticality('moderate');
      }
      setChatMessages([]);
    }
  }, [currentDevice?.id]);

  // Run Batch Fleet Analysis
  const runBatchAnalysis = async () => {
    const devicesToAnalyze = candidateDevices.length > 0 ? candidateDevices : equipmentList;
    if (!devicesToAnalyze || devicesToAnalyze.length === 0) return;

    // 1. Immediate local synthesis so UI renders instantly
    const localBaseline = generateLocalBatchFleetAnalysis(devicesToAnalyze);
    setBatchResult(localBaseline);
    setBatchLoading(true);

    // 2. Fetch Gemini server-side batch fleet analysis
    try {
      const response = await fetch('/api/ai-batch-dimension-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ devices: devicesToAnalyze })
      });
      const resJson = await response.json();
      if (resJson && resJson.success && resJson.data) {
        setBatchResult(resJson.data);
      }
    } catch (err) {
      console.warn('Batch AI analysis network fallback to local engine:', err);
    } finally {
      setBatchLoading(false);
    }
  };

  // Run Single Device AI Analysis
  const runSingleAnalysis = async () => {
    if (!currentDevice) return;

    const interactiveParams: InteractiveDimensionParams = {
      scenario,
      workloadLevel,
      patientCriticality,
      faultCodeOrSymptom,
      monthlyPatients,
      avgFee,
      consumableRatio,
      disciplineStrategy
    };

    // 1. Immediate local expert synthesis
    const localBaseline = generateLocalDimensionAnalysis(currentDevice, activeDimension, interactiveParams);
    setAnalysisResult(localBaseline);
    setAiSource('clinical_expert_engine');
    setLoading(true);

    // 2. Fetch server-side Gemini multi-dimensional analysis
    try {
      const response = await fetch('/api/ai-dimension-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          equipment: currentDevice,
          dimension: activeDimension,
          interactiveParams
        })
      });

      const resJson = await response.json();
      if (resJson && resJson.success && resJson.data) {
        setAnalysisResult(resJson.data);
        setAiSource(resJson.source || 'gemini-3.7-flash');
      }
    } catch (e) {
      console.warn('AI dimension analysis network fallback to local engine:', e);
    } finally {
      setLoading(false);
    }
  };

  // Trigger analysis on modal open or scope switch
  useEffect(() => {
    if (isOpen) {
      if (analysisScope === 'batch') {
        runBatchAnalysis();
      } else if (analysisScope === 'single' && currentDevice) {
        runSingleAnalysis();
      }
    }
  }, [isOpen, analysisScope, currentDevice?.id, activeDimension]);

  // Handle follow up chat submit
  const handleSendChat = async (overridePrompt?: string) => {
    const textToSend = overridePrompt || chatInput.trim();
    if (!textToSend || !currentDevice) return;

    const timeStr = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const userMsg = { role: 'user' as const, content: textToSend, time: timeStr };
    setChatMessages(prev => [...prev, userMsg]);
    if (!overridePrompt) setChatInput('');
    setChatLoading(true);

    const interactiveParams: InteractiveDimensionParams = {
      scenario,
      workloadLevel,
      patientCriticality,
      faultCodeOrSymptom,
      monthlyPatients,
      avgFee,
      consumableRatio,
      disciplineStrategy
    };

    try {
      const response = await fetch('/api/ai-dimension-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          equipment: currentDevice,
          dimension: activeDimension,
          userQuestion: textToSend,
          chatHistory: chatMessages,
          interactiveParams
        })
      });

      const resJson = await response.json();
      const replyTime = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      if (resJson && resJson.success && resJson.reply) {
        setChatMessages(prev => [...prev, { role: 'assistant', content: resJson.reply, time: replyTime }]);
      } else {
        setChatMessages(prev => [
          ...prev,
          {
            role: 'assistant',
            content: `根据医学装备管理专家规范，针对【${currentDevice.name}】在当前使用场景下的分析：建议严格把控开机自检与电气安全周测，重点监控易损元器件温升指标与强检定标合规周期。`,
            time: replyTime
          }
        ]);
      }
    } catch (err) {
      setChatMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: '医学装备专家研判助手已记录您的提问。建议结合日常保养巡检规程执行点检。',
          time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  // Copy Single Report
  const handleCopySingleReport = () => {
    if (!analysisResult || !currentDevice) return;
    const text = `【医疗设备使用与健康分析报告】
设备名称：${currentDevice.name} (${currentDevice.model})
设备出厂序列号(SN)：${currentDevice.sn || currentDevice.id} (唯一硬件追溯码)
资产编号：${currentDevice.assetNo || currentDevice.id}
所属科室：${currentDevice.department} | 采购价格：￥${(currentDevice.purchasePrice || 0).toLocaleString()} 元
当前评估：${analysisResult.dimensionTitle}

📊 核心结论：
${analysisResult.executiveSummary}

🔍 核心要点：
${(analysisResult.keyTakeaways || analysisResult.coreFindings.slice(0, 3)).map((f, i) => `${i + 1}. ${f}`).join('\n')}

📈 关键指标情况：
${Object.values(analysisResult.quantitativeInsights).map((m: any) => `- ${m.label}：${m.value} (${m.comment})`).join('\n')}

🛠️ 推荐使用与维护建议：
${analysisResult.actionableRecommendations.map((r, i) => `${i + 1}. [${r.priority === '高' ? '重点建议' : '常规提醒'}] ${r.action} (${r.targetDepartment} - 预期效果: ${r.expectedOutcome})`).join('\n')}

⚠️ 安全注意事项：
${analysisResult.riskWarnings.map((w, i) => `${i + 1}. ${w}`).join('\n')}`;

    navigator.clipboard.writeText(text);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  // Copy Batch Report
  const handleCopyBatchReport = () => {
    if (!batchResult) return;
    const text = `【医疗装备群体资产运营与多维 AI 研判报告】
研判样本总量：${batchResult.totalCount} 台 | 资产总原值：￥${batchResult.totalPurchaseValue.toLocaleString()} 元
累计维保总额：￥${batchResult.totalRepairCost.toLocaleString()} 元 | 群体平均健康分：${batchResult.avgHealthScore} 分
超期服役台数：${batchResult.overagedCount} 台 | 高危与需重点关注：${batchResult.highRiskCount} 台

一、执行研判核心结论：
${batchResult.executiveSummary}

二、核心要点洞察：
${batchResult.keyInsights.map((k, i) => `${i + 1}. ${k}`).join('\n')}

三、医院运营与资产管理四大战略建议：
${batchResult.strategicRecommendations.map((r, i) => `${i + 1}. 【${r.category}】(${r.priority}优先级) - ${r.title}\n   ${r.description}`).join('\n')}

四、选中设备横向比对研判台账清单：
${batchResult.prioritizedDevices.map((d, i) => `${i + 1}. [${d.equipmentId}] ${d.equipmentName} (${d.model}) | SN: ${d.sn} | 科室: ${d.department}
   - 出厂: ${d.manufactureDateStr} (服役${d.ageYears}年) | 到期: ${d.expiryDateStr} (${d.isOveraged ? `已超期${d.overagedYears}年` : '正常在期'})
   - 维保: ￥${d.totalRepairCost.toLocaleString()} (占原值${d.repairCostRatio}%) | 健康分: ${d.healthScore}分 [${d.actionTag}]
   - 决策建议: ${d.recommendedAction}`).join('\n\n')}`;

    navigator.clipboard.writeText(text);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  // Export Batch CSV
  const handleExportBatchCsv = () => {
    if (!batchResult || !batchResult.prioritizedDevices) return;
    const headers = ['设备ID', '设备名称', '规格型号', '出厂序列号(SN)', '所属科室', '采购原值(元)', '出厂日期', '服役年限(年)', '有效到期日', '超期状态', '累计报修次数', '累计维保费用(元)', '维保/原值比(%)', 'AI健康评分', 'AI研判标签', 'AI决策建议'];
    const rows = batchResult.prioritizedDevices.map(d => [
      `"${d.equipmentId}"`,
      `"${d.equipmentName}"`,
      `"${d.model}"`,
      `"${d.sn}"`,
      `"${d.department}"`,
      d.purchasePrice,
      `"${d.manufactureDateStr}"`,
      d.ageYears,
      `"${d.expiryDateStr}"`,
      d.isOveraged ? `"超期${d.overagedYears}年"` : '"正常服役期内"',
      d.repairCount,
      d.totalRepairCost,
      `${d.repairCostRatio}%`,
      d.healthScore,
      `"${d.actionTag}"`,
      `"${d.recommendedAction.replace(/"/g, '""')}"`
    ]);
    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `医疗装备群体多维AI研判台账_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtered devices in batch mode
  const filteredBatchDevices = useMemo(() => {
    if (!batchResult) return [];
    const list = batchResult.prioritizedDevices;
    if (batchFilterRisk === 'danger') return list.filter(d => d.riskLevel === 'danger');
    if (batchFilterRisk === 'warning') return list.filter(d => d.riskLevel === 'warning');
    if (batchFilterRisk === 'overaged') return list.filter(d => d.isOveraged);
    if (batchFilterRisk === 'high_cost') return list.filter(d => d.repairCostRatio >= 25);
    return list;
  }, [batchResult, batchFilterRisk]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-6xl rounded-2xl shadow-2xl border border-slate-200 flex flex-col max-h-[92vh] overflow-hidden my-auto">
        {/* 1. Modal Top Bar */}
        <div className="px-5 py-3.5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between shrink-0 shadow-md">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-tr from-cyan-500 to-indigo-500 rounded-xl shadow-md text-white flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold tracking-tight text-white flex items-center gap-2">
                  <span>医疗装备多维智能研判与决策</span>
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10.5px] font-medium bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 flex items-center gap-1">
                  <Bot className="w-3 h-3 text-cyan-300" />
                  <span>临床工程与资产运营专家 AI</span>
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                支持单台深度推演与多台设备群体横向比对，围绕出厂年限、有效到期日、维保止损与运营效益全周期赋能
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {analysisScope === 'single' ? (
              <>
                <button
                  type="button"
                  onClick={() => setShowPdfPreview(true)}
                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-95 border border-blue-400/30"
                  title="预览并导出标准 A4 PDF 健康分析报告"
                >
                  <FileText className="w-3.5 h-3.5 text-blue-100" />
                  <span>PDF 报告预览</span>
                </button>
                <button
                  type="button"
                  onClick={handleCopySingleReport}
                  className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer border border-white/10 active:scale-95"
                  title="复制健康分析报告文本"
                >
                  {copiedText ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-300" />}
                  <span>{copiedText ? '已复制' : '复制文本'}</span>
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setShowPdfPreview(true)}
                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-95 border border-blue-400/30"
                  title="在同一个标准 A4 PDF 报告中汇总包含所有选中的多台设备"
                >
                  <FileText className="w-3.5 h-3.5 text-blue-100" />
                  <span>PDF 群体报告预览 ({candidateDevices.length}台汇总)</span>
                </button>
                <button
                  type="button"
                  onClick={handleExportBatchCsv}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-95 border border-emerald-400/30"
                  title="导出选中的所有设备群体研判数据台账"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-100" />
                  <span>导出批量台账 (CSV)</span>
                </button>
                <button
                  type="button"
                  onClick={handleCopyBatchReport}
                  className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer border border-white/10 active:scale-95"
                  title="复制群体多台设备综合研判报告"
                >
                  {copiedText ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-300" />}
                  <span>{copiedText ? '已复制' : '复制群体报告'}</span>
                </button>
              </>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition cursor-pointer"
              title="关闭"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 1.5 Mode Switcher Tabs */}
        <div className="px-5 py-2.5 bg-slate-900 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setAnalysisScope('batch')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                analysisScope === 'batch'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md border border-blue-400/40'
                  : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700'
              }`}
            >
              <Layers className="w-4 h-4 text-cyan-300" />
              <span>多台设备群体研判与资产决策</span>
              <span className="px-2 py-0.5 text-[10.5px] rounded-full bg-white/20 text-white font-mono font-bold">
                {candidateDevices.length} 台
              </span>
            </button>

            <button
              type="button"
              onClick={() => setAnalysisScope('single')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                analysisScope === 'single'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md border border-blue-400/40'
                  : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700'
              }`}
            >
              <Activity className="w-4 h-4 text-amber-300" />
              <span>单台设备深度穿透推演</span>
              {currentDevice && (
                <span className="text-[11px] text-slate-300 font-normal truncate max-w-[140px]">
                  ({currentDevice.name})
                </span>
              )}
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs">
            {analysisScope === 'batch' ? (
              <button
                type="button"
                onClick={runBatchAnalysis}
                disabled={batchLoading}
                className="px-3 py-1 bg-white/10 hover:bg-white/20 text-slate-200 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${batchLoading ? 'animate-spin text-cyan-300' : 'text-slate-300'}`} />
                <span>{batchLoading ? 'AI 正在研判中...' : '重新批量研判'}</span>
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-400">切换单机:</span>
                <select
                  value={activeDeviceId}
                  onChange={(e) => setActiveDeviceId(e.target.value)}
                  className="px-2.5 py-1 bg-slate-800 border border-slate-700 rounded-lg text-xs font-bold text-slate-200 shadow-2xs hover:border-blue-400 focus:ring-2 focus:ring-blue-400 cursor-pointer max-w-xs truncate"
                >
                  {candidateDevices.map((d) => (
                    <option key={d.id} value={d.id}>
                      [{d.id}] {d.name} ({d.model}) - {d.department}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* ═════════════════════════════════════════════════════════════════ */}
        {/* VIEW 1: BATCH FLEET ASSESSMENT (多台设备群体横向比对研判视图)       */}
        {/* ═════════════════════════════════════════════════════════════════ */}
        {analysisScope === 'batch' && (
          <div className="flex-1 overflow-y-auto bg-slate-100 p-4 sm:p-5 space-y-4">
            {/* 1. Batch Fleet KPI Overview Header */}
            {batchResult && (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs">
                  <span className="text-[11px] font-medium text-slate-500 block">研判设备样本</span>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-xl font-bold font-mono text-slate-800">{batchResult.totalCount}</span>
                    <span className="text-xs text-slate-500 font-medium">台</span>
                  </div>
                  <span className="text-[10px] text-blue-600 font-medium mt-1 block">多设备群体样本池</span>
                </div>

                <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs">
                  <span className="text-[11px] font-medium text-slate-500 block">资产原值总额</span>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-lg font-bold font-mono text-slate-800">
                      ￥{batchResult.totalPurchaseValue >= 10000 ? `${(batchResult.totalPurchaseValue / 10000).toFixed(1)}万` : batchResult.totalPurchaseValue.toLocaleString()}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500 block mt-1 truncate">固定资产入账规模</span>
                </div>

                <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs">
                  <span className="text-[11px] font-medium text-slate-500 block">累计维保支出总额</span>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-lg font-bold font-mono text-amber-700">
                      ￥{batchResult.totalRepairCost >= 10000 ? `${(batchResult.totalRepairCost / 10000).toFixed(1)}万` : batchResult.totalRepairCost.toLocaleString()}
                    </span>
                  </div>
                  <span className="text-[10px] text-amber-600 font-medium block mt-1">
                    占原值 {batchResult.totalPurchaseValue > 0 ? (Math.round((batchResult.totalRepairCost / batchResult.totalPurchaseValue) * 1000) / 10) : 0}% (止损线 30%)
                  </span>
                </div>

                <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs">
                  <span className="text-[11px] font-medium text-slate-500 block">群体平均健康分</span>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className={`text-xl font-bold font-mono ${batchResult.avgHealthScore >= 85 ? 'text-emerald-600' : batchResult.avgHealthScore >= 70 ? 'text-blue-600' : 'text-rose-600'}`}>
                      {batchResult.avgHealthScore}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">分</span>
                  </div>
                  <span className="text-[10px] text-slate-500 block mt-1">
                    {batchResult.avgHealthScore >= 85 ? '🌟 整体运行优良' : batchResult.avgHealthScore >= 70 ? '⚡ 状态中等稳健' : '⚠️ 需重点干预'}
                  </span>
                </div>

                <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs">
                  <span className="text-[11px] font-medium text-slate-500 block">超期服役设备</span>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className={`text-xl font-bold font-mono ${batchResult.overagedCount > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                      {batchResult.overagedCount}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">台</span>
                  </div>
                  <span className={`text-[10px] font-medium block mt-1 ${batchResult.overagedCount > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                    {batchResult.overagedCount > 0 ? `占比 ${Math.round((batchResult.overagedCount / batchResult.totalCount) * 100)}% 需鉴定/更新` : '全部在设计有效期内'}
                  </span>
                </div>

                <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs">
                  <span className="text-[11px] font-medium text-slate-500 block">高危/需重点处置</span>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className={`text-xl font-bold font-mono ${batchResult.highRiskCount > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                      {batchResult.highRiskCount}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">台</span>
                  </div>
                  <span className="text-[10px] text-slate-500 block mt-1">触发大修止损或故障</span>
                </div>
              </div>
            )}

            {/* 2. Strategic Management & AI Executive Insights Banner */}
            {batchResult && (
              <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <h3 className="text-sm font-bold text-slate-800">
                      AI 群体运营与管理决策综合报告 (Fleet Strategic Management Report)
                    </h3>
                  </div>
                  <span className="text-xs text-slate-400 font-medium">
                    针对选中的 {batchResult.totalCount} 台装备自动生成
                  </span>
                </div>

                {/* Executive Summary Callout */}
                <div className="p-4 bg-gradient-to-r from-blue-50/80 via-indigo-50/80 to-purple-50/80 border border-blue-200/70 rounded-xl">
                  <div className="flex items-start gap-3">
                    <span className="px-2 py-0.5 bg-blue-600 text-white rounded text-[10px] font-bold shrink-0 mt-0.5">
                      核心结论
                    </span>
                    <p className="text-xs text-slate-800 font-semibold leading-relaxed">
                      {batchResult.executiveSummary}
                    </p>
                  </div>
                </div>

                {/* 3 Key Takeaways Bullet List */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {batchResult.keyInsights.map((insight, idx) => (
                    <div key={idx} className="p-3.5 bg-slate-50 border border-slate-200/70 rounded-xl flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <p className="text-xs text-slate-700 leading-relaxed font-medium">
                        {insight}
                      </p>
                    </div>
                  ))}
                </div>

                {/* 4 Core Strategic Recommendation Cards */}
                <div className="pt-2">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5 text-blue-600" />
                    <span>医院运营与资产管理四大战略建议清单</span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {batchResult.strategicRecommendations.map((rec, idx) => {
                      const badgeBg = rec.priority === '高' ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-blue-50 text-blue-700 border-blue-200';
                      return (
                        <div key={idx} className="p-3.5 bg-white border border-slate-200 rounded-xl flex flex-col justify-between shadow-2xs hover:border-blue-300 transition">
                          <div>
                            <div className="flex items-center justify-between gap-1 mb-1.5">
                              <span className="text-[11px] font-bold text-slate-500">{rec.category}</span>
                              <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold border ${badgeBg}`}>
                                {rec.priority}优先级
                              </span>
                            </div>
                            <h5 className="text-xs font-bold text-slate-800 leading-snug mb-1.5">
                              {rec.title}
                            </h5>
                            <p className="text-[11.5px] text-slate-600 leading-relaxed">
                              {rec.description}
                            </p>
                          </div>
                          {rec.targetDevices && rec.targetDevices.length > 0 && (
                            <div className="mt-2.5 pt-2 border-t border-slate-100 text-[10px] text-slate-400">
                              涉及设备: {rec.targetDevices.length} 台
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* 3. Multi-Device Fleet Comparison Matrix Table */}
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
              <div className="px-5 py-3.5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 bg-slate-50/70">
                <div className="flex items-center gap-3 flex-wrap">
                  <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-blue-600" />
                    <span>选中设备横向比对与健康研判矩阵</span>
                  </h3>
                  <span className="text-xs text-slate-500 font-medium">
                    (共 {filteredBatchDevices.length} 台设备，点击“🔍 深入研判”可切换至单机精细推演)
                  </span>
                </div>

                {/* Filter Chips */}
                <div className="flex items-center gap-1.5 flex-wrap text-xs">
                  <button
                    type="button"
                    onClick={() => setBatchFilterRisk('all')}
                    className={`px-2.5 py-1 rounded-lg font-medium transition cursor-pointer ${
                      batchFilterRisk === 'all'
                        ? 'bg-slate-800 text-white font-bold'
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    全部 ({batchResult?.prioritizedDevices.length || 0})
                  </button>
                  <button
                    type="button"
                    onClick={() => setBatchFilterRisk('danger')}
                    className={`px-2.5 py-1 rounded-lg font-medium transition cursor-pointer ${
                      batchFilterRisk === 'danger'
                        ? 'bg-rose-600 text-white font-bold'
                        : 'bg-white text-rose-700 border border-rose-200 hover:bg-rose-50'
                    }`}
                  >
                    🛑 需处置/高风险 ({batchResult?.prioritizedDevices.filter(d => d.riskLevel === 'danger').length || 0})
                  </button>
                  <button
                    type="button"
                    onClick={() => setBatchFilterRisk('overaged')}
                    className={`px-2.5 py-1 rounded-lg font-medium transition cursor-pointer ${
                      batchFilterRisk === 'overaged'
                        ? 'bg-amber-600 text-white font-bold'
                        : 'bg-white text-amber-700 border border-amber-200 hover:bg-amber-50'
                    }`}
                  >
                    ⚠️ 超期服役 ({batchResult?.prioritizedDevices.filter(d => d.isOveraged).length || 0})
                  </button>
                  <button
                    type="button"
                    onClick={() => setBatchFilterRisk('high_cost')}
                    className={`px-2.5 py-1 rounded-lg font-medium transition cursor-pointer ${
                      batchFilterRisk === 'high_cost'
                        ? 'bg-purple-600 text-white font-bold'
                        : 'bg-white text-purple-700 border border-purple-200 hover:bg-purple-50'
                    }`}
                  >
                    ⚡ 维保高耗 ({batchResult?.prioritizedDevices.filter(d => d.repairCostRatio >= 25).length || 0})
                  </button>
                </div>
              </div>

              {/* Table of Fleet Devices */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100/80 text-slate-600 border-b border-slate-200 font-bold">
                      <th className="py-2.5 px-3">设备与出厂序列号(SN)</th>
                      <th className="py-2.5 px-3">所属科室 / 规格型号</th>
                      <th className="py-2.5 px-3">出厂日期 / 服役历时</th>
                      <th className="py-2.5 px-3">有效到期日 / 超期状态</th>
                      <th className="py-2.5 px-3">累计维保 / 原值比 (30%止损)</th>
                      <th className="py-2.5 px-3 text-center">AI健康分</th>
                      <th className="py-2.5 px-3">AI 研判决策结论与建议</th>
                      <th className="py-2.5 px-3 text-right">单台穿透</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/80 bg-white">
                    {filteredBatchDevices.map((d) => {
                      const rawDev = equipmentList.find(e => e.id === d.equipmentId);
                      return (
                        <tr key={d.equipmentId} className="hover:bg-blue-50/50 transition">
                          {/* SN & Name */}
                          <td className="py-2.5 px-3">
                            <div className="font-bold text-slate-800">{d.equipmentName}</div>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="px-1.5 py-0.2 bg-indigo-50 text-indigo-900 border border-indigo-200/80 rounded text-[10px] font-mono font-bold" title="出厂序列号 SN">
                                SN: {d.sn}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono">
                                ID: {d.equipmentId}
                              </span>
                            </div>
                          </td>

                          {/* Dept & Model */}
                          <td className="py-2.5 px-3">
                            <div className="text-slate-700 font-medium">{d.department}</div>
                            <div className="text-slate-500 text-[11px] truncate max-w-[140px]">{d.model}</div>
                          </td>

                          {/* Manufacture Date & Age */}
                          <td className="py-2.5 px-3">
                            <div className="font-mono text-slate-800 font-medium">{d.manufactureDateStr}</div>
                            <div className="text-[10.5px] text-blue-600 font-medium">已出厂 {d.ageYears} 年</div>
                          </td>

                          {/* Expiry Date & Overaged status */}
                          <td className="py-2.5 px-3">
                            <div className="font-mono text-slate-800">{d.expiryDateStr}</div>
                            {d.isOveraged ? (
                              <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 inline-block mt-0.5">
                                ⚠️ 超期服役 {d.overagedYears} 年
                              </span>
                            ) : (
                              <span className="text-[10.5px] text-emerald-600 font-medium block mt-0.5">
                                剩余有效 {d.remainingLifeYears} 年
                              </span>
                            )}
                          </td>

                          {/* Repair costs vs purchase price */}
                          <td className="py-2.5 px-3">
                            <div className="font-mono text-slate-800 font-medium">
                              ￥{d.totalRepairCost.toLocaleString()} ({d.repairCount}次)
                            </div>
                            <div className="mt-0.5 flex items-center gap-1">
                              <span className={`text-[10.5px] font-bold ${d.repairCostRatio >= 30 ? 'text-rose-600' : d.repairCostRatio >= 20 ? 'text-amber-600' : 'text-slate-500'}`}>
                                占原值 {d.repairCostRatio}%
                              </span>
                              {d.repairCostRatio >= 30 && (
                                <span className="px-1 py-0.1 bg-rose-100 text-rose-800 rounded text-[9px] font-bold">
                                  超止损线
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Health Score */}
                          <td className="py-2.5 px-3 text-center">
                            <span className={`px-2 py-1 rounded-lg font-bold font-mono text-xs inline-block ${
                              d.healthScore >= 85
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : d.healthScore >= 70
                                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                : 'bg-rose-50 text-rose-700 border border-rose-200 animate-pulse'
                            }`}>
                              {d.healthScore} 分
                            </span>
                          </td>

                          {/* Action Tag & Recommendation */}
                          <td className="py-2.5 px-3 max-w-xs">
                            <span className="px-1.5 py-0.5 rounded text-[10.5px] font-bold bg-slate-100 text-slate-800 border border-slate-200 inline-block mb-1">
                              {d.actionTag}
                            </span>
                            <p className="text-[11px] text-slate-600 leading-snug line-clamp-2" title={d.recommendedAction}>
                              {d.recommendedAction}
                            </p>
                          </td>

                          {/* Single Device Drilldown Action */}
                          <td className="py-2.5 px-3 text-right">
                            <button
                              type="button"
                              onClick={() => {
                                setActiveDeviceId(d.equipmentId);
                                setAnalysisScope('single');
                              }}
                              className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer active:scale-95 shadow-2xs ml-auto whitespace-nowrap"
                              title="穿透查看该设备的单台 5 维详细研判与交互推演"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>深入研判</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ═════════════════════════════════════════════════════════════════ */}
        {/* VIEW 2: SINGLE DEVICE DEEP DIVE (单台设备深度穿透推演视图)          */}
        {/* ═════════════════════════════════════════════════════════════════ */}
        {analysisScope === 'single' && currentDevice && (
          <div className="flex-1 overflow-y-auto flex flex-col">
            {/* 2. Device Selector & Snapshot Header Card */}
            <div className="px-5 py-2.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
                  <Layers className="w-3.5 h-3.5 text-blue-600" />
                  <span>当前分析设备:</span>
                </span>

                {/* Candidate Devices Switcher Dropdown */}
                <select
                  value={activeDeviceId}
                  onChange={(e) => setActiveDeviceId(e.target.value)}
                  className="px-3 py-1 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-800 shadow-2xs hover:border-blue-500 focus:ring-2 focus:ring-blue-200 cursor-pointer max-w-xs truncate"
                >
                  {candidateDevices.map((d) => (
                    <option key={d.id} value={d.id}>
                      [{d.id}] {d.name} ({d.model}) - SN: {d.sn || d.id} - {d.department}
                    </option>
                  ))}
                </select>

                {candidateDevices.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setAnalysisScope('batch')}
                    className="text-[11px] text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-2.5 py-0.5 rounded-full font-bold transition cursor-pointer flex items-center gap-1"
                  >
                    <span>← 返回全部 {candidateDevices.length} 台设备群体横向比对</span>
                  </button>
                )}
              </div>

              {/* Quick Metrics Tags */}
              <div className="flex items-center gap-2 text-xs flex-wrap">
                <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-900 border border-indigo-200/90 rounded-md font-mono font-bold flex items-center gap-1 shadow-2xs" title="设备出厂序列号 (重要唯一硬件标识)">
                  <span className="text-[10px] text-indigo-500 font-sans font-semibold">SN:</span>
                  <span>{currentDevice.sn || currentDevice.id}</span>
                </span>
                <span className="px-2 py-0.5 bg-white border border-slate-200 rounded-md text-slate-700 font-mono font-medium">
                  ID: <strong>{currentDevice.id}</strong>
                </span>
                <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-md font-medium">
                  {currentDevice.department}
                </span>
                <span className="px-2 py-0.5 bg-slate-100 text-slate-700 border border-slate-200 rounded-md font-mono">
                  原值: ￥{((currentDevice.purchasePrice || 85000)).toLocaleString()}
                </span>
                <span className={`px-2 py-0.5 rounded-md font-medium border ${
                  currentDevice.status === '正常运行'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : currentDevice.status === '故障待修'
                    ? 'bg-rose-50 text-rose-700 border-rose-200 font-bold animate-pulse'
                    : 'bg-amber-50 text-amber-700 border-amber-200'
                }`}>
                  {currentDevice.status}
                </span>
              </div>
            </div>

            {/* 2.5 CORE BASELINE: 出厂与产品有效期限全寿命时空研判看板 (Manufacture & Validity Lifecycle) */}
            {lifecycle && (
              <div className="px-5 py-3 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white border-b border-slate-700 shrink-0">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                  {/* Left Info: Key Dates & Serial Number */}
                  <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs">
                    {/* Serial Number Pill */}
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
                        <Layers className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block font-medium">设备出厂序列号 (SN)</span>
                        <strong className="text-sm font-mono text-cyan-300 font-bold tracking-tight">{currentDevice.sn || currentDevice.id}</strong>
                        <span className="text-[10px] text-slate-400 ml-1.5 font-normal">唯一物理追溯</span>
                      </div>
                    </div>

                    <div className="h-6 w-px bg-slate-700 hidden sm:block" />

                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-blue-500/20 text-blue-300 border border-blue-400/30">
                        <Calendar className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block font-medium">出厂日期 (时滞: {lifecycle.storageLagMonths}个月)</span>
                        <strong className="text-sm font-mono text-white">{lifecycle.manufactureDateStr}</strong>
                        <span className="text-[10px] text-blue-300 ml-1.5">已出厂 {lifecycle.ageFromManufactureYears} 年</span>
                      </div>
                    </div>

                    <div className="h-6 w-px bg-slate-700 hidden sm:block" />

                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                        <Clock className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block font-medium">首次投用日期</span>
                        <strong className="text-sm font-mono text-white">{lifecycle.enableDateStr}</strong>
                        <span className="text-[10px] text-indigo-300 ml-1.5">服役 {lifecycle.ageFromEnableYears} 年</span>
                      </div>
                    </div>

                    <div className="h-6 w-px bg-slate-700 hidden sm:block" />

                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded-lg border ${
                        lifecycle.isOveraged
                          ? 'bg-rose-500/20 text-rose-300 border-rose-400/40'
                          : 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40'
                      }`}>
                        <Activity className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block font-medium">产品设计有效期 ({lifecycle.designLifeYears}年)</span>
                        <strong className={`text-sm font-mono ${lifecycle.isOveraged ? 'text-rose-300' : 'text-emerald-300'}`}>
                          {lifecycle.expiryDateStr}
                        </strong>
                        <span className="text-[10px] text-slate-300 ml-1.5">
                          {lifecycle.isOveraged ? `(超期服役 ${lifecycle.overagedYears} 年)` : `(剩余有效 ${lifecycle.remainingLifeYears} 年)`}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Lifecycle Badge & Overhaul Cutoff */}
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`px-3 py-1.5 rounded-lg text-xs font-bold border flex items-center gap-1.5 ${
                      lifecycle.isOveraged
                        ? 'bg-rose-950/80 text-rose-200 border-rose-600/60 animate-pulse'
                        : lifecycle.lifeConsumptionRatio > 80
                        ? 'bg-amber-950/80 text-amber-200 border-amber-600/60'
                        : 'bg-emerald-950/80 text-emerald-200 border-emerald-600/60'
                    }`}>
                      {lifecycle.isOveraged ? <AlertTriangle className="w-3.5 h-3.5 text-rose-400" /> : <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                      <span>{lifecycle.lifecycleStageLabel}</span>
                      <span className="text-[10px] opacity-80">({lifecycle.lifeConsumptionRatio}%)</span>
                    </span>

                    <span className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 border border-slate-700 text-slate-300 flex items-center gap-1" title="原值 30% 止损原则：单次大修费用超此数值建议直接淘汰">
                      <DollarSign className="w-3.5 h-3.5 text-amber-400" />
                      <span>大修止损线:</span>
                      <strong className="text-amber-300 font-mono">￥{lifecycle.overhaulEconomicCutoff.toLocaleString()}</strong>
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* 3. Dimension Selection Tabs */}
            <div className="px-5 py-2 bg-white border-b border-slate-200 flex items-center justify-between gap-2 overflow-x-auto shrink-0 shadow-2xs">
              <div className="flex items-center gap-1.5">
                {DIMENSION_DEFINITIONS.map((dim) => {
                  const isSelected = activeDimension === dim.key;
                  return (
                    <button
                      key={dim.key}
                      type="button"
                      onClick={() => setActiveDimension(dim.key)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                        isSelected
                          ? 'bg-blue-600 text-white shadow-xs border border-blue-500'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200/80'
                      }`}
                    >
                      <span>{dim.title}</span>
                    </button>
                  );
                })}
              </div>

              {/* Toggle params button */}
              <button
                type="button"
                onClick={() => setShowParams(!showParams)}
                className="px-2.5 py-1.5 text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition flex items-center gap-1 cursor-pointer shrink-0 border border-slate-200"
              >
                <Sliders className="w-3.5 h-3.5 text-slate-500" />
                <span>{showParams ? '收起工况微调' : '展开工况微调'}</span>
                {showParams ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
            </div>

            {/* 4. Interactive Parameters Drawer (Collapsible) */}
            {showParams && (
              <div className="px-5 py-3 bg-slate-50/80 border-b border-slate-200 text-xs text-slate-700 grid grid-cols-2 sm:grid-cols-4 gap-3 shrink-0 animate-in fade-in duration-150">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">使用场景科室</label>
                  <select
                    value={scenario}
                    onChange={(e) => setScenario(e.target.value)}
                    className="w-full px-2.5 py-1 bg-white border border-slate-300 rounded-lg text-xs font-medium"
                  >
                    <option value="ICU">重症监护 (ICU)</option>
                    <option value="OR">手术室 (OR)</option>
                    <option value="Emergency">急诊抢救室</option>
                    <option value="Ward">普通住院病区</option>
                    <option value="Imaging">医学影像中心</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">月度接诊负荷</label>
                  <input
                    type="number"
                    value={monthlyPatients}
                    onChange={(e) => setMonthlyPatients(Number(e.target.value))}
                    className="w-full px-2.5 py-1 bg-white border border-slate-300 rounded-lg text-xs font-mono"
                    placeholder="800人次"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">平均次均收费 (元)</label>
                  <input
                    type="number"
                    value={avgFee}
                    onChange={(e) => setAvgFee(Number(e.target.value))}
                    className="w-full px-2.5 py-1 bg-white border border-slate-300 rounded-lg text-xs font-mono"
                    placeholder="120元"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">学科定位策略</label>
                  <select
                    value={disciplineStrategy}
                    onChange={(e) => setDisciplineStrategy(e.target.value as any)}
                    className="w-full px-2.5 py-1 bg-white border border-slate-300 rounded-lg text-xs font-medium"
                  >
                    <option value="discipline_leader">区域学科领军 (追求先进性)</option>
                    <option value="cost_control">成本严格控制 (注重寿命收益)</option>
                    <option value="research_teaching">医教研协同 (多功能兼容)</option>
                  </select>
                </div>
              </div>
            )}

            {/* 5. Main Single Analysis Result Content */}
            <div className="p-5 bg-slate-100 flex-1 overflow-y-auto space-y-4">
              {analysisResult ? (
                <>
                  {/* Verdict & Takeaways Banner */}
                  <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs space-y-3.5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${
                          analysisResult.verdictTag?.level === 'danger'
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : analysisResult.verdictTag?.level === 'warning'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}>
                          {analysisResult.verdictTag?.text || '🌟 综合状态评估'}
                        </span>
                        <span className="text-xs text-slate-500 font-medium">
                          {analysisResult.verdictTag?.subTitle}
                        </span>
                      </div>

                      {/* Radar score chips */}
                      <div className="flex items-center gap-2 text-xs flex-wrap">
                        <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 font-bold font-mono">
                          安全分: {analysisResult.radarScores.safetyScore}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold font-mono">
                          可靠性: {analysisResult.radarScores.reliabilityScore}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold font-mono">
                          效益分: {analysisResult.radarScores.roiHealthScore}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200 font-bold font-mono">
                          合规分: {analysisResult.radarScores.complianceScore}
                        </span>
                      </div>
                    </div>

                    {/* Executive Summary */}
                    <div className="p-3.5 bg-gradient-to-r from-blue-50/70 via-indigo-50/70 to-slate-50 border border-blue-100 rounded-xl">
                      <div className="flex items-start gap-2.5">
                        <Sparkles className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                        <p className="text-xs text-slate-800 font-semibold leading-relaxed">
                          {analysisResult.executiveSummary}
                        </p>
                      </div>
                    </div>

                    {/* Key takeaways */}
                    <div className="space-y-2">
                      {(analysisResult.keyTakeaways || analysisResult.coreFindings).map((item, idx) => (
                        <div key={idx} className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl text-xs text-slate-700 flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                          <span className="leading-relaxed">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Quantitative Insights */}
                  {analysisResult.quantitativeInsights && Object.keys(analysisResult.quantitativeInsights).length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {Object.entries(analysisResult.quantitativeInsights).map(([k, item]: [string, any]) => (
                        <div key={k} className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
                          <span className="text-[11px] font-medium text-slate-500 block">{item.label}</span>
                          <span className="text-sm font-bold text-slate-800 font-mono mt-1 block">{item.value}</span>
                          <span className="text-[10px] text-slate-400 block mt-0.5">{item.comment}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Actionable Recommendations */}
                  {analysisResult.actionableRecommendations && analysisResult.actionableRecommendations.length > 0 && (
                    <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3">
                      <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                        <Wrench className="w-4 h-4 text-blue-600" />
                        <span>推荐落地操作与资产管理建议</span>
                      </h4>
                      <div className="space-y-2.5">
                        {analysisResult.actionableRecommendations.map((rec, idx) => (
                          <div key={idx} className="p-3.5 bg-slate-50 border border-slate-200/90 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${rec.priority === '高' ? 'bg-rose-100 text-rose-800' : 'bg-blue-100 text-blue-800'}`}>
                                  {rec.priority}优先级
                                </span>
                                <span className="text-xs font-bold text-slate-800">{rec.action}</span>
                              </div>
                              <p className="text-[11px] text-slate-500">
                                责任部门: <span className="text-slate-700 font-medium">{rec.targetDepartment}</span> | 预期效果: <span className="text-emerald-700 font-medium">{rec.expectedOutcome}</span>
                              </p>
                            </div>
                            {onOpenRepairModalWithData && (
                              <button
                                type="button"
                                onClick={() => onOpenRepairModalWithData(currentDevice, rec.action, rec.expectedOutcome)}
                                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 shrink-0 cursor-pointer shadow-2xs"
                              >
                                <Wrench className="w-3.5 h-3.5" />
                                <span>转报修点检</span>
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Risk Warnings */}
                  {analysisResult.riskWarnings && analysisResult.riskWarnings.length > 0 && (
                    <div className="bg-rose-50/70 border border-rose-200/80 rounded-2xl p-4 text-xs text-rose-900 space-y-2">
                      <div className="flex items-center gap-1.5 font-bold text-rose-800">
                        <AlertTriangle className="w-4 h-4 text-rose-600" />
                        <span>安全警示与合规底线要求</span>
                      </div>
                      <ul className="list-disc list-inside space-y-1 text-rose-800 leading-relaxed">
                        {analysisResult.riskWarnings.map((warn, i) => (
                          <li key={i}>{warn}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Interactive Q&A Chat */}
                  <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                      <div className="flex items-center gap-1.5">
                        <MessageSquare className="w-4 h-4 text-indigo-600" />
                        <h4 className="text-xs font-bold text-slate-800">智能专家多轮深入追问与工况答疑</h4>
                      </div>
                      <span className="text-[11px] text-slate-400">结合三甲评审与原厂标准</span>
                    </div>

                    {/* Chat history */}
                    {chatMessages.length > 0 && (
                      <div className="space-y-2.5 max-h-60 overflow-y-auto p-3 bg-slate-50 rounded-xl border border-slate-200">
                        {chatMessages.map((msg, i) => (
                          <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                            <div className={`max-w-[85%] p-2.5 rounded-xl text-xs ${msg.role === 'user' ? 'bg-blue-600 text-white font-medium' : 'bg-white text-slate-800 border border-slate-200 shadow-2xs leading-relaxed'}`}>
                              <p className="whitespace-pre-line">{msg.content}</p>
                            </div>
                            <span className="text-[9.5px] text-slate-400 mt-0.5 px-1">{msg.time}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Suggested questions */}
                    {analysisResult.interactiveFollowUpSuggestions && analysisResult.interactiveFollowUpSuggestions.length > 0 && (
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10.5px] text-slate-400 font-medium">推荐追问:</span>
                        {analysisResult.interactiveFollowUpSuggestions.map((q, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => handleSendChat(q)}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-600 rounded-lg text-[11px] font-medium transition cursor-pointer border border-slate-200"
                          >
                            {q}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Chat input form */}
                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="text"
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendChat();
                          }
                        }}
                        placeholder={`针对【${currentDevice.name}】输入进一步运营或技术追问...`}
                        className="flex-1 px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition"
                      />
                      <button
                        type="button"
                        onClick={() => handleSendChat()}
                        disabled={chatLoading || !chatInput.trim()}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-2xs cursor-pointer active:scale-95 shrink-0"
                      >
                        {chatLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                        <span>发送追问</span>
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-3" />
                  <p className="text-xs font-medium">正在生成全生命周期时空研判模型...</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 6. Modal Bottom Action Bar */}
        <div className="px-5 py-3 bg-white border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>
              {analysisScope === 'batch'
                ? `已就绪 ${candidateDevices.length} 台设备横向比对与大修止损研判模型`
                : '已就绪 6 大全生命周期研判维度与交互式推演引擎'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {analysisScope === 'batch' ? (
              <>
                <button
                  type="button"
                  onClick={() => setShowPdfPreview(true)}
                  className="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer active:scale-95 shadow-2xs"
                  title="预览并在一个标准 A4 PDF 报告中汇总包含所有多台设备"
                >
                  <FileText className="w-4 h-4 text-blue-600" />
                  <span>PDF 群体综合报告预览 / 打印</span>
                </button>
                <button
                  type="button"
                  onClick={handleExportBatchCsv}
                  className="px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer active:scale-95 shadow-2xs"
                >
                  <Download className="w-4 h-4 text-emerald-600" />
                  <span>导出研判台账清单 (CSV)</span>
                </button>
                <button
                  type="button"
                  onClick={handleCopyBatchReport}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer active:scale-95"
                >
                  {copiedText ? '已复制群体报告' : '复制完整研判报告'}
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setShowPdfPreview(true)}
                  className="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer active:scale-95 shadow-2xs"
                  title="预览并导出标准 A4 PDF 研判报告"
                >
                  <FileText className="w-4 h-4 text-blue-600" />
                  <span>PDF 报告预览 / 打印</span>
                </button>
                <button
                  type="button"
                  onClick={handleCopySingleReport}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer active:scale-95"
                >
                  {copiedText ? '已复制到剪贴板' : '复制单机研判报告'}
                </button>
              </>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition cursor-pointer active:scale-95 shadow-2xs"
            >
              完成并关闭
            </button>
          </div>
        </div>
      </div>

      {/* 8. Dedicated A4 PDF Preview & Print Modal (Supports both Multi-Device Combined Fleet Report and Single Device Report) */}
      {showPdfPreview && (
        <AiAnalysisReportPdfModal
          isOpen={showPdfPreview}
          onClose={() => setShowPdfPreview(false)}
          equipment={currentDevice}
          analysisResult={analysisResult}
          batchResult={batchResult}
          candidateDevices={candidateDevices}
          initialMode={analysisScope === 'batch' ? 'fleet' : 'single'}
          dimensionTitle={DIMENSION_DEFINITIONS.find(d => d.key === activeDimension)?.title}
          aiSource={aiSource}
        />
      )}
    </div>
  );
};

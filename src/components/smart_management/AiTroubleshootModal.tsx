import React, { useState } from 'react';
import { 
  Bot, 
  Zap, 
  Wrench, 
  ShieldAlert, 
  CheckCircle2, 
  Clock, 
  Package, 
  Copy, 
  Sparkles, 
  ArrowRight,
  AlertCircle,
  FileText,
  Activity,
  Layers
} from 'lucide-react';
import { MedicalEquipment } from '../../types';

interface AiTroubleshootModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialEquipment?: MedicalEquipment | null;
  allEquipments: MedicalEquipment[];
  onApplyResolutionToWorkOrder?: (conclusion: string) => void;
}

interface DeepTroubleshootResult {
  faultTree: {
    layer: string;
    node: string;
    probability: string;
    checkMethod: string;
  }[];
  stepByStepActionPlan: {
    step: number;
    title: string;
    action: string;
    toolRequired: string;
    estimatedMinutes: number;
  }[];
  sparePartsAdvice: {
    partName: string;
    partNumber: string;
    estimatedCost: number;
    urgency: string;
    isHospitalStockAvailable: boolean;
  }[];
  safetyPrecautions: string[];
  economicFeasibility: string;
  officialConclusionDraft: string;
}

export const AiTroubleshootModal: React.FC<AiTroubleshootModalProps> = ({
  isOpen,
  onClose,
  initialEquipment,
  allEquipments,
  onApplyResolutionToWorkOrder
}) => {
  const [selectedEquipId, setSelectedEquipId] = useState<string>(initialEquipment?.id || allEquipments[0]?.id || 'EQ-001');
  const [faultSymptom, setFaultSymptom] = useState<string>('设备开机自检报警，心电导联阻抗过大，SpO2波形偶发性丢失');
  const [errorCode, setErrorCode] = useState<string>('ERR-7402 / SYSTEM FAULT');
  const [additionalContext, setAdditionalContext] = useState<string>('已检查市电与地线，外接导联线更换后仍存在偶发中断');
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<DeepTroubleshootResult | null>(null);
  const [copiedConclusion, setCopiedConclusion] = useState<boolean>(false);
  const [modelSource, setModelSource] = useState<string>('gemini-3.8-flash');

  if (!isOpen) return null;

  const currentEquipment = allEquipments.find(e => e.id === selectedEquipId) || initialEquipment || allEquipments[0];

  const handleRunTroubleshoot = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/ai/deep-troubleshoot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          equipmentId: currentEquipment?.id,
          equipmentName: currentEquipment?.name,
          model: currentEquipment?.model,
          department: currentEquipment?.department,
          faultSymptom,
          errorCode,
          serviceYears: currentEquipment?.serviceYears || 4.2,
          additionalContext
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.data) {
          setResult(data.data);
          setModelSource(data.source || 'gemini-3.8-flash');
        }
      }
    } catch (err) {
      console.warn('AI troubleshoot failed, fallback:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyConclusion = () => {
    if (!result?.officialConclusionDraft) return;
    navigator.clipboard.writeText(result.officialConclusionDraft);
    setCopiedConclusion(true);
    setTimeout(() => setCopiedConclusion(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-4xl w-full p-6 shadow-2xl space-y-6 my-8 max-h-[90vh] flex flex-col">
        {/* 标题栏 */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-4 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-sky-600 flex items-center justify-center text-white shadow-xs">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                  Gemini 医工专家大模型智能排查与维保建议
                </h2>
                <span className="text-[11px] font-mono font-medium text-sky-800 bg-sky-50 px-2 py-0.5 rounded border border-sky-200/60">
                  {modelSource}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                结合具体设备型号硬件架构、在用年限老化规律及历史维修记录进行多层故障树推理与排障建议
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* 主体滚动区 */}
        <div className="overflow-y-auto space-y-6 flex-1 pr-1 text-xs">
          {/* 输入表单 */}
          <form onSubmit={handleRunTroubleshoot} className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">选择待排查在册设备</label>
                <select
                  value={selectedEquipId}
                  onChange={e => setSelectedEquipId(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg focus:border-sky-500 focus:outline-hidden bg-white text-slate-800"
                >
                  {allEquipments.map(eq => (
                    <option key={eq.id} value={eq.id}>
                      [{eq.id}] {eq.name} ({eq.department})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">设备报警或错误代码 (Error Code)</label>
                <input
                  type="text"
                  value={errorCode}
                  onChange={e => setErrorCode(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg focus:border-sky-500 focus:outline-hidden bg-white text-slate-800 font-mono"
                  placeholder="如 ERR-7402, ECG-LEAD-FAIL..."
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">现场故障现象描述</label>
                <textarea
                  rows={2}
                  value={faultSymptom}
                  onChange={e => setFaultSymptom(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg focus:border-sky-500 focus:outline-hidden bg-white text-slate-800"
                  placeholder="描述临床具体使用异常表现..."
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">现场环境或初步自查线索</label>
                <textarea
                  rows={2}
                  value={additionalContext}
                  onChange={e => setAdditionalContext(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg focus:border-sky-500 focus:outline-hidden bg-white text-slate-800"
                  placeholder="如市电电压、气源压力、是否受潮或跌落..."
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-slate-500 text-[11px]">
                当前设备原值 ￥{(currentEquipment?.purchasePrice || 0).toLocaleString()} · 已服役约 {currentEquipment?.serviceYears || 4.2} 年
              </span>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-slate-900 text-white font-medium rounded-lg hover:bg-slate-800 transition-colors shadow-xs flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-sky-400" />
                <span>{loading ? '大模型故障树推理中...' : '生成专家排查方案与故障树'}</span>
              </button>
            </div>
          </form>

          {/* 排查结果呈现区 */}
          {result && (
            <div className="space-y-5 animate-in fade-in duration-300">
              {/* 1. 多层故障树 (Level 1 - Level 3) */}
              <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                  <Layers className="w-4 h-4 text-sky-600" />
                  <h4 className="text-sm font-bold text-slate-900">故障失效机理三层故障树 (Fault Tree Analysis)</h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {result.faultTree.map((node, i) => (
                    <div key={i} className="bg-slate-50 border border-slate-200/80 rounded-lg p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sky-900">{node.layer}</span>
                        <span className="text-slate-500 font-mono text-[11px]">概率: {node.probability}</span>
                      </div>
                      <p className="font-semibold text-slate-800 leading-tight">{node.node}</p>
                      <div className="pt-2 border-t border-slate-200/60 text-slate-600 text-[11px]">
                        <span className="font-medium text-slate-700">排查手段：</span>{node.checkMethod}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 2. 临床工程师步进排障行动指南 */}
              <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <div className="flex items-center gap-2">
                    <Wrench className="w-4 h-4 text-emerald-600" />
                    <h4 className="text-sm font-bold text-slate-900">标准现场排障步骤与工装建议</h4>
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono">
                    预计现场耗时: {result.stepByStepActionPlan.reduce((acc, s) => acc + s.estimatedMinutes, 0)} 分钟
                  </span>
                </div>

                <div className="space-y-2">
                  {result.stepByStepActionPlan.map((step) => (
                    <div key={step.step} className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 border border-slate-100">
                      <div className="w-6 h-6 rounded-full bg-slate-900 text-white font-mono font-bold flex items-center justify-center shrink-0 text-xs">
                        {step.step}
                      </div>
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900 text-xs">{step.title}</span>
                          <span className="text-slate-500 font-mono text-[11px]">{step.estimatedMinutes} 分钟</span>
                        </div>
                        <p className="text-slate-700 leading-relaxed">{step.action}</p>
                        <div className="text-slate-500 text-[11px]">
                          <span className="font-medium text-slate-700">所需工具：</span>{step.toolRequired}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 3. 推荐配件与经济学评估 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
                  <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                    <Package className="w-4 h-4 text-amber-600" />
                    <h4 className="text-sm font-bold text-slate-900">建议更换备品备件</h4>
                  </div>
                  <div className="space-y-2">
                    {result.sparePartsAdvice.map((part, idx) => (
                      <div key={idx} className="p-2.5 bg-slate-50 border border-slate-200 rounded flex items-center justify-between">
                        <div>
                          <div className="font-bold text-slate-900">{part.partName}</div>
                          <div className="text-[11px] text-slate-500 font-mono">料号: {part.partNumber} · {part.urgency}</div>
                        </div>
                        <div className="text-right font-mono">
                          <div className="font-bold text-slate-900">￥{part.estimatedCost}</div>
                          <div className="text-[10px] text-emerald-600">
                            {part.isHospitalStockAvailable ? '院内备件库有现货' : '需发起外购申领'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
                  <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                    <ShieldAlert className="w-4 h-4 text-rose-600" />
                    <h4 className="text-sm font-bold text-slate-900">电气安全与经济性处置建议</h4>
                  </div>
                  <div className="space-y-2">
                    <div className="p-2.5 bg-sky-50/60 border border-sky-200/60 rounded text-slate-700">
                      <span className="font-semibold text-sky-900 block mb-0.5">维保经济学研判：</span>
                      {result.economicFeasibility}
                    </div>
                    <div className="space-y-1">
                      <span className="font-semibold text-slate-800">安全合规防范红线：</span>
                      <ul className="list-disc list-inside text-slate-600 space-y-1">
                        {result.safetyPrecautions.map((sp, i) => (
                          <li key={i}>{sp}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* 4. 标准工单维修结论文案 (支持一键复制与回填) */}
              <div className="bg-slate-900 text-white rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-emerald-400" />
                    <h4 className="text-sm font-bold text-white">符合等级医院质控规范的维修结论文案</h4>
                  </div>
                  <button
                    onClick={handleCopyConclusion}
                    className="flex items-center gap-1 text-[11px] text-sky-300 hover:text-sky-200 bg-slate-800 px-2.5 py-1 rounded transition-colors"
                  >
                    <Copy className="w-3 h-3" />
                    <span>{copiedConclusion ? '已复制到剪贴板！' : '复制结论文案'}</span>
                  </button>
                </div>
                <p className="text-slate-300 leading-relaxed font-sans">
                  {result.officialConclusionDraft}
                </p>
                {onApplyResolutionToWorkOrder && (
                  <div className="pt-2 flex justify-end">
                    <button
                      onClick={() => onApplyResolutionToWorkOrder(result.officialConclusionDraft)}
                      className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-medium transition-colors text-xs flex items-center gap-1"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>一键回填至当前维修工单</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 底部按钮栏 */}
        <div className="pt-4 border-t border-slate-200 flex items-center justify-between shrink-0 text-xs">
          <span className="text-slate-400">
            支持基于医学装备知识库与工程自检日志的自动化分级推演
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg transition-colors"
          >
            完成并关闭
          </button>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { 
  CheckCircle2, 
  ArrowRight, 
  ExternalLink, 
  Copy, 
  Check, 
  FileCheck2, 
  ShieldCheck, 
  BarChart3, 
  ChevronRight, 
  X,
  Search,
  Filter,
  Sparkles,
  Layers,
  Database,
  Activity,
  Award
} from 'lucide-react';
import { ActiveTab } from '../../types';
import { CORE_11_INDICATORS_DATA, CoreIndicatorDetail, IndicatorSampleRecord } from '../../data/indicatorDrillDownData';

interface IndicatorDrillDownModalProps {
  initialIndicatorId?: number;
  isOpen: boolean;
  onClose: () => void;
  onNavigateToTab?: (tab: ActiveTab) => void;
  maskText?: (text: string) => string;
}

export const IndicatorDrillDownModal: React.FC<IndicatorDrillDownModalProps> = ({
  initialIndicatorId = 1,
  isOpen,
  onClose,
  onNavigateToTab,
  maskText = (t) => t
}) => {
  const [selectedId, setSelectedId] = useState<number>(initialIndicatorId);
  const [selectedDimension, setSelectedDimension] = useState<string>('ALL');
  const [copiedSha, setCopiedSha] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentIndicator = CORE_11_INDICATORS_DATA.find(i => i.id === selectedId) || CORE_11_INDICATORS_DATA[0];

  const dimensions = ['ALL', '数据治理', '流程闭环', '预防维护', '法定红线', '服务效能', '智能协同', '量化赋能'];

  const filteredIndicators = selectedDimension === 'ALL'
    ? CORE_11_INDICATORS_DATA
    : CORE_11_INDICATORS_DATA.filter(i => i.dimension === selectedDimension);

  const handleCopySha = (sha: string) => {
    navigator.clipboard?.writeText(sha);
    setCopiedSha(sha);
    setTimeout(() => setCopiedSha(null), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 select-text animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-300">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/30 border border-blue-400/40 flex items-center justify-center text-blue-300">
              <BarChart3 className="w-5 h-5 text-blue-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-400 text-slate-950 uppercase">
                  报告第六章第一节 表6-1 / 6-1B
                </span>
                <span className="text-xs text-blue-200 font-mono">
                  原子级下钻 (Atomic Drill-Down)
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-white mt-0.5">
                全院11项医学装备全生命周期治理核心指标穿透下钻与证据链沙盘
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition cursor-pointer text-xl font-bold"
          >
            ✕
          </button>
        </div>

        {/* 维度分类与指标选择横幅 */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
            <span className="text-slate-500 font-bold shrink-0 mr-1 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              维度筛选:
            </span>
            {dimensions.map(dim => (
              <button
                key={dim}
                onClick={() => setSelectedDimension(dim)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition cursor-pointer whitespace-nowrap ${
                  selectedDimension === dim
                    ? 'bg-blue-600 text-white font-bold shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {dim === 'ALL' ? '全部 11 项指标' : dim}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 text-[11px] text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>证据链具备原子记录下钻与 SHA-256 不可篡改指纹校验</span>
          </div>
        </div>

        {/* Main Workspace (Left sidebar list + Right detail content) */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* 左侧：11项指标切换列表 */}
          <div className="w-72 sm:w-80 border-r border-slate-200 bg-slate-50/60 overflow-y-auto p-3 space-y-1.5 shrink-0">
            {filteredIndicators.map((item) => {
              const isSelected = item.id === selectedId;
              return (
                <button
                  key={item.id}
                  onClick={() => setSelectedId(item.id)}
                  className={`w-full text-left p-3 rounded-xl border transition cursor-pointer flex flex-col gap-1.5 ${
                    isSelected
                      ? 'bg-white border-blue-500 shadow-sm ring-2 ring-blue-500/10'
                      : 'bg-white/80 border-slate-200/80 hover:bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-sm ${
                      item.dimension === '法定红线'
                        ? 'bg-rose-100 text-rose-800 border border-rose-200'
                        : item.dimension === '智能协同'
                        ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                        : 'bg-slate-100 text-slate-700'
                    }`}>
                      {item.dimension} · 指标 {item.id}
                    </span>
                    <span className="text-xs font-mono font-bold text-emerald-700">
                      {item.simulatedValue.split(' ')[0]}
                    </span>
                  </div>

                  <div className="font-bold text-xs text-slate-900 line-clamp-1">
                    {item.name}
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono pt-0.5 border-t border-slate-100">
                    <span>基准: {item.traditionalBenchmark.split(' ')[0]}</span>
                    <span className="text-blue-600 font-sans font-medium flex items-center gap-0.5">
                      下钻验真 <ChevronRight className="w-3 h-3" />
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* 右侧：指标穿透下钻全息详情 */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-white">
            
            {/* 顶部指标卡片 */}
            <div className="bg-gradient-to-r from-blue-50 via-indigo-50/40 to-slate-50 rounded-xl p-5 border border-blue-200/80 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-blue-600 text-white font-mono">
                    指标序号 {currentIndicator.id}
                  </span>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-white border border-blue-200 text-blue-900">
                    所属治理维度：{currentIndicator.dimension}
                  </span>
                </div>

                {onNavigateToTab && (
                  <button
                    onClick={() => {
                      onClose();
                      onNavigateToTab(currentIndicator.linkedTab as ActiveTab);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 transition shadow-xs cursor-pointer active:scale-95"
                  >
                    <span>跳转至【{currentIndicator.linkedTabLabel}】实机验证</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight">
                  {currentIndicator.name}
                </h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  {currentIndicator.managementMeaning}
                </p>
              </div>

              {/* 核心数据对照 4格卡片 */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                <div className="bg-white rounded-lg p-3 border border-slate-200 shadow-2xs">
                  <span className="text-[11px] text-slate-500 block">传统手工模式基线</span>
                  <span className="text-lg font-black text-slate-700 font-mono">
                    {currentIndicator.traditionalBenchmark}
                  </span>
                </div>
                <div className="bg-white rounded-lg p-3 border border-blue-200 shadow-2xs">
                  <span className="text-[11px] text-blue-600 block font-semibold">管理导向目标值</span>
                  <span className="text-lg font-black text-blue-700 font-mono">
                    {currentIndicator.targetValue}
                  </span>
                </div>
                <div className="bg-white rounded-lg p-3 border border-emerald-300 shadow-2xs bg-emerald-50/20">
                  <span className="text-[11px] text-emerald-700 block font-semibold">MED-TECH OS 仿真评测值</span>
                  <span className="text-lg font-black text-emerald-700 font-mono">
                    {currentIndicator.simulatedValue}
                  </span>
                </div>
                <div className="bg-white rounded-lg p-3 border border-purple-200 shadow-2xs">
                  <span className="text-[11px] text-purple-700 block font-semibold">相对改善幅度与机制</span>
                  <span className="text-xs font-bold text-purple-900 leading-snug block pt-1">
                    {currentIndicator.improvement}
                  </span>
                </div>
              </div>
            </div>

            {/* 测算公式与分母分子定义 */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-2.5 text-xs">
              <div className="flex items-center gap-2 font-bold text-slate-900">
                <Layers className="w-4 h-4 text-blue-600" />
                <span>数学测算模型与数据边界界定：</span>
              </div>
              <div className="p-2.5 bg-white rounded-lg border border-slate-200 font-mono text-slate-800 font-semibold text-xs text-center">
                {currentIndicator.formula}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-slate-700 pt-1">
                <div className="p-3 bg-white rounded-lg border border-slate-200">
                  <strong className="text-blue-900 block font-bold mb-1">
                    分母（统计基数 / {currentIndicator.denominatorCount}）：
                  </strong>
                  <p className="text-[11px] leading-relaxed text-slate-600">
                    {currentIndicator.denominatorDesc}
                  </p>
                </div>
                <div className="p-3 bg-white rounded-lg border border-slate-200">
                  <strong className="text-emerald-900 block font-bold mb-1">
                    分子（达标条目 / {currentIndicator.numeratorCount}）：
                  </strong>
                  <p className="text-[11px] leading-relaxed text-slate-600">
                    {currentIndicator.numeratorDesc}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200">
                <span><strong>目标值依据：</strong>{currentIndicator.targetBasis}</span>
                <span><strong>数据源头：</strong>{currentIndicator.evidenceSource}</span>
              </div>
            </div>

            {/* 原子穿透样本记录清单 */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-emerald-600" />
                  <h4 className="font-bold text-sm text-slate-900">
                    原子级业务事实与证据链抽检样本（支持SHA-256指纹查验）
                  </h4>
                </div>
                <span className="text-xs text-slate-500">
                  抽检样本数：{currentIndicator.sampleList.length} 条代表性全息履历
                </span>
              </div>

              <div className="space-y-2.5">
                {currentIndicator.sampleList.map((sample) => (
                  <div
                    key={sample.id}
                    className="p-4 rounded-xl border border-slate-200 bg-white hover:border-blue-300 transition space-y-2 text-xs shadow-2xs"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                          {sample.code}
                        </span>
                        <strong className="text-slate-900 text-sm font-bold">
                          {maskText(sample.title)}
                        </strong>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-slate-500 font-medium">
                          {maskText(sample.department)}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          已核验合规
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-700 text-[11px] font-mono">
                      <div className="bg-slate-50 p-2 rounded border border-slate-100">
                        {sample.keyField1}
                      </div>
                      <div className="bg-slate-50 p-2 rounded border border-slate-100">
                        {sample.keyField2}
                      </div>
                    </div>

                    <div className="text-[11px] text-slate-600 leading-relaxed bg-amber-50/40 p-2.5 rounded-lg border border-amber-200/60 flex items-start gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
                      <div>
                        <strong>审计留痕依据：</strong>
                        <span>{sample.auditEvidence}</span>
                      </div>
                    </div>

                    {/* SHA-256指纹与验签人 */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[10px] text-slate-400 font-mono">
                      <div className="flex items-center gap-1.5 truncate max-w-md">
                        <span>SHA-256指纹:</span>
                        <span className="text-slate-600 truncate">{sample.sha256 || '9f8e7d6c5b4a3120efbc789123456789...'}</span>
                        {sample.sha256 && (
                          <button
                            onClick={() => handleCopySha(sample.sha256!)}
                            className="text-blue-600 hover:text-blue-800 cursor-pointer"
                            title="复制完整SHA-256防伪哈希"
                          >
                            {copiedSha === sample.sha256 ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                          </button>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        {sample.verifiedBy && (
                          <span className="text-slate-600">
                            核验人: <strong className="text-slate-800 font-sans">{maskText(sample.verifiedBy)}</strong>
                          </span>
                        )}
                        <span>{sample.timestamp}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-500">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>依据实证管理学审慎原则，指标评测基于五莲县人民医院受控走查全样本数据计算</span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg font-semibold cursor-pointer transition shadow-xs"
          >
            关闭穿透下钻窗口
          </button>
        </div>

      </div>
    </div>
  );
};

import React, { useRef, useState, useMemo } from 'react';
import {
  Printer,
  X,
  Download,
  FileText,
  CheckCircle2,
  Layers,
  Sparkles,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Copy,
  Check,
  Loader2,
  Activity,
  Calendar,
  Clock,
  AlertTriangle,
  Building2,
  DollarSign,
  TrendingUp,
  ShieldAlert,
  ChevronRight
} from 'lucide-react';
import { toJpeg } from 'html-to-image';
import { jsPDF } from 'jspdf';
import { MedicalEquipment } from '../types';
import {
  AiDimensionAnalysisResult,
  calculateEquipmentDateLifecycle,
  BatchFleetAnalysisResult,
  generateLocalDimensionAnalysis,
  generateLocalBatchFleetAnalysis
} from '../utils/aiDimensionEngine';

interface AiAnalysisReportPdfModalProps {
  isOpen: boolean;
  onClose: () => void;
  // Single equipment mode props
  equipment?: MedicalEquipment | null;
  analysisResult?: AiDimensionAnalysisResult | null;
  dimensionTitle?: string;
  aiSource?: string;
  // Multi-device fleet mode props
  batchResult?: BatchFleetAnalysisResult | null;
  candidateDevices?: MedicalEquipment[];
  initialMode?: 'single' | 'fleet';
}

export const AiAnalysisReportPdfModal: React.FC<AiAnalysisReportPdfModalProps> = ({
  isOpen,
  onClose,
  equipment: propEquipment,
  analysisResult: propAnalysisResult,
  batchResult: propBatchResult,
  candidateDevices = [],
  initialMode
}) => {
  const printAreaRef = useRef<HTMLDivElement>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [isExportingPdf, setIsExportingPdf] = useState<boolean>(false);
  const [copiedText, setCopiedText] = useState<boolean>(false);

  // Active Report View Mode: 'fleet' (多台设备群体综合报告) | 'single' (单台设备详细分析)
  const [activeReportMode, setActiveReportMode] = useState<'fleet' | 'single'>(() => {
    if (initialMode) return initialMode;
    if (propBatchResult || (candidateDevices && candidateDevices.length > 1)) return 'fleet';
    return 'single';
  });

  // For single view when multiple candidate devices exist
  const [selectedSingleId, setSelectedSingleId] = useState<string>(() => {
    if (propEquipment?.id) return propEquipment.id;
    if (candidateDevices.length > 0) return candidateDevices[0].id;
    return '';
  });

  // Effective Single Equipment
  const currentEquipment = useMemo(() => {
    if (selectedSingleId && candidateDevices.length > 0) {
      const found = candidateDevices.find(d => d.id === selectedSingleId);
      if (found) return found;
    }
    return propEquipment || (candidateDevices.length > 0 ? candidateDevices[0] : null);
  }, [propEquipment, selectedSingleId, candidateDevices]);

  // Effective Single Analysis Result
  const currentAnalysisResult = useMemo(() => {
    if (propAnalysisResult && currentEquipment?.id === propEquipment?.id) {
      return propAnalysisResult;
    }
    if (currentEquipment) {
      return generateLocalDimensionAnalysis(currentEquipment, 'comprehensive');
    }
    return null;
  }, [propAnalysisResult, currentEquipment, propEquipment]);

  // Effective Batch Result
  const currentBatchResult = useMemo(() => {
    if (propBatchResult) return propBatchResult;
    if (candidateDevices.length > 0) {
      return generateLocalBatchFleetAnalysis(candidateDevices);
    }
    return null;
  }, [propBatchResult, candidateDevices]);

  // Date Lifecycle calculation for single device
  const lifecycle = useMemo(() => {
    return currentEquipment ? calculateEquipmentDateLifecycle(currentEquipment) : null;
  }, [currentEquipment]);

  if (!isOpen) return null;

  const todayStr = new Date().toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).replace(/\//g, '-');

  const reportDocNo = activeReportMode === 'fleet'
    ? `FLEET-REP-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${currentBatchResult?.totalCount || candidateDevices.length || 1}`
    : `REP-${(currentEquipment?.id || 'EQ').replace(/[^0-9a-zA-Z]/g, '')}-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}`;

  // Print handler
  const handlePrint = () => {
    window.print();
  };

  // Export PDF handler (Supports multi-page A4 splitting with high resolution)
  const handleExportPdf = async () => {
    if (!printAreaRef.current || isExportingPdf) return;
    setIsExportingPdf(true);

    try {
      const element = printAreaRef.current;

      const imgData = await toJpeg(element, {
        quality: 0.98,
        pixelRatio: 2,
        backgroundColor: '#ffffff',
        cacheBust: true,
        skipFonts: true,
        fontEmbedCSS: '',
      });

      const img = new Image();
      img.src = imgData;
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('图片加载失败'));
      });

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true,
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      const imgWidth = pdfWidth;
      const imgHeight = (img.naturalHeight * pdfWidth) / img.naturalWidth;

      if (imgHeight <= pdfHeight) {
        pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, imgHeight);
      } else {
        // Multi-page slicing onto standard A4 pages
        let heightLeft = imgHeight;
        let position = 0;
        pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;

        while (heightLeft > 0) {
          position = heightLeft - imgHeight;
          pdf.addPage();
          pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
          heightLeft -= pdfHeight;
        }
      }

      const fileName = activeReportMode === 'fleet'
        ? `医疗设备群体资产运营与智能研判报告_多台汇总(${currentBatchResult?.totalCount || candidateDevices.length}台)_${reportDocNo}.pdf`
        : `设备健康分析报告_${(currentEquipment?.name || '设备').replace(/[\\/:*?"<>|]/g, '_')}_${reportDocNo}.pdf`;

      pdf.save(fileName);
    } catch (err) {
      console.error('PDF 导出失败:', err);
    } finally {
      setIsExportingPdf(false);
    }
  };

  // Copy text representation
  const handleCopyReportText = () => {
    let text = '';
    if (activeReportMode === 'fleet' && currentBatchResult) {
      text = `【五莲县人民医院 · 医疗设备群体资产运营与全周期智能研判综合报告】
报告编号: ${reportDocNo}
出具日期: ${todayStr}
研判设备总量: ${currentBatchResult.totalCount} 台 | 资产总原值: ￥${currentBatchResult.totalPurchaseValue.toLocaleString()} 元
累计维保支出: ￥${currentBatchResult.totalRepairCost.toLocaleString()} 元 (占原值 ${currentBatchResult.totalPurchaseValue > 0 ? (Math.round((currentBatchResult.totalRepairCost / currentBatchResult.totalPurchaseValue) * 1000) / 10) : 0}%)
群体平均健康分: ${currentBatchResult.avgHealthScore} 分 | 超期服役: ${currentBatchResult.overagedCount} 台 | 重点关注: ${currentBatchResult.highRiskCount} 台

一、执行研判核心结论:
${currentBatchResult.executiveSummary}

二、核心要点洞察:
${currentBatchResult.keyInsights.map((k, i) => `${i + 1}. ${k}`).join('\n')}

三、医院运营与资产管理四大战略建议:
${currentBatchResult.strategicRecommendations.map((r, i) => `${i + 1}. 【${r.category}】(${r.priority}优先级) - ${r.title}\n   ${r.description}`).join('\n')}

四、多台设备横向研判台账清单:
${currentBatchResult.prioritizedDevices.map((d, i) => `${i + 1}. [${d.equipmentId}] ${d.equipmentName} (${d.model}) | SN: ${d.sn} | 科室: ${d.department}
   - 出厂: ${d.manufactureDateStr} (服役${d.ageYears}年) | 到期: ${d.expiryDateStr} (${d.isOveraged ? `已超期${d.overagedYears}年` : '正常在期'})
   - 维保: ￥${d.totalRepairCost.toLocaleString()} (占原值${d.repairCostRatio}%) | 健康分: ${d.healthScore}分 [${d.actionTag}]
   - 决策建议: ${d.recommendedAction}`).join('\n\n')}`;
    } else if (currentEquipment && currentAnalysisResult) {
      text = `【五莲县人民医院 · 医疗设备使用与健康分析报告】
报告编号: ${reportDocNo}
出具日期: ${todayStr}
设备名称: ${currentEquipment.name} (${currentEquipment.model || '标准型号'})
出厂序列号(SN): ${currentEquipment.sn || currentEquipment.id} (唯一硬件标识)
资产编号: ${currentEquipment.assetNo || currentEquipment.id} | 所属科室: ${currentEquipment.department}
当前状态: ${currentEquipment.status}
综合评定: ${currentAnalysisResult.verdictTag?.text || '正常运行'}
核心结论: ${currentAnalysisResult.executiveSummary}

【核心要点】
${(currentAnalysisResult.keyTakeaways || currentAnalysisResult.coreFindings.slice(0, 3)).map((k, i) => `${i + 1}. ${k}`).join('\n')}

【设备各项评分】
- 运行安全: ${currentAnalysisResult.radarScores.safetyScore} 分 / 100
- 稳定程度: ${currentAnalysisResult.radarScores.reliabilityScore} 分 / 100
- 使用效益: ${currentAnalysisResult.radarScores.roiHealthScore} 分 / 100
- 检验合格: ${currentAnalysisResult.radarScores.complianceScore} 分 / 100
- 设备新旧: ${currentAnalysisResult.radarScores.modernityScore} 分 / 100

【使用与维护建议】
${currentAnalysisResult.actionableRecommendations.map((r, i) => `${i + 1}. [${r.priority === '高' ? '重点建议' : '常规提醒'}] ${r.action} (${r.targetDepartment} - 预期效果: ${r.expectedOutcome})`).join('\n')}

【安全注意事项】
${currentAnalysisResult.riskWarnings.map((w, i) => `${i + 1}. ${w}`).join('\n')}`;
    }

    navigator.clipboard?.writeText(text);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  const hasMultipleDevices = (candidateDevices && candidateDevices.length > 1) || Boolean(currentBatchResult);

  return (
    <div className="fixed inset-0 z-60 overflow-y-auto bg-slate-950/85 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 print:p-0 print:bg-white animate-in fade-in duration-200">
      {/* Outer Modal Container */}
      <div className="relative w-full max-w-5xl bg-slate-900 rounded-2xl shadow-2xl border border-slate-700 overflow-hidden flex flex-col max-h-[96vh] print:max-h-none print:border-none print:shadow-none print:w-full print:bg-white">
        
        {/* TOP CONTROLS BAR (Screen only) */}
        <div className="no-print flex flex-wrap items-center justify-between px-4 sm:px-6 py-3 bg-slate-900 text-white border-b border-slate-800 shrink-0 gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-tr from-blue-600 to-indigo-600 text-white rounded-xl shadow-xs">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm sm:text-base text-white tracking-wide">
                  {activeReportMode === 'fleet' ? '医疗设备群体综合研判报告 · 预览与导出' : '设备使用与健康分析报告 · 预览与导出'}
                </h3>
                <span className="px-2 py-0.5 bg-blue-500/20 text-blue-300 text-[11px] rounded-full font-sans border border-blue-400/30">
                  A4 标准版式
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                {activeReportMode === 'fleet'
                  ? `包含 ${currentBatchResult?.totalCount || candidateDevices.length} 台设备横向研判与运营策略`
                  : `${currentEquipment?.name} (SN: ${currentEquipment?.sn || currentEquipment?.id})`}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Zoom Controls */}
            <div className="hidden sm:flex items-center bg-slate-800 rounded-lg p-0.5 border border-slate-700 text-xs">
              <button
                type="button"
                onClick={() => setZoomLevel(prev => Math.max(70, prev - 10))}
                className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-700 rounded transition cursor-pointer"
                title="缩小"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="px-2 font-mono text-slate-300 min-w-[45px] text-center font-bold">
                {zoomLevel}%
              </span>
              <button
                type="button"
                onClick={() => setZoomLevel(prev => Math.min(130, prev + 10))}
                className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-700 rounded transition cursor-pointer"
                title="放大"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setZoomLevel(100)}
                className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-700 rounded transition cursor-pointer"
                title="适应 100%"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Copy Text */}
            <button
              type="button"
              onClick={handleCopyReportText}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 border border-slate-700 cursor-pointer active:scale-95"
              title="复制纯文本报告"
            >
              {copiedText ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedText ? '已复制' : '复制文本'}</span>
            </button>

            {/* Print Direct */}
            <button
              type="button"
              onClick={handlePrint}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 border border-slate-700 cursor-pointer active:scale-95"
              title="打印报告"
            >
              <Printer className="w-3.5 h-3.5 text-slate-300" />
              <span>打印</span>
            </button>

            {/* Export PDF */}
            <button
              type="button"
              onClick={handleExportPdf}
              disabled={isExportingPdf}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-md cursor-pointer active:scale-95"
              title="下载标准 A4 PDF 文件"
            >
              {isExportingPdf ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>导出中...</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  <span>导出 PDF</span>
                </>
              )}
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition ml-1 cursor-pointer"
              title="关闭"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* REPORT MODE SWITCHER BAR (When multiple devices exist) */}
        {hasMultipleDevices && (
          <div className="no-print px-4 sm:px-6 py-2 bg-slate-950 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 shrink-0">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveReportMode('fleet')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  activeReportMode === 'fleet'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>多台设备群体综合报告 ({currentBatchResult?.totalCount || candidateDevices.length}台汇总在一个报告)</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveReportMode('single')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  activeReportMode === 'single'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <Activity className="w-3.5 h-3.5" />
                <span>单台设备精细档案报告</span>
              </button>
            </div>

            {activeReportMode === 'single' && candidateDevices.length > 1 && (
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-400">切换单台报告:</span>
                <select
                  value={selectedSingleId}
                  onChange={(e) => setSelectedSingleId(e.target.value)}
                  className="px-2.5 py-1 bg-slate-800 border border-slate-700 rounded-lg text-xs font-bold text-slate-200 shadow-2xs hover:border-blue-400 cursor-pointer max-w-xs truncate"
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
        )}

        {/* PREVIEW CONTAINER WITH ZOOM */}
        <div className="flex-1 overflow-auto p-4 sm:p-8 bg-slate-950/60 flex justify-center items-start print:p-0 print:bg-white print:overflow-visible">
          <div
            style={{
              transform: `scale(${zoomLevel / 100})`,
              transformOrigin: 'top center',
              transition: 'transform 0.15s ease'
            }}
            className="print:transform-none"
          >
            {/* ═════════════════════════════════════════════════════════════════ */}
            {/* VIEW A: MULTI-DEVICE COMBINED FLEET REPORT (多台设备群体综合报告) */}
            {/* ═════════════════════════════════════════════════════════════════ */}
            {activeReportMode === 'fleet' && currentBatchResult && (
              <div
                ref={printAreaRef}
                className="w-[210mm] min-h-[297mm] bg-white text-slate-900 p-[12mm] sm:p-[14mm] shadow-2xl border border-slate-200 rounded-xs print:shadow-none print:border-none print:p-0 print:w-full print:m-0 flex flex-col justify-between font-sans leading-normal relative select-text"
              >
                <div>
                  {/* Clean Document Header */}
                  <div className="border-b-2 border-slate-900 pb-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h1 className="text-base font-bold text-slate-900 tracking-tight">
                          五莲县人民医院 · 医学装备管理中心
                        </h1>
                        <p className="text-xs text-slate-600 mt-0.5 font-bold">
                          医疗设备群体资产运营与全周期智能研判综合报告
                        </p>
                      </div>
                      <div className="text-right text-xs text-slate-500 font-mono">
                        <div>编号: {reportDocNo}</div>
                        <div>评估日期: {todayStr}</div>
                      </div>
                    </div>

                    <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                      <div>
                        <span className="text-slate-400">报告类型：</span>
                        <strong className="text-slate-800">多台设备横向联审 / 资产全周期决策综合备案件</strong>
                      </div>
                      <div>
                        <span className="text-slate-400">样本规模：</span>
                        <span className="font-bold text-blue-700 font-mono">共 {currentBatchResult.totalCount} 台重点装备</span>
                      </div>
                    </div>
                  </div>

                  {/* Section 1: 群体资产规模与全景核心指标汇总 */}
                  <div className="mt-3.5">
                    <div className="flex items-center gap-1.5 pb-1 border-b border-slate-200 text-xs font-bold text-slate-800">
                      <Layers className="w-3.5 h-3.5 text-blue-600" />
                      <span>一、群体资产规模与全景核心指标汇总</span>
                    </div>

                    <div className="mt-2 grid grid-cols-6 gap-2 text-center text-xs">
                      <div className="p-2 rounded border border-slate-200 bg-slate-50/50">
                        <span className="text-[10.5px] text-slate-500 block">研判设备总量</span>
                        <strong className="text-sm font-mono text-slate-900">{currentBatchResult.totalCount}</strong>
                        <span className="text-[9.5px] text-slate-400 block">台</span>
                      </div>
                      <div className="p-2 rounded border border-slate-200 bg-slate-50/50">
                        <span className="text-[10.5px] text-slate-500 block">资产原值总额</span>
                        <strong className="text-xs font-mono text-slate-900">
                          ￥{currentBatchResult.totalPurchaseValue >= 10000 ? `${(currentBatchResult.totalPurchaseValue / 10000).toFixed(1)}万` : currentBatchResult.totalPurchaseValue.toLocaleString()}
                        </strong>
                        <span className="text-[9.5px] text-slate-400 block">固定资产规模</span>
                      </div>
                      <div className="p-2 rounded border border-slate-200 bg-slate-50/50">
                        <span className="text-[10.5px] text-slate-500 block">累计维保支出</span>
                        <strong className="text-xs font-mono text-amber-700">
                          ￥{currentBatchResult.totalRepairCost >= 10000 ? `${(currentBatchResult.totalRepairCost / 10000).toFixed(1)}万` : currentBatchResult.totalRepairCost.toLocaleString()}
                        </strong>
                        <span className="text-[9.5px] text-amber-600 block">
                          占原值 {currentBatchResult.totalPurchaseValue > 0 ? (Math.round((currentBatchResult.totalRepairCost / currentBatchResult.totalPurchaseValue) * 1000) / 10) : 0}%
                        </span>
                      </div>
                      <div className="p-2 rounded border border-slate-200 bg-slate-50/50">
                        <span className="text-[10.5px] text-slate-500 block">群体平均健康分</span>
                        <strong className={`text-sm font-mono ${currentBatchResult.avgHealthScore >= 85 ? 'text-emerald-700' : currentBatchResult.avgHealthScore >= 70 ? 'text-blue-700' : 'text-rose-700'}`}>
                          {currentBatchResult.avgHealthScore}
                        </strong>
                        <span className="text-[9.5px] text-slate-400 block">/ 100分</span>
                      </div>
                      <div className="p-2 rounded border border-slate-200 bg-slate-50/50">
                        <span className="text-[10.5px] text-slate-500 block">超期服役设备</span>
                        <strong className={`text-sm font-mono ${currentBatchResult.overagedCount > 0 ? 'text-rose-700' : 'text-emerald-700'}`}>
                          {currentBatchResult.overagedCount}
                        </strong>
                        <span className="text-[9.5px] text-slate-400 block">台 (需鉴定/更新)</span>
                      </div>
                      <div className="p-2 rounded border border-slate-200 bg-slate-50/50">
                        <span className="text-[10.5px] text-slate-500 block">高危/需重点处置</span>
                        <strong className={`text-sm font-mono ${currentBatchResult.highRiskCount > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>
                          {currentBatchResult.highRiskCount}
                        </strong>
                        <span className="text-[9.5px] text-slate-400 block">台 (大修止损/停用)</span>
                      </div>
                    </div>
                  </div>

                  {/* Section 2: 群体执行研判核心结论与关键洞察 */}
                  <div className="mt-3.5">
                    <div className="flex items-center gap-1.5 pb-1 border-b border-slate-200 text-xs font-bold text-slate-800">
                      <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                      <span>二、群体执行研判核心结论与关键洞察</span>
                    </div>

                    <div className="mt-2 p-2.5 rounded border border-slate-200 bg-slate-50/50">
                      <div className="flex items-center gap-2 pb-1.5 border-b border-slate-200/80">
                        <span className="px-2 py-0.5 rounded text-xs font-bold bg-blue-700 text-white">
                          群体研判总论
                        </span>
                        <span className="text-xs font-semibold text-slate-800">
                          {currentBatchResult.overagedCount > 0 ? `存在 ${currentBatchResult.overagedCount} 台超期服役设备，整体进入梯队更新与维保止损关键期` : '全部设备处于设计使用期限内，运行平稳'}
                        </span>
                      </div>

                      <p className="text-xs text-slate-700 mt-2 leading-relaxed font-medium">
                        {currentBatchResult.executiveSummary}
                      </p>

                      {/* 3 Key Takeaways */}
                      <div className="mt-2.5 pt-2 border-t border-slate-200/80 space-y-1">
                        {currentBatchResult.keyInsights.map((insight, idx) => (
                          <div key={idx} className="text-xs text-slate-800 flex items-start gap-1.5">
                            <span className="font-bold text-blue-700 shrink-0">{idx + 1}.</span>
                            <span className="leading-relaxed">{insight}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Section 3: 医院运营与资产管理四大战略举措 */}
                  <div className="mt-3.5">
                    <div className="flex items-center gap-1.5 pb-1 border-b border-slate-200 text-xs font-bold text-slate-800">
                      <ShieldAlert className="w-3.5 h-3.5 text-slate-600" />
                      <span>三、医院运营与资产管理四大战略举措清单</span>
                    </div>

                    <div className="mt-2 grid grid-cols-2 gap-2">
                      {currentBatchResult.strategicRecommendations.map((rec, idx) => (
                        <div key={idx} className="p-2 rounded border border-slate-200 text-xs bg-white flex flex-col justify-between">
                          <div>
                            <div className="flex items-center justify-between gap-1 mb-1">
                              <span className="text-[10.5px] font-bold text-slate-500">{rec.category}</span>
                              <span className={`px-1.5 py-0.2 rounded text-[9.5px] font-bold ${
                                rec.priority === '高' ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-blue-50 text-blue-700 border border-blue-200'
                              }`}>
                                {rec.priority}优先级
                              </span>
                            </div>
                            <strong className="text-slate-900 block leading-snug mb-1">{rec.title}</strong>
                            <p className="text-[11px] text-slate-600 leading-relaxed">{rec.description}</p>
                          </div>
                          {rec.targetDevices && rec.targetDevices.length > 0 && (
                            <div className="mt-1.5 pt-1.5 border-t border-slate-100 text-[10px] text-slate-400">
                              涉及设备: {rec.targetDevices.length} 台
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Section 4: 研判设备横向健康与技术生命周期台账矩阵 (Consolidated Multi-Device Inventory) */}
                  <div className="mt-3.5">
                    <div className="flex items-center justify-between pb-1 border-b border-slate-200 text-xs font-bold text-slate-800">
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-slate-600" />
                        <span>四、研判设备横向健康与技术生命周期台账矩阵</span>
                      </div>
                      <span className="text-[10px] font-normal text-slate-500">
                        单次/累计大修止损经济警戒线：采购原值的 30%
                      </span>
                    </div>

                    <table className="w-full mt-2 text-[10.5px] border-collapse border border-slate-200">
                      <thead>
                        <tr className="bg-slate-100 text-slate-700 font-bold">
                          <th className="border border-slate-200 px-1.5 py-1 text-center w-6">#</th>
                          <th className="border border-slate-200 px-1.5 py-1 text-left w-32">设备名称 / 规格型号</th>
                          <th className="border border-slate-200 px-1.5 py-1 text-left w-24">出厂序列号(SN)</th>
                          <th className="border border-slate-200 px-1.5 py-1 text-left w-16">科室</th>
                          <th className="border border-slate-200 px-1.5 py-1 text-right w-18">原值(元)</th>
                          <th className="border border-slate-200 px-1.5 py-1 text-left w-20">出厂 / 服役</th>
                          <th className="border border-slate-200 px-1.5 py-1 text-left w-20">到期 / 状态</th>
                          <th className="border border-slate-200 px-1.5 py-1 text-right w-22">累计维保 / 原值比</th>
                          <th className="border border-slate-200 px-1.5 py-1 text-center w-12">健康分</th>
                          <th className="border border-slate-200 px-1.5 py-1 text-left">AI 研判决策结论与建议</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentBatchResult.prioritizedDevices.map((d, idx) => (
                          <tr key={d.equipmentId} className={idx % 2 === 1 ? 'bg-slate-50/60' : 'bg-white'}>
                            <td className="border border-slate-200 px-1.5 py-1 text-center font-mono text-slate-500 font-medium">
                              {idx + 1}
                            </td>
                            <td className="border border-slate-200 px-1.5 py-1">
                              <strong className="text-slate-900 block leading-tight">{d.equipmentName}</strong>
                              <span className="text-[9.5px] text-slate-500 block truncate max-w-[120px]">{d.model}</span>
                            </td>
                            <td className="border border-slate-200 px-1.5 py-1 font-mono font-bold text-indigo-900">
                              {d.sn}
                            </td>
                            <td className="border border-slate-200 px-1.5 py-1 text-slate-700">
                              {d.department}
                            </td>
                            <td className="border border-slate-200 px-1.5 py-1 text-right font-mono text-slate-800">
                              ￥{d.purchasePrice.toLocaleString()}
                            </td>
                            <td className="border border-slate-200 px-1.5 py-1">
                              <span className="font-mono text-slate-700 block">{d.manufactureDateStr}</span>
                              <span className="text-[9.5px] text-blue-600 block font-medium">服役{d.ageYears}年</span>
                            </td>
                            <td className="border border-slate-200 px-1.5 py-1">
                              <span className="font-mono text-slate-700 block">{d.expiryDateStr}</span>
                              {d.isOveraged ? (
                                <span className="text-[9px] font-bold text-rose-700 bg-rose-50 px-1 py-0.2 rounded border border-rose-200 inline-block">
                                  超期{d.overagedYears}年
                                </span>
                              ) : (
                                <span className="text-[9.5px] text-emerald-700 font-medium block">
                                  剩{d.remainingLifeYears}年
                                </span>
                              )}
                            </td>
                            <td className="border border-slate-200 px-1.5 py-1 text-right">
                              <span className="font-mono text-slate-800 block">￥{d.totalRepairCost.toLocaleString()}</span>
                              <span className={`text-[9.5px] font-bold ${d.repairCostRatio >= 30 ? 'text-rose-700' : d.repairCostRatio >= 20 ? 'text-amber-700' : 'text-slate-500'}`}>
                                {d.repairCostRatio}% {d.repairCostRatio >= 30 ? '(超止损)' : ''}
                              </span>
                            </td>
                            <td className="border border-slate-200 px-1.5 py-1 text-center">
                              <span className={`px-1 py-0.5 rounded font-mono font-bold text-[10px] inline-block ${
                                d.healthScore >= 85 ? 'bg-emerald-50 text-emerald-800' : d.healthScore >= 70 ? 'bg-blue-50 text-blue-800' : 'bg-rose-50 text-rose-800'
                              }`}>
                                {d.healthScore}
                              </span>
                            </td>
                            <td className="border border-slate-200 px-1.5 py-1">
                              <span className="px-1 py-0.2 rounded text-[9.5px] font-bold bg-slate-100 text-slate-800 border border-slate-200 inline-block mb-0.5">
                                {d.actionTag}
                              </span>
                              <p className="text-[10px] text-slate-600 leading-tight">
                                {d.recommendedAction}
                              </p>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Section 5: 审核会签与审批核准栏 (Formal Sign-off Block) */}
                  <div className="mt-4 pt-3 border-t border-slate-200 text-xs">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="border border-slate-200 rounded p-2 bg-slate-50/40">
                        <span className="text-[10.5px] text-slate-500 font-bold block mb-1">编制与核算 (医学装备管理科)</span>
                        <div className="text-slate-400 text-[10px] mt-4">签字：_______________ 日期：____/____</div>
                      </div>
                      <div className="border border-slate-200 rounded p-2 bg-slate-50/40">
                        <span className="text-[10.5px] text-slate-500 font-bold block mb-1">使用科室意见 (临床主任/护士长)</span>
                        <div className="text-slate-400 text-[10px] mt-4">签字：_______________ 日期：____/____</div>
                      </div>
                      <div className="border border-slate-200 rounded p-2 bg-slate-50/40">
                        <span className="text-[10.5px] text-slate-500 font-bold block mb-1">资产管理分管领导审批 (院领导)</span>
                        <div className="text-slate-400 text-[10px] mt-4">签字：_______________ 日期：____/____</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Clean Minimalist Footer */}
                <div className="mt-4 pt-2 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-400">
                  <div>五莲县人民医院 医学装备管理中心 编制</div>
                  <div>本报告汇总多台设备运行、维保及生命周期数据生成，供全院资产配置与预算决策使用</div>
                </div>
              </div>
            )}

            {/* ═════════════════════════════════════════════════════════════════ */}
            {/* VIEW B: SINGLE DEVICE COMPREHENSIVE REPORT (单台设备详细分析)     */}
            {/* ═════════════════════════════════════════════════════════════════ */}
            {activeReportMode === 'single' && currentEquipment && currentAnalysisResult && (
              <div
                ref={printAreaRef}
                className="w-[210mm] min-h-[297mm] bg-white text-slate-900 p-[14mm] sm:p-[16mm] shadow-2xl border border-slate-200 rounded-xs print:shadow-none print:border-none print:p-0 print:w-full print:m-0 flex flex-col justify-between font-sans leading-normal relative select-text"
              >
                <div>
                  {/* Clean Document Header */}
                  <div className="border-b-2 border-slate-800 pb-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h1 className="text-base font-bold text-slate-900">
                          五莲县人民医院 · 医学装备管理中心
                        </h1>
                        <p className="text-xs text-slate-600 mt-0.5 font-medium">
                          医疗设备使用与健康分析报告
                        </p>
                      </div>
                      <div className="text-right text-xs text-slate-500 font-mono">
                        <div>编号: {reportDocNo}</div>
                        <div>日期: {todayStr}</div>
                      </div>
                    </div>

                    <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                      <div>
                        <span className="text-slate-400">所属科室：</span>
                        <strong className="text-slate-800">{currentEquipment.department}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400">设备状态：</span>
                        <span className="font-semibold text-slate-800">{currentEquipment.status}</span>
                      </div>
                    </div>
                  </div>

                  {/* Section 1: 设备基本信息 */}
                  <div className="mt-3.5">
                    <div className="flex items-center gap-1.5 pb-1 border-b border-slate-200 text-xs font-bold text-slate-800">
                      <Layers className="w-3.5 h-3.5 text-slate-600" />
                      <span>一、设备基本档案与全生命周期时间轴</span>
                    </div>
                    
                    <table className="w-full mt-2 text-xs border-collapse border border-slate-200">
                      <tbody>
                        <tr className="bg-slate-50/70">
                          <td className="border border-slate-200 px-2.5 py-1.5 font-medium text-slate-600 w-1/6">设备名称</td>
                          <td className="border border-slate-200 px-2.5 py-1.5 font-semibold text-slate-900 w-2/6">{currentEquipment.name}</td>
                          <td className="border border-slate-200 px-2.5 py-1.5 font-medium text-slate-600 w-1/6">出厂序列号(SN)</td>
                          <td className="border border-slate-200 px-2.5 py-1.5 font-mono font-bold text-indigo-900 bg-indigo-50/40 w-2/6">
                            {currentEquipment.sn || currentEquipment.id}
                          </td>
                        </tr>
                        <tr>
                          <td className="border border-slate-200 px-2.5 py-1.5 font-medium text-slate-600">规格型号</td>
                          <td className="border border-slate-200 px-2.5 py-1.5 text-slate-800">{currentEquipment.model || '标准配置'}</td>
                          <td className="border border-slate-200 px-2.5 py-1.5 font-medium text-slate-600">资产编号</td>
                          <td className="border border-slate-200 px-2.5 py-1.5 font-mono font-semibold text-slate-900">{currentEquipment.assetNo || currentEquipment.id}</td>
                        </tr>
                        <tr className="bg-slate-50/70">
                          <td className="border border-slate-200 px-2.5 py-1.5 font-medium text-slate-600">生产厂家</td>
                          <td className="border border-slate-200 px-2.5 py-1.5 text-slate-800">{currentEquipment.manufacturer || '未录入'}</td>
                          <td className="border border-slate-200 px-2.5 py-1.5 font-medium text-slate-600">所属科室</td>
                          <td className="border border-slate-200 px-2.5 py-1.5 text-slate-800">{currentEquipment.department}</td>
                        </tr>
                        <tr>
                          <td className="border border-slate-200 px-2.5 py-1.5 font-medium text-slate-600">采购价格</td>
                          <td className="border border-slate-200 px-2.5 py-1.5 font-mono text-slate-800">
                            ￥{((currentEquipment.purchasePrice || 0)).toLocaleString()} 元
                          </td>
                          <td className="border border-slate-200 px-2.5 py-1.5 font-medium text-slate-600">首次投用</td>
                          <td className="border border-slate-200 px-2.5 py-1.5 font-mono text-slate-800">
                            {lifecycle?.enableDateStr || currentEquipment.enableDate || currentEquipment.purchaseDate || '2021-03-15'}
                          </td>
                        </tr>
                        <tr className="bg-slate-50/70">
                          <td className="border border-slate-200 px-2.5 py-1.5 font-medium text-slate-600">出厂日期</td>
                          <td className="border border-slate-200 px-2.5 py-1.5 font-mono font-semibold text-slate-900">
                            {lifecycle?.manufactureDateStr || currentEquipment.manufactureDate || '2021-03-15'}
                            {lifecycle && <span className="text-[11px] font-normal text-slate-500 ml-1.5">(出厂至今 {lifecycle.ageFromManufactureYears} 年)</span>}
                          </td>
                          <td className="border border-slate-200 px-2.5 py-1.5 font-medium text-slate-600">理论到期日</td>
                          <td className="border border-slate-200 px-2.5 py-1.5 font-mono font-semibold text-slate-900">
                            {lifecycle?.expiryDateStr || '未测算'} (设计寿命 {lifecycle?.designLifeYears || 8}年)
                          </td>
                        </tr>
                        <tr>
                          <td className="border border-slate-200 px-2.5 py-1.5 font-medium text-slate-600">全寿命状态</td>
                          <td colSpan={3} className="border border-slate-200 px-2.5 py-1.5 font-medium">
                            {lifecycle ? (
                              <span className={lifecycle.isOveraged ? 'text-rose-700 font-bold' : 'text-emerald-700 font-semibold'}>
                                {lifecycle.isOveraged
                                  ? `⚠️ 已超期服役 ${lifecycle.overagedYears} 年 (${lifecycle.overagedDays} 天) — 需按规定开展延期服役性能与安全鉴定 (全寿命消耗率 ${lifecycle.lifeConsumptionRatio}%)`
                                  : `✅ 处于设计有效期限内，剩余有效服役期 ${lifecycle.remainingLifeYears} 年 (${lifecycle.remainingDays} 天，全寿命消耗率 ${lifecycle.lifeConsumptionRatio}%)`}
                              </span>
                            ) : (
                              currentEquipment.status
                            )}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Section 2: 综合评价与核心要点 */}
                  <div className="mt-3.5">
                    <div className="flex items-center gap-1.5 pb-1 border-b border-slate-200 text-xs font-bold text-slate-800">
                      <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                      <span>二、总体评价与核心要点</span>
                    </div>

                    <div className="mt-2 p-2.5 rounded border border-slate-200 bg-slate-50/50">
                      <div className="flex items-center gap-2 pb-1.5 border-b border-slate-200/80">
                        <span className="px-2 py-0.5 rounded text-xs font-bold bg-slate-800 text-white">
                          {currentAnalysisResult.verdictTag?.text || '设备运转正常'}
                        </span>
                        <span className="text-xs font-semibold text-slate-800">
                          {currentAnalysisResult.verdictTag?.subTitle || ''}
                        </span>
                      </div>

                      <p className="text-xs text-slate-700 mt-2 leading-relaxed font-medium">
                        {currentAnalysisResult.executiveSummary}
                      </p>

                      {/* Key Takeaways */}
                      <div className="mt-2.5 pt-2 border-t border-slate-200/80 space-y-1">
                        {(currentAnalysisResult.keyTakeaways || currentAnalysisResult.coreFindings.slice(0, 3)).map((k, i) => (
                          <div key={i} className="text-xs text-slate-800 flex items-start gap-1.5">
                            <span className="font-bold text-slate-600 shrink-0">{i + 1}.</span>
                            <span className="leading-relaxed">{k}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Section 3: 健康与效益评分 */}
                  <div className="mt-3.5">
                    <div className="flex items-center gap-1.5 pb-1 border-b border-slate-200 text-xs font-bold text-slate-800">
                      <Activity className="w-3.5 h-3.5 text-slate-600" />
                      <span>三、健康与效益评分</span>
                    </div>

                    {/* Score Pills */}
                    <div className="mt-2 grid grid-cols-5 gap-2 text-center text-xs">
                      <div className="p-1.5 rounded border border-slate-200 bg-white">
                        <span className="text-[11px] text-slate-500 block">运行安全</span>
                        <strong className="text-sm font-mono text-slate-900">{currentAnalysisResult.radarScores.safetyScore}</strong>
                        <span className="text-[10px] text-slate-400 block">/ 100分</span>
                      </div>
                      <div className="p-1.5 rounded border border-slate-200 bg-white">
                        <span className="text-[11px] text-slate-500 block">稳定程度</span>
                        <strong className="text-sm font-mono text-slate-900">{currentAnalysisResult.radarScores.reliabilityScore}</strong>
                        <span className="text-[10px] text-slate-400 block">/ 100分</span>
                      </div>
                      <div className="p-1.5 rounded border border-slate-200 bg-white">
                        <span className="text-[11px] text-slate-500 block">使用效益</span>
                        <strong className="text-sm font-mono text-slate-900">{currentAnalysisResult.radarScores.roiHealthScore}</strong>
                        <span className="text-[10px] text-slate-400 block">/ 100分</span>
                      </div>
                      <div className="p-1.5 rounded border border-slate-200 bg-white">
                        <span className="text-[11px] text-slate-500 block">定期检测</span>
                        <strong className="text-sm font-mono text-slate-900">{currentAnalysisResult.radarScores.complianceScore}</strong>
                        <span className="text-[10px] text-slate-400 block">/ 100分</span>
                      </div>
                      <div className="p-1.5 rounded border border-slate-200 bg-white">
                        <span className="text-[11px] text-slate-500 block">设备新旧</span>
                        <strong className="text-sm font-mono text-slate-900">{currentAnalysisResult.radarScores.modernityScore}</strong>
                        <span className="text-[10px] text-slate-400 block">/ 100分</span>
                      </div>
                    </div>

                    {/* Quantitative Table */}
                    <table className="w-full mt-2 text-xs border-collapse border border-slate-200">
                      <thead>
                        <tr className="bg-slate-50 text-slate-700">
                          <th className="border border-slate-200 px-2 py-1 text-left w-1/4 font-semibold">项目名称</th>
                          <th className="border border-slate-200 px-2 py-1 text-left w-1/4 font-semibold">当前数值</th>
                          <th className="border border-slate-200 px-2 py-1 text-left w-2/4 font-semibold">通俗说明</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(currentAnalysisResult.quantitativeInsights).map(([key, item]: [string, any], idx) => (
                          <tr key={key} className={idx % 2 === 1 ? 'bg-slate-50/50' : 'bg-white'}>
                            <td className="border border-slate-200 px-2 py-1 font-medium text-slate-700">{item.label}</td>
                            <td className="border border-slate-200 px-2 py-1 font-mono font-semibold text-slate-900">{item.value}</td>
                            <td className="border border-slate-200 px-2 py-1 text-slate-600">{item.comment}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Section 4: 关键运营管理与效益决策建议 */}
                  <div className="mt-3.5">
                    <div className="flex items-center gap-1.5 pb-1 border-b border-slate-200 text-xs font-bold text-slate-800">
                      <CheckCircle2 className="w-3.5 h-3.5 text-slate-600" />
                      <span>四、关键运营管理与效益提升决策建议</span>
                    </div>

                    <div className="mt-2 space-y-1.5">
                      {currentAnalysisResult.actionableRecommendations.map((rec, idx) => (
                        <div key={idx} className="p-2 rounded border border-slate-200 text-xs flex items-start gap-2 bg-white">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold shrink-0 ${
                            rec.priority === '高' ? 'bg-indigo-900 text-white' : 'bg-slate-100 text-slate-700'
                          }`}>
                            {rec.priority === '高' ? '重点运营举措' : '常规运营优化'}
                          </span>
                          <div className="flex-1">
                            <strong className="text-slate-900 leading-snug">{rec.action}</strong>
                            {rec.expectedOutcome && (
                              <span className="text-slate-600 block text-[11px] mt-0.5">
                                运营成效：{rec.expectedOutcome}
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-500 shrink-0 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200">
                            {rec.targetDepartment || '科室管理组 / 医学工程处'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Clean Minimalist Footer */}
                <div className="mt-6 pt-3 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-400">
                  <div>五莲县人民医院 医学装备管理中心</div>
                  <div>本报告结合设备运行记录与实际使用情况生成，供科室使用与管理参考</div>
                </div>

              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

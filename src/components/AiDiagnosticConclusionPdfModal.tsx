import React, { useRef, useState, useMemo } from 'react';
import {
  Printer,
  X,
  Download,
  FileText,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  Wrench,
  Clock,
  Building2,
  Layers,
  Activity,
  Calendar,
  DollarSign,
  Copy,
  Check,
  Loader2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Cpu,
  History,
  Thermometer,
  Zap,
  Wind
} from 'lucide-react';
import { toJpeg } from 'html-to-image';
import { jsPDF } from 'jspdf';
import { MedicalEquipment } from '../types';
import { AiStructuredDiagnosticResult } from '../utils/aiBiomedicalEngine';
import { 
  generateDiagnosticConclusionReport, 
  StructuredConclusionReport 
} from '../utils/aiConclusionReportEngine';

interface AiDiagnosticConclusionPdfModalProps {
  isOpen: boolean;
  onClose: () => void;
  equipment: MedicalEquipment;
  faultDescription: string;
  diagnosticData?: AiStructuredDiagnosticResult | null;
}

export const AiDiagnosticConclusionPdfModal: React.FC<AiDiagnosticConclusionPdfModalProps> = ({
  isOpen,
  onClose,
  equipment,
  faultDescription,
  diagnosticData
}) => {
  const printAreaRef = useRef<HTMLDivElement>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [isExportingPdf, setIsExportingPdf] = useState<boolean>(false);
  const [copiedText, setCopiedText] = useState<boolean>(false);

  // 生成结构化研判报告数据
  const report: StructuredConclusionReport = useMemo(() => {
    return generateDiagnosticConclusionReport(equipment, faultDescription, diagnosticData);
  }, [equipment, faultDescription, diagnosticData]);

  if (!isOpen) return null;

  // 打印调用
  const handlePrint = () => {
    window.print();
  };

  // 导出 PDF (A4 页面切片与高分辨率导出)
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

      const safeName = (report.equipmentSummary.name || '医疗设备').replace(/[\\/:*?"<>|]/g, '_');
      const fileName = `医疗设备故障AI研判结论书_${safeName}_${report.equipmentSummary.model}_${report.reportDocNo}.pdf`;
      pdf.save(fileName);
    } catch (err) {
      console.error('研判结论书导出 PDF 失败:', err);
      alert('导出 PDF 遇到问题，请检查网络或使用浏览器直接打印保存！');
    } finally {
      setIsExportingPdf(false);
    }
  };

  // 一键复制结构化文本摘要
  const handleCopySummary = () => {
    const text = `【${report.institutionTitle} · 医疗设备故障技术研判与风险评估结论书】
公文编号: ${report.reportDocNo}
出具时间: ${report.generatedTimestamp}

一、设备基础与当前故障
- 目标设备: ${report.equipmentSummary.name} (${report.equipmentSummary.model})
- 资产编号: ${report.equipmentSummary.assetNo} | SN: ${report.equipmentSummary.sn}
- 所属科室: ${report.environment.department} | 安装场所: ${report.environment.usageLocation}
- 投用在役: ${report.equipmentSummary.serviceYears} 年 | 浴盆老化阶段: ${report.equipmentSummary.lifecyclePhase}
- 当前故障现象: ${report.currentFault.rawDescription}
- 报错代码: ${report.currentFault.alarmCodes.join(', ')}
- 涉及模块: ${report.currentFault.affectedModule} | 紧急度: ${report.currentFault.urgencyLevel}

二、运行环境与工况数据
- 所在位置: ${report.environment.building} ${report.environment.floor} (${report.environment.usageLocation})
- 温湿度工况: ${report.environment.tempHumidityRange}
- 医疗电网: ${report.environment.powerGridSpec}
- 负荷工况: ${report.environment.dutyCycle}
- 消杀暴露影响: ${report.environment.disinfectionImpact}

三、过往维修记录统筹
- 历史维修次数: ${report.repairInsight.totalRepairs} 次 | 累计支出: ￥${report.repairInsight.totalCost.toLocaleString()} 元 (占原值 ${report.repairInsight.costRatioPercent}%)
- 曾更换关键配件: ${report.repairInsight.frequentComponents.join('、') || '暂无历史大件更换'}
- 复发性隐患判定: ${report.repairInsight.recurringFailureSummary}
- 平均故障间隔 (MTBF 推演): 约 ${report.repairInsight.mtbfEstimatedDays} 天

四、多维风险评估矩阵
- 综合风险评级: 【${report.overallRiskLevel}】 (综合风险优先数 RPN = ${report.overallRpnScore}/100)
- 风险研判核心综述: ${report.riskSummary}
${report.riskDimensions.map((d, i) => `${i + 1}. 【${d.dimension}】[${d.riskLevel}] - 得分:${d.score}分\n   致损机理: ${d.mechanism}\n   风控措施: ${d.controlMeasure}`).join('\n')}

五、结构化维修处置建议
1. 临床科室应急隔离措施:
${report.immediateClinicalActions.map((a, i) => `   ${i + 1}. ${a}`).join('\n')}
2. 医工工程师现场拆检故障树:
${report.engineerRootCauses.map((r, i) => `   Top ${r.rank} (${r.category} - 发生率${r.probability}): ${r.cause} -> ${r.mechanism}`).join('\n')}
3. 推荐备件与预估预算:
${report.recommendedParts.length > 0 ? report.recommendedParts.map((p, i) => `   ${i + 1}. ${p.name} (${p.specification || '原厂原规格'}) - 预估: ￥${p.estCost}元 [${p.necessity}]`).join('\n') : '   当前建议优先排查内部连接与测试点，暂未列入大额备件。'}
   预估维修配件总额: ￥${report.estimatedTotalRepairCost.toLocaleString()} 元

六、修复后质控验收与 PM 规程
- 依据标准: ${report.postRepairQcCriteria.standard}
${report.postRepairQcCriteria.items.map((it, i) => `   ${i + 1}. ${it.name}: 指标要求 -> ${it.target} (方法: ${it.method})`).join('\n')}
- 预防性维护建议: ${report.preventiveMaintenanceAdvice}

签发责任工程师: ${report.signoff.leadEngineer}
质量技术复核: ${report.signoff.technicalReviewer}
印章: ${report.signoff.sealText} (有效期限 ${report.signoff.validityDays} 天)`;

    navigator.clipboard.writeText(text);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-60 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-slate-100 rounded-2xl shadow-2xl border border-slate-300 w-full max-w-5xl h-[95vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Top Control Bar */}
        <div className="px-5 py-3 border-b border-slate-200 bg-white flex flex-wrap items-center justify-between gap-3 flex-none shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-slate-900">
                  医疗设备故障技术研判与风险评估结论书
                </h3>
                <span className="text-2xs px-2 py-0.5 rounded-full font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                  A4 结构化 PDF 规程
                </span>
                <span className="text-2xs font-mono text-slate-500 hidden sm:inline">
                  [{report.reportDocNo}]
                </span>
              </div>
              <p className="text-2xs text-slate-500">
                融合【过往维修记录 + 运行环境数据 + 当前故障现象】全维度医工专家统筹决策模型
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Zoom Controls */}
            <div className="hidden md:flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
              <button
                type="button"
                onClick={() => setZoomLevel(prev => Math.max(75, prev - 15))}
                disabled={zoomLevel <= 75}
                className="p-1 text-slate-600 hover:text-slate-900 disabled:opacity-30 cursor-pointer"
                title="缩小预览"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="text-2xs font-mono font-bold text-slate-700 px-1 w-10 text-center">
                {zoomLevel}%
              </span>
              <button
                type="button"
                onClick={() => setZoomLevel(prev => Math.min(130, prev + 15))}
                disabled={zoomLevel >= 130}
                className="p-1 text-slate-600 hover:text-slate-900 disabled:opacity-30 cursor-pointer"
                title="放大预览"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setZoomLevel(100)}
                className="p-1 text-slate-500 hover:text-slate-900 cursor-pointer text-2xs"
                title="重置100%"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Copy Summary */}
            <button
              type="button"
              onClick={handleCopySummary}
              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 shadow-2xs flex items-center gap-1.5 cursor-pointer transition"
              title="复制文本格式的结构化研判摘要到剪贴板"
            >
              {copiedText ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700">已复制摘要</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-500" />
                  <span>复制摘要</span>
                </>
              )}
            </button>

            {/* Print Button */}
            <button
              type="button"
              onClick={handlePrint}
              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 shadow-2xs flex items-center gap-1.5 cursor-pointer transition"
              title="调起系统打印机进行A4纸质打印"
            >
              <Printer className="w-3.5 h-3.5 text-slate-600" />
              <span>系统打印</span>
            </button>

            {/* Export PDF Button */}
            <button
              type="button"
              id="export-ai-conclusion-pdf-btn"
              onClick={handleExportPdf}
              disabled={isExportingPdf}
              className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-linear-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 active:scale-95 disabled:opacity-50 text-white shadow-xs flex items-center gap-1.5 cursor-pointer transition"
              title="生成并下载标准高分辨率 PDF 研判结论书文件"
            >
              {isExportingPdf ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>PDF 生成中...</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  <span>导出 PDF 结论书</span>
                </>
              )}
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition cursor-pointer ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Paper Canvas Container */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-200/80 flex justify-center items-start">
          <div
            style={{
              transform: `scale(${zoomLevel / 100})`,
              transformOrigin: 'top center',
              transition: 'transform 0.15s ease'
            }}
            className="w-full max-w-[210mm] transition-all"
          >
            {/* The Standard A4 Printable Sheet */}
            <div
              ref={printAreaRef}
              id="ai-conclusion-report-print-container"
              className="a4-report-sheet bg-white border border-slate-300 shadow-xl p-8 sm:p-10 text-slate-900 font-sans relative overflow-hidden text-xs leading-relaxed"
              style={{
                width: '100%',
                minHeight: '297mm',
                boxSizing: 'border-box'
              }}
            >
              {/* Watermark / Seal Simulation */}
              <div className="absolute right-10 top-24 pointer-events-none select-none opacity-85 rotate-[-12deg] z-10 print:opacity-100">
                <div className="w-32 h-32 rounded-full border-3 border-rose-600/80 p-1 flex flex-col items-center justify-center text-center bg-white/40 backdrop-blur-2xs shadow-xs">
                  <div className="w-28 h-28 rounded-full border border-rose-500/80 border-dashed flex flex-col items-center justify-center p-1 text-rose-700">
                    <span className="text-[10px] font-extrabold tracking-widest uppercase">★ 三甲医学装备保障 ★</span>
                    <span className="text-xs font-black my-0.5">质控研判专用章</span>
                    <span className="text-[9px] font-bold font-mono tracking-tighter text-rose-600">
                      {report.generatedDate}
                    </span>
                    <span className="text-[8px] text-rose-500 scale-90">有效性: {report.signoff.validityDays}天</span>
                  </div>
                </div>
              </div>

              {/* Document Header */}
              <div className="border-b-2 border-slate-900 pb-4 mb-5">
                <div className="flex items-center justify-between text-2xs text-slate-500 mb-1">
                  <span className="font-semibold">{report.departmentHeader}</span>
                  <span className="font-mono">密级：内部工程质控公文 · 存档期限 10 年</span>
                </div>
                <div className="text-center space-y-1">
                  <h1 className="text-lg sm:text-xl font-black tracking-wide text-slate-900">
                    {report.institutionTitle}
                  </h1>
                  <h2 className="text-base sm:text-lg font-bold text-indigo-950 tracking-normal flex items-center justify-center gap-2">
                    <span>医疗设备故障技术研判与工程风险评估结论书</span>
                  </h2>
                  <div className="flex items-center justify-center gap-4 text-2xs text-slate-600 pt-1 font-medium">
                    <span>研判报告编号：<strong className="font-mono text-slate-900">{report.reportDocNo}</strong></span>
                    <span>出具时间：<strong className="font-mono text-slate-900">{report.generatedTimestamp}</strong></span>
                    <span>研判引擎：<strong className="text-indigo-900">Gemini 医工全生命周期统筹模型</strong></span>
                  </div>
                </div>
              </div>

              {/* SECTION 1: 设备档案与当前故障核实 */}
              <div className="mb-4">
                <div className="flex items-center gap-1.5 bg-slate-900 text-white px-2.5 py-1 rounded-sm text-xs font-bold mb-2">
                  <Activity className="w-3.5 h-3.5 text-cyan-400" />
                  <span>一、设备基础档案与当前故障核实 (Equipment & Current Fault Profile)</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-50 p-2.5 rounded border border-slate-200 text-2xs mb-2">
                  <div>
                    <span className="text-slate-500 block">设备名称 / 规格型号</span>
                    <strong className="text-slate-900 text-xs">
                      {report.equipmentSummary.name} ({report.equipmentSummary.model})
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">出厂编号 (SN) / 资产编号</span>
                    <strong className="font-mono text-slate-800">
                      {report.equipmentSummary.sn} / {report.equipmentSummary.assetNo}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">生产厂商 / 采购原值</span>
                    <strong className="text-slate-800">
                      {report.equipmentSummary.manufacturer} (￥{report.equipmentSummary.purchasePrice.toLocaleString()})
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">在役年限 / 浴盆老化阶段</span>
                    <span className="font-semibold text-indigo-900 bg-indigo-50 px-1 py-0.5 rounded border border-indigo-200">
                      {report.equipmentSummary.serviceYears} 年 ({report.equipmentSummary.lifecyclePhase})
                    </span>
                  </div>
                </div>

                {/* Current Fault Card */}
                <div className="bg-rose-50/60 border border-rose-200 p-2.5 rounded text-2xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-rose-950 flex items-center gap-1">
                      <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                      当前临床报修故障现象与报警特征：
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="px-2 py-0.5 bg-rose-600 text-white rounded font-bold text-[10px]">
                        紧急度: {report.currentFault.urgencyLevel}
                      </span>
                      <span className="px-2 py-0.5 bg-slate-800 text-white rounded font-bold text-[10px]">
                        受损子系统: {report.currentFault.affectedModule}
                      </span>
                    </div>
                  </div>
                  <p className="text-slate-800 font-medium leading-relaxed bg-white p-2 rounded border border-rose-100">
                    {report.currentFault.rawDescription}
                  </p>
                  <div className="flex flex-wrap items-center gap-2 pt-0.5 text-[11px]">
                    <span className="text-slate-500">检测代码/警报签名:</span>
                    {report.currentFault.alarmCodes.map((code, idx) => (
                      <span key={idx} className="font-mono font-bold bg-rose-100 text-rose-800 px-1.5 py-0.2 rounded border border-rose-300">
                        {code}
                      </span>
                    ))}
                    <span className="text-slate-300">|</span>
                    <span className="text-slate-600">
                      临床影响评级: <strong className="text-rose-900">{report.currentFault.clinicalImpact}</strong>
                    </span>
                  </div>
                </div>
              </div>

              {/* SECTION 2: 运行环境数据与基础设施工况 */}
              <div className="mb-4">
                <div className="flex items-center gap-1.5 bg-slate-900 text-white px-2.5 py-1 rounded-sm text-xs font-bold mb-2">
                  <Building2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>二、运行环境数据与基础设施工况 (Operating Environment & Infrastructure Data)</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-2xs">
                  <div className="p-2.5 bg-slate-50 rounded border border-slate-200 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800 flex items-center gap-1">
                        <Building2 className="w-3 h-3 text-emerald-600" />
                        空间定位与物理场所
                      </span>
                      <span className="text-[10px] text-slate-500 font-medium">
                        {report.environment.cleanlinessLevel}
                      </span>
                    </div>
                    <div className="text-slate-700 space-y-0.5">
                      <div>使用科室/楼宇：<strong>{report.environment.department} ({report.environment.building} {report.environment.floor})</strong></div>
                      <div>具体使用房间：<strong>{report.environment.usageLocation}</strong></div>
                    </div>
                  </div>

                  <div className="p-2.5 bg-slate-50 rounded border border-slate-200 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800 flex items-center gap-1">
                        <Thermometer className="w-3 h-3 text-cyan-600" />
                        微气候环境与温湿度规范
                      </span>
                      <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                        在控运行
                      </span>
                    </div>
                    <div className="text-slate-700">
                      <div>标准工况指标：<strong>{report.environment.tempHumidityRange}</strong></div>
                      <div className="text-slate-500 text-[10px]">严格控制冷凝水滴落与机壳内静电积聚防范措施。</div>
                    </div>
                  </div>

                  <div className="p-2.5 bg-slate-50 rounded border border-slate-200 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800 flex items-center gap-1">
                        <Zap className="w-3 h-3 text-amber-600" />
                        医疗配电安全与抗干扰电网
                      </span>
                      <span className="text-[10px] font-mono text-amber-800 font-bold bg-amber-50 px-1 py-0.2 rounded">
                        IT/TN-S
                      </span>
                    </div>
                    <p className="text-slate-700 leading-snug">
                      {report.environment.powerGridSpec}
                    </p>
                  </div>

                  <div className="p-2.5 bg-slate-50 rounded border border-slate-200 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800 flex items-center gap-1">
                        <Wind className="w-3 h-3 text-indigo-600" />
                        开机工作负荷与感控消杀暴露
                      </span>
                      <span className="text-[10px] text-indigo-700 font-semibold bg-indigo-50 px-1 py-0.2 rounded">
                        连续运行
                      </span>
                    </div>
                    <p className="text-slate-700 leading-snug">
                      {report.environment.dutyCycle}。消杀要求：{report.environment.disinfectionImpact}。
                    </p>
                  </div>
                </div>

                <div className="mt-1.5 p-2 bg-amber-50/70 border border-amber-200 rounded text-[11px] text-amber-950 flex items-start gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>环境工况医工提示：</strong>{report.environment.environmentalRiskNotes}。
                  </span>
                </div>
              </div>

              {/* SECTION 3: 过往维修记录与复发隐患溯源 */}
              <div className="mb-4">
                <div className="flex items-center justify-between bg-slate-900 text-white px-2.5 py-1 rounded-sm text-xs font-bold mb-2">
                  <div className="flex items-center gap-1.5">
                    <History className="w-3.5 h-3.5 text-amber-400" />
                    <span>三、过往维修记录统筹与复发性隐患溯源 (Historical Maintenance Records & Recurrence Profiling)</span>
                  </div>
                  <span className="text-[10px] text-slate-300 font-normal">
                    累计维修 {report.repairInsight.totalRepairs} 次 | 支出 ￥{report.repairInsight.totalCost.toLocaleString()} 元
                  </span>
                </div>

                <div className="bg-slate-50 p-2.5 rounded border border-slate-200 text-2xs space-y-2 mb-2">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                    <div className="bg-white p-1.5 rounded border border-slate-200">
                      <span className="text-slate-500 block text-[10px]">累计历史维修次数</span>
                      <strong className="text-sm font-mono text-slate-900">{report.repairInsight.totalRepairs}</strong> 次
                    </div>
                    <div className="bg-white p-1.5 rounded border border-slate-200">
                      <span className="text-slate-500 block text-[10px]">历史维保累计支出</span>
                      <strong className="text-sm font-mono text-indigo-700">￥{report.repairInsight.totalCost.toLocaleString()}</strong> 元
                    </div>
                    <div className="bg-white p-1.5 rounded border border-slate-200">
                      <span className="text-slate-500 block text-[10px]">支出占原值比率</span>
                      <strong className={`text-sm font-mono ${report.repairInsight.costRatioPercent > 35 ? 'text-rose-700 font-bold' : 'text-slate-800'}`}>
                        {report.repairInsight.costRatioPercent}%
                      </strong>
                    </div>
                    <div className="bg-white p-1.5 rounded border border-slate-200">
                      <span className="text-slate-500 block text-[10px]">平均故障间隔 (MTBF)</span>
                      <strong className="text-sm font-mono text-emerald-700">~{report.repairInsight.mtbfEstimatedDays}</strong> 天
                    </div>
                  </div>

                  {/* Recurrence Summary */}
                  <div className={`p-2 rounded border text-[11px] leading-relaxed ${
                    report.repairInsight.hasRecurringFailure 
                      ? 'bg-rose-50 border-rose-200 text-rose-950 font-medium' 
                      : 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                  }`}>
                    {report.repairInsight.recurringFailureSummary}
                  </div>

                  {/* Past Repair Table */}
                  {report.repairInsight.recentRepairs.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-[11px] border border-slate-200">
                        <thead>
                          <tr className="bg-slate-200/80 text-slate-700 font-bold text-left">
                            <th className="p-1.5 border-r border-slate-300 w-20">维修日期</th>
                            <th className="p-1.5 border-r border-slate-300">当时报修故障现象</th>
                            <th className="p-1.5 border-r border-slate-300">更换备件与耗材</th>
                            <th className="p-1.5 border-r border-slate-300 w-16 text-right">费用</th>
                            <th className="p-1.5 w-16">责任人</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 bg-white">
                          {report.repairInsight.recentRepairs.map((rec, i) => (
                            <tr key={i} className="hover:bg-slate-50">
                              <td className="p-1.5 font-mono text-slate-600 border-r border-slate-200">{rec.date}</td>
                              <td className="p-1.5 text-slate-800 border-r border-slate-200">{rec.fault}</td>
                              <td className="p-1.5 text-blue-700 border-r border-slate-200">{rec.parts}</td>
                              <td className="p-1.5 font-mono text-right text-slate-700 border-r border-slate-200">￥{rec.cost}</td>
                              <td className="p-1.5 text-slate-600">{rec.technician}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-2 text-slate-400 text-2xs bg-white rounded border border-dashed border-slate-200">
                      该设备在役期间档案完善，过往未发生大件报修故障或台账暂未登记零散小修。
                    </div>
                  )}
                </div>
              </div>

              {/* SECTION 4: 结构化多维风险评估矩阵 */}
              <div className="mb-4">
                <div className="flex items-center justify-between bg-slate-900 text-white px-2.5 py-1 rounded-sm text-xs font-bold mb-2">
                  <div className="flex items-center gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                    <span>四、多维工程与临床风险评估矩阵 (Multi-dimensional Risk Assessment Matrix)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-cyan-300">
                      综合风险优先数 (RPN): {report.overallRpnScore}/100
                    </span>
                    <span className={`px-2 py-0.2 rounded font-bold text-[10px] ${
                      report.overallRiskLevel.includes('极高') 
                        ? 'bg-rose-600 text-white' 
                        : report.overallRiskLevel.includes('高风险') 
                        ? 'bg-amber-600 text-white' 
                        : 'bg-emerald-600 text-white'
                    }`}>
                      {report.overallRiskLevel}
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  {report.riskDimensions.map((dim, idx) => (
                    <div key={idx} className="p-2 rounded border border-slate-200 bg-white text-2xs flex flex-col gap-1">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-1">
                        <span className="font-bold text-slate-900 flex items-center gap-1">
                          <span className="w-4 h-4 rounded-full bg-slate-800 text-white text-[10px] flex items-center justify-center font-mono">
                            {idx + 1}
                          </span>
                          {dim.dimension}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono text-slate-500">
                            量化分: <strong>{dim.score}</strong> 分
                          </span>
                          <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                            dim.riskLevel === '极高风险' ? 'bg-rose-100 text-rose-800 border border-rose-300' :
                            dim.riskLevel === '高风险' ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                            'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          }`}>
                            {dim.riskLevel}
                          </span>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                        <div>
                          <span className="text-slate-500 font-semibold">【失效机理与隐患推演】</span>
                          <p className="text-slate-700 leading-snug">{dim.mechanism}</p>
                        </div>
                        <div>
                          <span className="text-emerald-700 font-semibold">【工程与临床控制措施】</span>
                          <p className="text-slate-800 leading-snug">{dim.controlMeasure}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* SECTION 5: 结构化维修建议与备件方案 */}
              <div className="mb-4">
                <div className="flex items-center justify-between bg-slate-900 text-white px-2.5 py-1 rounded-sm text-xs font-bold mb-2">
                  <div className="flex items-center gap-1.5">
                    <Wrench className="w-3.5 h-3.5 text-blue-400" />
                    <span>五、结构化维修处置建议与备件方案 (Maintenance Recommendations & Action Plan)</span>
                  </div>
                  <span className="text-[10px] text-cyan-300 font-mono">
                    备件预算估算: ￥{report.estimatedTotalRepairCost.toLocaleString()} 元
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-2xs mb-2">
                  {/* Immediate Clinical */}
                  <div className="p-2.5 bg-amber-50/60 border border-amber-200 rounded space-y-1.5">
                    <span className="font-bold text-amber-950 flex items-center gap-1 text-[11px]">
                      <Clock className="w-3.5 h-3.5 text-amber-600" />
                      1. 临床科室即刻响应应急准则
                    </span>
                    <ul className="space-y-1 text-slate-800 text-[11px]">
                      {report.immediateClinicalActions.map((act, i) => (
                        <li key={i} className="flex items-start gap-1">
                          <span className="text-amber-700 font-bold shrink-0">•</span>
                          <span className="leading-snug">{act}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Engineer Steps */}
                  <div className="p-2.5 bg-blue-50/60 border border-blue-200 rounded space-y-1.5">
                    <span className="font-bold text-blue-950 flex items-center gap-1 text-[11px]">
                      <Cpu className="w-3.5 h-3.5 text-blue-600" />
                      2. 医工工程师现场拆检与测试重点
                    </span>
                    <div className="space-y-1 text-slate-800 text-[11px]">
                      {report.engineerActionSteps.slice(0, 4).map((step, i) => (
                        <div key={i} className="flex items-start gap-1">
                          <span className="w-3.5 h-3.5 rounded-full bg-blue-200 text-blue-800 font-bold text-[9px] flex items-center justify-center shrink-0 mt-0.5">
                            {i + 1}
                          </span>
                          <span className="leading-snug">{step}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Root Causes Top 3 */}
                <div className="bg-slate-50 border border-slate-200 p-2 rounded mb-2">
                  <span className="text-[11px] font-bold text-slate-800 block mb-1">
                    🔬 Top 3 故障树根因推演与测试点指引：
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 text-[10px]">
                    {report.engineerRootCauses.map((rc) => (
                      <div key={rc.rank} className="bg-white p-1.5 rounded border border-slate-200 space-y-0.5">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-cyan-800">Top {rc.rank} ({rc.probability})</span>
                          <span className="text-slate-400 font-mono">[{rc.category}]</span>
                        </div>
                        <strong className="text-slate-900 block leading-tight">{rc.cause}</strong>
                        <p className="text-slate-500 leading-tight line-clamp-3">{rc.mechanism}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recommended Parts Table */}
                {report.recommendedParts.length > 0 && (
                  <div className="border border-slate-200 rounded overflow-hidden">
                    <table className="w-full text-[11px]">
                      <thead>
                        <tr className="bg-slate-100 text-slate-700 font-bold text-left">
                          <th className="p-1 border-r border-slate-200">推荐配件/耗材名称</th>
                          <th className="p-1 border-r border-slate-200">规格型号 / PN</th>
                          <th className="p-1 border-r border-slate-200 w-24">必要性评级</th>
                          <th className="p-1 text-right w-20">预估费用</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {report.recommendedParts.map((pt, i) => (
                          <tr key={i}>
                            <td className="p-1 font-semibold text-slate-800 border-r border-slate-100">{pt.name}</td>
                            <td className="p-1 font-mono text-slate-500 border-r border-slate-100">{pt.specification || '原厂原规格'}</td>
                            <td className="p-1 text-amber-700 font-medium border-r border-slate-100">[{pt.necessity}]</td>
                            <td className="p-1 font-mono text-right text-indigo-700 font-bold">￥{pt.estCost}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* SECTION 6: 修复后质控验收与 PM 预防性维护 */}
              <div className="mb-4">
                <div className="flex items-center justify-between bg-slate-900 text-white px-2.5 py-1 rounded-sm text-xs font-bold mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-emerald-400" />
                    <span>六、修复后质控验收标准与后续 PM 规程 (Post-Repair QC Acceptance & Preventive Maintenance)</span>
                  </div>
                  <span className="text-[10px] text-slate-300 font-normal">
                    {report.postRepairQcCriteria.standard}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-2xs mb-1.5">
                  <div className="border border-slate-200 rounded p-2 bg-slate-50 space-y-1">
                    <span className="font-bold text-slate-800 block text-[11px]">
                      🛡️ 出厂与放行电气安全指标 (GB 9706.1-2020)：
                    </span>
                    <ul className="space-y-0.5 text-[10px] text-slate-700">
                      {report.postRepairQcCriteria.items.slice(0, 3).map((it, idx) => (
                        <li key={idx} className="flex justify-between border-b border-slate-100 pb-0.5">
                          <span className="font-medium">{it.name}:</span>
                          <span className="font-mono text-emerald-700 font-semibold">{it.target}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="border border-slate-200 rounded p-2 bg-slate-50 space-y-1">
                    <span className="font-bold text-slate-800 block text-[11px]">
                      ⏱️ 预防性维护 (PM) 与缩周期重点巡检要求：
                    </span>
                    <p className="text-[10px] text-slate-700 leading-snug">
                      {report.preventiveMaintenanceAdvice}
                    </p>
                    <p className="text-[10px] text-indigo-900 font-medium">
                      ✓ 修复后需连续通电满载烤机试验 ≥ 4 小时，经主研医工测试合格方可签署放行单返回科室。
                    </p>
                  </div>
                </div>
              </div>

              {/* SECTION 7: 责任签署栏与公文归档 */}
              <div className="pt-2 border-t-2 border-slate-900 mt-auto">
                <div className="grid grid-cols-3 gap-3 text-2xs text-slate-800">
                  <div className="space-y-4">
                    <div>
                      <span className="text-slate-500 block">主研责任工程师 (签章):</span>
                      <div className="h-7 border-b border-slate-300 flex items-end font-serif font-bold text-slate-900 pl-2">
                        {report.signoff.leadEngineer}
                      </div>
                    </div>
                    <div className="text-[10px] text-slate-400">研判结论有效期限: 14 天</div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <span className="text-slate-500 block">医学装备技术总监 / 科长复核:</span>
                      <div className="h-7 border-b border-slate-300 flex items-end font-serif font-bold text-indigo-950 pl-2">
                        {report.signoff.technicalReviewer}
                      </div>
                    </div>
                    <div className="text-[10px] text-slate-400">复核状态: 经 AI 与专家规则交叉比对审定</div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <span className="text-slate-500 block">使用科室确认与备机交接人:</span>
                      <div className="h-7 border-b border-slate-300 flex items-end font-serif font-bold text-slate-700 pl-2">
                        {report.signoff.clinicalReceiver}
                      </div>
                    </div>
                    <div className="text-[10px] text-slate-400">院内归档编号: {report.reportDocNo}</div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-400 pt-3 border-t border-slate-100 mt-3">
                  <span>三甲医疗机构医学装备管理系统 · 临床工程决策支持引擎 (AI Clinical Engineering CDSS)</span>
                  <span>第 1 页 / 共 1 页 (A4 标准技术公文)</span>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-2.5 bg-white border-t border-slate-200 flex items-center justify-between text-2xs text-slate-500 flex-none">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>研判结论书已根据设备全生命周期维保记录与运行环境参数深度合成完成。</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1 bg-slate-700 hover:bg-slate-800 text-white rounded font-medium cursor-pointer transition"
          >
            关闭预览
          </button>
        </div>

      </div>
    </div>
  );
};

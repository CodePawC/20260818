import React, { useRef, useState } from 'react';
import jsPDF from 'jspdf';
import { toJpeg } from 'html-to-image';
import {
  FileText,
  Printer,
  Download,
  X,
  CheckCircle2,
  Bookmark,
  ShieldCheck,
  Building,
  Calendar,
  Layers,
  Sparkles,
  Loader2,
  FileCheck,
  HelpCircle,
  Eye,
  SlidersHorizontal,
  Info,
  History,
  FileSignature
} from 'lucide-react';
import { RegulationItem, RegulationLevel, RegulationRevisionRecord } from '../types/regulationTypes';
import { getRegulationWorkflow } from '../utils/regulationWorkflowPresets';

const LEVEL_MAP: Record<RegulationLevel, { label: string; color: string }> = {
  national: { label: '国家法规', color: 'bg-red-50 text-red-700 border-red-200' },
  hospital: { label: '院级制度', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  departmental: { label: '科级细则', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  sop: { label: '操作SOP', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  emergency: { label: '应急预案', color: 'bg-amber-50 text-amber-800 border-amber-200' }
};

interface RegulationCompilationPdfModalProps {
  isOpen: boolean;
  onClose: () => void;
  regulations: RegulationItem[];
  hospitalName?: string;
  departmentName?: string;
}

/**
 * 清理制度标题外层的书名号 《 》
 */
const cleanRegulationTitle = (title: string): string => {
  if (!title) return '';
  return title.replace(/^《+|》+$/g, '').trim();
};

/**
 * 清理正文中针对制度名称引用的书名号 《 》
 */
const stripRegulationBookMarks = (text: string): string => {
  if (!text) return '';
  return text.replace(/《([^》]+(?:制度|规程|规定|细则|办法|预案|规范|SOP|流程))》/g, '$1');
};

/**
 * 转换正文中的 Markdown 粗体语法（如 **第一条** 或 **任意文字**），转换为合规的标准加粗文本
 * 彻底消除正文中出现未解析的原生 ** 星号字符，同时防止任何孤立未闭合星号泄露，并去除正文制度名称书名号
 */
const formatMarkdownText = (rawText: string): React.ReactNode => {
  if (!rawText) return '';
  const sanitizedText = stripRegulationBookMarks(rawText);
  if (!sanitizedText.includes('**')) {
    return sanitizedText;
  }
  // 先使用精确匹配闭合的 **...**
  const parts = sanitizedText.split(/(\*\*[^*]+?\*\*)/g);
  return (
    <>
      {parts.map((part, index) => {
        if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
          const boldContent = part.slice(2, -2).trim();
          return (
            <strong key={index} className="font-bold text-slate-900 tracking-tight">
              {boldContent}
            </strong>
          );
        }
        // 如果剩余部分仍含有残余孤立的 **，进行强力清洗去除星号字符
        const cleanedPart = part.replace(/\*\*/g, '');
        return <React.Fragment key={index}>{cleanedPart}</React.Fragment>;
      })}
    </>
  );
};

export const RegulationCompilationPdfModal: React.FC<RegulationCompilationPdfModalProps> = ({
  isOpen,
  onClose,
  regulations,
  hospitalName = '五莲县人民医院',
  departmentName = '医学工程保障中心'
}) => {
  const printAreaRef = useRef<HTMLDivElement>(null);
  const [includeSopWorkflows, setIncludeSopWorkflows] = useState<boolean>(true);
  const [includeRevisionHistory, setIncludeRevisionHistory] = useState<boolean>(true);
  const [includeCover, setIncludeCover] = useState<boolean>(true);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [downloadProgress, setDownloadProgress] = useState<string>('');

  // 预览分页交互增强：缩放、装订参考线、单篇/全册视图与快速页面定位
  const [zoomScale, setZoomScale] = useState<number>(0.9);
  const [showBindingLine, setShowBindingLine] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'all' | 'single'>('all');
  const [selectedSingleId, setSelectedSingleId] = useState<string>('');

  if (!isOpen) return null;

  // 根据分类过滤要汇编成册的制度
  const targetRegulations = filterCategory === 'all'
    ? regulations
    : regulations.filter(r => r.category === filterCategory);

  const categories = Array.from(new Set(regulations.map(r => r.category)));

  // 计算总物理页数（封面 + 前言 + 目录 + 制度篇数）
  const totalA4Pages = (includeCover ? 2 : 0) + 1 + targetRegulations.length;

  // 页面快速跳转
  const handleScrollToPage = (elementId: string) => {
    const el = document.getElementById(elementId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // 1. 逐页高清装订导出 PDF（严格保持 1:1 真实自然宽高比，彻底消除文字拉伸变形）
  const handleDownloadPdfFile = async (onlyCurrent: boolean = false) => {
    if (!printAreaRef.current || isDownloading) return;
    setIsDownloading(true);
    setDownloadProgress('正在初始化 A4 装订引擎...');

    // 关键：在截图前，临时重置 DOM 容器的 zoom 为 1.0，防止 SVG foreignObject 产生字体比例崩坏与间距错位
    const containerEl = printAreaRef.current;
    const originalZoom = containerEl.style.zoom;
    containerEl.style.zoom = '1';
    await new Promise<void>(resolve => requestAnimationFrame(() => setTimeout(resolve, 60)));

    try {
      let pageElements: HTMLElement[] = [];
      if (onlyCurrent) {
        // 单篇模式仅导出当前选中的单页
        const activePage = printAreaRef.current.querySelector<HTMLElement>('.a4-print-page');
        if (activePage) pageElements = [activePage];
      } else {
        // 全册模式获取所有 A4 独立页面
        pageElements = Array.from(printAreaRef.current.querySelectorAll<HTMLElement>('.a4-print-page'));
      }

      if (pageElements.length === 0) {
        throw new Error('未检测到可装订页面');
      }

      const total = pageElements.length;
      // 创建标准 A4 纵向 PDF 容器 (210mm × 297mm)
      const pdf = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a4',
        compress: true
      });

      const pdfWidth = 210;
      const pdfHeight = 297;

      for (let i = 0; i < total; i++) {
        const pageEl = pageElements[i] as HTMLElement;
        const pageTitle = pageEl.getAttribute('data-page-title') || `第 ${i + 1} 页`;
        setDownloadProgress(`正在生成高清装订：${pageTitle} (${i + 1}/${total})...`);

        // 使用 html-to-image 的 toJpeg，2x 高清物理像素渲染
        const imgData = await toJpeg(pageEl, {
          quality: 0.98,
          pixelRatio: 2,
          backgroundColor: '#ffffff',
          cacheBust: true,
        });

        // 加载图片以获取真实自然宽高比，杜绝非等比拉伸
        const img = new Image();
        img.src = imgData;
        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = () => reject(new Error(`第 ${i + 1} 页图片渲染失败`));
        });

        if (i > 0) {
          pdf.addPage('a4', 'p');
        }

        // 精确等比例计算，保持字体和几何图形严格不失真
        const imgAspect = img.naturalHeight / img.naturalWidth;
        const targetHeight = pdfWidth * imgAspect;

        if (targetHeight <= pdfHeight) {
          // 页面自然高度在 A4 范围内，按宽度 100% 铺满，高度自然映射
          pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, targetHeight, undefined, 'FAST');
        } else {
          // 若内容略微超长，按比例等比缩放并水平居中，绝不强行压缩宽高比
          const scale = pdfHeight / targetHeight;
          const finalWidth = pdfWidth * scale;
          const xOffset = (pdfWidth - finalWidth) / 2;
          pdf.addImage(imgData, 'JPEG', xOffset, 0, finalWidth, pdfHeight, undefined, 'FAST');
        }
      }

      setDownloadProgress('正在保存并触发本地下载...');
      const dateTag = new Date().toISOString().split('T')[0];
      const fileName = onlyCurrent
        ? `${hospitalName}-规章制度单篇-${dateTag}.pdf`
        : `${hospitalName}-医学装备管理规章制度与标准SOP全套汇编-${dateTag}.pdf`;

      // 使用 Blob 双重保障下载，兼容各浏览器环境
      const blob = pdf.output('blob');
      const blobUrl = URL.createObjectURL(blob);
      const downloadLink = document.createElement('a');
      downloadLink.href = blobUrl;
      downloadLink.download = fileName;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      setTimeout(() => {
        document.body.removeChild(downloadLink);
        URL.revokeObjectURL(blobUrl);
      }, 3000);
    } catch (err) {
      console.error('PDF generation error, fallback to browser print:', err);
      // 备用兜底调用系统打印
      window.print();
    } finally {
      // 恢复原有的预览缩放比例
      if (containerEl) {
        containerEl.style.zoom = originalZoom || String(zoomScale);
      }
      setIsDownloading(false);
      setDownloadProgress('');
    }
  };

  // 2. 调起原生系统打印机（可选择“另存为 PDF”获得极致高清矢量文字）
  const handlePrintOrSavePdf = () => {
    setIsGenerating(true);
    setTimeout(() => {
      window.print();
      setIsGenerating(false);
    }, 250);
  };

  const currentDateStr = new Date().toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div 
      id="regulation-compilation-modal"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 print:p-0 print:bg-white print:static print:inset-auto"
    >
      {/* 弹窗主体 */}
      <div className="relative w-full max-w-5xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[94vh] print:max-h-none print:border-none print:shadow-none print:w-full print:rounded-none">
        
        {/* 屏幕端控制顶栏 (简洁大气，功能齐全，打印时自动隐藏) */}
        <div className="no-print flex flex-wrap items-center justify-between px-5 py-3.5 bg-slate-900 text-white border-b border-slate-800 shrink-0 gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600/30 text-blue-400 flex items-center justify-center border border-blue-500/30 shrink-0">
              <FileCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-wide flex items-center gap-2">
                <span>医疗设备管理规章制度与标准SOP 全套标准汇编册</span>
                <span className="text-[11px] font-normal px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  共 {totalA4Pages} 页 A4 标准版芯
                </span>
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* 直接下载 PDF 文件按钮（逐页生成装订，100%稳定不崩溃） */}
            <button
              type="button"
              onClick={() => handleDownloadPdfFile(viewMode === 'single')}
              disabled={isDownloading || isGenerating}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
              title={viewMode === 'single' ? "下载当前单页 PDF" : "生成并直接下载整本 A4 PDF 汇编册到本地"}
            >
              {isDownloading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{downloadProgress || '正在装订 PDF...'}</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>{viewMode === 'single' ? '下载当前单篇 (PDF)' : '下载全套汇编册 (PDF)'}</span>
                </>
              )}
            </button>

            {/* 浏览器原生打印 / 矢量另存为 PDF 按钮 */}
            <button
              type="button"
              onClick={handlePrintOrSavePdf}
              disabled={isDownloading || isGenerating}
              className="px-3.5 py-2 bg-slate-700 hover:bg-slate-600 text-white font-semibold text-xs rounded-xl border border-slate-600 flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
              title="调起打印机或选择'另存为 PDF'（矢量超清排版）"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>准备中...</span>
                </>
              ) : (
                <>
                  <Printer className="w-4 h-4 text-slate-300" />
                  <span>打印 / 另存为 PDF</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              title="关闭"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 屏幕端选项与分页控制工具条 */}
        <div className="no-print px-5 py-2.5 bg-slate-100 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3.5 flex-wrap">
            {/* 范围选择 */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-600 font-medium">汇编范围:</span>
              <select
                value={filterCategory}
                onChange={e => setFilterCategory(e.target.value)}
                className="px-2.5 py-1 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="all">全院制度 ({regulations.length} 项)</option>
                {categories.map(c => (
                  <option key={c} value={c}>{c} ({regulations.filter(r => r.category === c).length} 项)</option>
                ))}
              </select>
            </div>

            {/* 视图模式切换 */}
            <div className="flex items-center gap-1 bg-slate-200 p-0.5 rounded-lg border border-slate-300">
              <button
                type="button"
                onClick={() => setViewMode('all')}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                  viewMode === 'all'
                    ? 'bg-white text-blue-700 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                全册逐页连排
              </button>
              <button
                type="button"
                onClick={() => {
                  setViewMode('single');
                  if (!selectedSingleId && targetRegulations.length > 0) {
                    setSelectedSingleId(targetRegulations[0].id);
                  }
                }}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                  viewMode === 'single'
                    ? 'bg-white text-blue-700 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                单篇精览
              </button>
            </div>

            {/* 单篇模式下的文章选择器 */}
            {viewMode === 'single' && (
              <div className="flex items-center gap-1.5">
                <span className="text-slate-600 font-medium">切换制度:</span>
                <select
                  value={selectedSingleId || (targetRegulations[0]?.id ?? '')}
                  onChange={e => setSelectedSingleId(e.target.value)}
                  className="px-2.5 py-1 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 max-w-[200px] truncate"
                >
                  {includeCover && <option value="cover">第 1 页：规范红头封面</option>}
                  {includeCover && <option value="preface">第 2 页：编制前言与实施总则</option>}
                  <option value="toc">第 3 页：制度总汇编目录</option>
                  {targetRegulations.map((r, idx) => (
                    <option key={r.id} value={r.id}>
                      第 {(includeCover ? 3 : 1) + idx + 1} 页：{r.title}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* 全册模式下的快速跳转定位 */}
            {viewMode === 'all' && (
              <div className="flex items-center gap-1.5">
                <span className="text-slate-600 font-medium">快速跳至:</span>
                <select
                  onChange={e => {
                    if (e.target.value) handleScrollToPage(e.target.value);
                  }}
                  className="px-2.5 py-1 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  defaultValue=""
                >
                  <option value="" disabled>选择页面快速定位...</option>
                  {includeCover && <option value="page-cover">第 1 页：规范公文封面</option>}
                  {includeCover && <option value="page-preface">第 2 页：编制前言与实施总则</option>}
                  <option value="page-toc">第 3 页：制度总汇编目录</option>
                  {targetRegulations.map((r, idx) => (
                    <option key={r.id} value={`page-reg-${r.id}`}>
                      第 {(includeCover ? 3 : 1) + idx + 1} 页：{r.title}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* 包含选项勾选 */}
            <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 select-none">
              <input
                type="checkbox"
                checked={includeCover}
                onChange={e => setIncludeCover(e.target.checked)}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span>封面导言</span>
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 select-none">
              <input
                type="checkbox"
                checked={includeRevisionHistory}
                onChange={e => setIncludeRevisionHistory(e.target.checked)}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span>修订台账</span>
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 select-none">
              <input
                type="checkbox"
                checked={includeSopWorkflows}
                onChange={e => setIncludeSopWorkflows(e.target.checked)}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span>SOP流程</span>
            </label>
          </div>

          <div className="flex items-center gap-3">
            {/* 20mm 装订线导引线开关 */}
            <label className="flex items-center gap-1 text-[11px] text-slate-600 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showBindingLine}
                onChange={e => setShowBindingLine(e.target.checked)}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span>20mm装订辅助线</span>
            </label>

            {/* 缩放控制 */}
            <div className="flex items-center gap-1 bg-slate-200 p-0.5 rounded-lg border border-slate-300">
              {[0.75, 0.9, 1.0].map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setZoomScale(s)}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                    zoomScale === s
                      ? 'bg-white text-blue-700 font-bold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {Math.round(s * 100)}%
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 真实 A4 物理纸张排版预览视窗 (纯正公文风格，真实纸张边界、阴影与分页标线) */}
        <div className="flex-1 min-h-0 overflow-auto p-4 sm:p-8 bg-slate-300/80 custom-scrollbar print:p-0 print:bg-white print:overflow-visible">
          <div 
            ref={printAreaRef}
            className="w-full flex flex-col items-center print:block min-w-max"
            style={{ 
              fontFamily: '"SimSun", "Songti SC", "STSong", "FangSong", "Noto Serif SC", serif',
              zoom: zoomScale
            }}
          >
            {/* 1. 规范公文红头封面 (独立 A4 物理纸张) */}
            {includeCover && (viewMode === 'all' || selectedSingleId === 'cover') && (
              <div 
                id="page-cover"
                data-page-title="第 1 页 · 红头封面"
                className="a4-print-page w-[210mm] min-w-[210mm] max-w-[210mm] min-h-[297mm] bg-white shadow-2xl rounded-xs border border-slate-300 mx-auto mb-8 relative flex flex-col justify-between select-text print:shadow-none print:border-none print:m-0 box-border shrink-0"
                style={{ padding: '20mm 20mm 20mm 24mm', boxSizing: 'border-box' }}
              >
                {/* 20mm 左侧装订线提示（打印时自动隐藏） */}
                {showBindingLine && (
                  <div className="no-print absolute left-[20mm] top-0 bottom-0 border-r border-dashed border-blue-400/40 pointer-events-none z-10 flex flex-col justify-center">
                    <span className="bg-blue-50 text-blue-700 text-[10px] px-1 py-0.5 rounded rotate-90 origin-center whitespace-nowrap shadow-xs border border-blue-200">
                      20mm 装订线
                    </span>
                  </div>
                )}

                {/* 封面主体内容（医院名称与档号仅出现一次，层次分明，大方端庄） */}
                <div className="flex-1 flex flex-col justify-between pt-4 pb-2">
                  <div>
                    {/* 顶端发文机关标识（红头）：医院名称仅在此处庄重大气呈现 */}
                    <div className="pt-6 sm:pt-10 pb-2 text-center">
                      <div className="text-red-700 font-serif font-extrabold tracking-[0.25em] text-2xl sm:text-3xl lg:text-4xl leading-tight">
                        {hospitalName}
                      </div>
                    </div>

                    {/* 规范公文大双红线（上粗下细） */}
                    <div className="space-y-1.5 my-6 sm:my-8">
                      <div className="w-full h-1 bg-red-700" />
                      <div className="w-full h-0.5 bg-red-700" />
                    </div>
                  </div>

                  {/* 核心文书题名区（居中留白，突出主题与版本） */}
                  <div className="my-auto py-8 sm:py-12 text-center w-full">
                    <div className="space-y-6 w-full mx-auto">
                      <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-wider leading-relaxed font-serif">
                        医学装备管理规章制度<br />与标准化SOP操作规程全集汇编
                      </h1>
                      <div className="inline-block px-5 py-1.5 text-xs sm:text-sm font-semibold text-slate-700 font-sans tracking-widest border-y border-slate-300">
                        2026 年度执行版
                      </div>
                      <p className="text-xs sm:text-sm text-slate-500 font-sans leading-relaxed tracking-wide w-full mx-auto pt-2">
                        依据国家《医疗器械监督管理条例》（国务院令第739号）、《医疗卫生机构医学装备管理办法》及三级甲等综合医院评审标准编制
                      </p>
                    </div>
                  </div>

                  {/* 文书版记与归档信息（去除边框与复杂卡片背景，全宽自然舒展适应页面） */}
                  <div className="w-full">
                    <div className="w-full mb-6 py-2 font-sans text-xs">
                      <div className="w-full grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
                        <div>
                          <span className="text-slate-500 block text-[11px] mb-1">文书档号</span>
                          <span className="font-mono font-bold text-slate-800 text-sm">WLPH-ME-2026-ZB</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[11px] mb-1">文书性质</span>
                          <span className="text-slate-800 font-medium text-sm">内部规范性文件</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[11px] mb-1">主编部门</span>
                          <span className="text-slate-800 font-semibold text-sm truncate block" title={departmentName}>{departmentName}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[11px] mb-1">印发日期</span>
                          <span className="text-slate-800 font-medium text-sm">{currentDateStr}</span>
                        </div>
                        <div className="col-span-2 sm:col-span-4 pt-2.5 border-t border-slate-200 flex items-center justify-between text-slate-500 text-[11px] w-full">
                          <span>适用范围：全院各临床、医技及职能科室统一遵照执行</span>
                          <span className="text-slate-400 font-mono">第 1 次全面修订</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 页脚线与真实物理页码 */}
                <div className="text-[11px] text-slate-500 font-sans flex items-center justify-end pt-3 border-t border-slate-200 shrink-0 print:border-slate-300">
                  <span className="font-bold text-slate-700 font-mono">
                    第 1 页 / 共 {totalA4Pages} 页
                  </span>
                </div>
              </div>
            )}

            {/* 封面后分页标线 (仅屏幕端显示) */}
            {includeCover && viewMode === 'all' && (
              <div className="no-print my-6 flex items-center justify-center gap-3 text-xs text-slate-500 select-none">
                <div className="h-px bg-slate-400/40 w-28 sm:w-44" />
                <span className="px-3 py-1 rounded-full bg-slate-200/90 border border-slate-300/80 font-mono text-[11px] text-slate-700 font-medium shadow-xs">
                  第 1 页 完 · 下一页 A4 幅面
                </span>
                <div className="h-px bg-slate-400/40 w-28 sm:w-44" />
              </div>
            )}

            {/* 2. 编制前言与实施总则 (独立 A4 物理纸张) */}
            {includeCover && (viewMode === 'all' || selectedSingleId === 'preface') && (
              <div 
                id="page-preface"
                data-page-title="第 2 页 · 前言与实施总则"
                className="a4-print-page w-[210mm] min-w-[210mm] max-w-[210mm] min-h-[297mm] bg-white shadow-2xl rounded-xs border border-slate-300 mx-auto mb-8 relative flex flex-col justify-between select-text print:shadow-none print:border-none print:m-0 box-border shrink-0"
                style={{ padding: '20mm 20mm 20mm 24mm', boxSizing: 'border-box' }}
              >
                {showBindingLine && (
                  <div className="no-print absolute left-[20mm] top-0 bottom-0 border-r border-dashed border-blue-400/40 pointer-events-none z-10 flex flex-col justify-center">
                    <span className="bg-blue-50 text-blue-700 text-[10px] px-1 py-0.5 rounded rotate-90 origin-center whitespace-nowrap shadow-xs border border-blue-200">
                      20mm 装订线
                    </span>
                  </div>
                )}

                {/* 页眉标头（已去除右上角文号） */}
                <div className="text-[11px] text-slate-500 font-sans flex items-center justify-between pb-3 border-b border-slate-200 mb-6 shrink-0 print:border-slate-300">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-700">{hospitalName}</span>
                    <span>·</span>
                    <span>规范文书编制前言与实施总则</span>
                  </div>
                </div>

                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <div className="text-center border-b-2 border-red-600 pb-4 mb-6">
                      <div className="text-red-600 font-serif font-bold text-xl sm:text-2xl tracking-wider">
                        {hospitalName} · 规范文书编制前言与实施总则
                      </div>
                      <div className="text-slate-600 font-sans text-xs mt-1 font-medium">
                        文件编号：WLPH-ME-2026-ZB-00 · 制度编制发布总纲
                      </div>
                    </div>

                    <div className="space-y-4 text-xs sm:text-[13px] text-slate-800 leading-relaxed font-serif text-justify">
                      <h3 className="text-sm sm:text-base font-bold text-slate-900 font-sans pb-1 border-b border-slate-200">
                        一、编制背景与指导思想
                      </h3>
                      <p className="indent-8">
                        为进一步健全现代医院管理制度，规范医院医学装备全生命周期安全质量管理与临床合理使用，五莲县人民医院医学装备管理委员会与医学工程保障中心根据国家现行法律法规及三级医院评审标准，制定本套《医学装备管理规章制度与标准化SOP操作规程全集汇编》。
                      </p>

                      <h3 className="text-sm sm:text-base font-bold text-slate-900 font-sans pb-1 border-b border-slate-200 pt-2">
                        二、法定依据与遵循规范
                      </h3>
                      <p className="indent-8">
                        本汇编以国务院令第739号《医疗器械监督管理条例》、原国家卫生计生委《医疗卫生机构医学装备管理办法》为基本准绳，严格对接《医疗器械使用质量监督管理办法》、《中华人民共和国计量法》以及三级医院等级评审细则，强化采购准入、急救与生命支持设备监控、预防性维护（PM）、不良事件监测与强制计量检定等核心管控环节。
                      </p>

                      <h3 className="text-sm sm:text-base font-bold text-slate-900 font-sans pb-1 border-b border-slate-200 pt-2">
                        三、制度体系与标准操作规程闭环
                      </h3>
                      <p className="indent-8">
                        汇编涵盖从论证立项、招标采购、验收入库、临床使用、巡检维保、计量质控到报废处置的全生命周期。每一项制度均配备标准操作规程（SOP）流程表与配套制式表单，形成“岗位明确、步骤清晰、控制点精准、留痕可溯”的闭环质量控制体系。
                      </p>

                      <h3 className="text-sm sm:text-base font-bold text-slate-900 font-sans pb-1 border-b border-slate-200 pt-2">
                        四、全员宣贯与执行考核
                      </h3>
                      <p className="indent-8">
                        本制度汇编自印发之日起全院正式施行。各临床医技科室与管理部门须组织全员深度学习与培训考核。医学工程保障中心建立定期督查评估与动态修订机制，确保制度执行与临床安全同频共振。
                      </p>
                    </div>
                  </div>

                  <div className="mt-8 pt-4 border-t border-slate-200 flex justify-end font-sans text-xs">
                    <div className="text-right space-y-1 text-slate-600">
                      <div className="font-bold text-slate-900">{hospitalName} 医学装备管理委员会</div>
                      <div>医学工程保障中心 · 编制审定</div>
                      <div className="text-slate-500">二〇二六年一月</div>
                    </div>
                  </div>
                </div>

                <div className="text-[11px] text-slate-500 font-sans flex items-center justify-end pt-3 border-t border-slate-200 mt-6 shrink-0 print:border-slate-300">
                  <span className="font-bold text-slate-700 font-mono">
                    第 2 页 / 共 {totalA4Pages} 页
                  </span>
                </div>
              </div>
            )}

            {/* 前言后分页标线 */}
            {includeCover && viewMode === 'all' && (
              <div className="no-print my-6 flex items-center justify-center gap-3 text-xs text-slate-500 select-none">
                <div className="h-px bg-slate-400/40 w-28 sm:w-44" />
                <span className="px-3 py-1 rounded-full bg-slate-200/90 border border-slate-300/80 font-mono text-[11px] text-slate-700 font-medium shadow-xs">
                  第 2 页 完 · 下一页 A4 幅面
                </span>
                <div className="h-px bg-slate-400/40 w-28 sm:w-44" />
              </div>
            )}

            {/* 3. 汇编目录索引 (独立 A4 物理纸张) */}
            {(viewMode === 'all' || selectedSingleId === 'toc') && (
              <div 
                id="page-toc"
                data-page-title="第 3 页 · 制度总汇编目录"
                className="a4-print-page w-[210mm] min-w-[210mm] max-w-[210mm] min-h-[297mm] bg-white shadow-2xl rounded-xs border border-slate-300 mx-auto mb-8 relative flex flex-col justify-between select-text print:shadow-none print:border-none print:m-0 box-border shrink-0"
                style={{ padding: '20mm 20mm 20mm 24mm', boxSizing: 'border-box' }}
              >
                {showBindingLine && (
                  <div className="no-print absolute left-[20mm] top-0 bottom-0 border-r border-dashed border-blue-400/40 pointer-events-none z-10 flex flex-col justify-center">
                    <span className="bg-blue-50 text-blue-700 text-[10px] px-1 py-0.5 rounded rotate-90 origin-center whitespace-nowrap shadow-xs border border-blue-200">
                      20mm 装订线
                    </span>
                  </div>
                )}

                <div className="text-[11px] text-slate-500 font-sans flex items-center justify-between pb-3 border-b border-slate-200 mb-6 shrink-0 print:border-slate-300">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-700">{hospitalName}</span>
                    <span>·</span>
                    <span>制度总汇编目录索引</span>
                  </div>
                </div>

                <div className="flex-1">
                  <div className="text-center pb-4 mb-6 border-b border-slate-200">
                    <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-widest font-serif">
                      制度总汇编目录
                    </h2>
                    <p className="text-xs text-slate-500 font-sans mt-1">
                      全院现行有效医学装备管理规章制度与标准操作规程全集
                    </p>
                  </div>

                  <div className="divide-y divide-slate-200 text-xs sm:text-[13px] font-sans">
                    {targetRegulations.map((reg, idx) => {
                      const docPageNum = (includeCover ? 3 : 1) + idx + 1;
                      return (
                        <div 
                          key={reg.id} 
                          onClick={() => handleScrollToPage(`page-reg-${reg.id}`)}
                          className="py-2.5 flex items-center justify-between gap-3 hover:bg-slate-50/80 px-2 rounded transition-colors cursor-pointer"
                        >
                          <div className="flex items-baseline gap-2 flex-1 min-w-0">
                            <span className="font-mono text-slate-500 w-6 shrink-0 text-right font-bold tracking-tight text-xs">
                              {String(idx + 1).padStart(2, '0')}.
                            </span>
                            <span className="font-bold text-slate-900 break-words leading-snug tracking-tight">
                              {cleanRegulationTitle(reg.title)}
                            </span>
                            <span className="text-slate-400 text-[11px] shrink-0 font-mono hidden sm:inline tracking-tighter">
                              [{reg.docNumber}]
                            </span>
                          </div>
                          <div className="flex items-center gap-2.5 shrink-0">
                            <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[11px] font-medium border border-slate-200 shrink-0 whitespace-nowrap tracking-tight">
                              {reg.category}
                            </span>
                            <span className="text-slate-700 text-xs font-mono font-bold whitespace-nowrap shrink-0 text-right min-w-[64px] tracking-tight">
                              第 {docPageNum} 页
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="text-[11px] text-slate-500 font-sans flex items-center justify-end pt-3 border-t border-slate-200 mt-6 shrink-0 print:border-slate-300">
                  <span className="font-bold text-slate-700 font-mono">
                    第 {includeCover ? 3 : 1} 页 / 共 {totalA4Pages} 页
                  </span>
                </div>
              </div>
            )}

            {/* 目录后分页标线 */}
            {viewMode === 'all' && (
              <div className="no-print my-6 flex items-center justify-center gap-3 text-xs text-slate-500 select-none">
                <div className="h-px bg-slate-400/40 w-28 sm:w-44" />
                <span className="px-3 py-1 rounded-full bg-slate-200/90 border border-slate-300/80 font-mono text-[11px] text-slate-700 font-medium shadow-xs">
                  第 {includeCover ? 3 : 1} 页 完 · 正文 A4 起始页
                </span>
                <div className="h-px bg-slate-400/40 w-28 sm:w-44" />
              </div>
            )}

            {/* 4. 逐份制度正文全文、修订记录与SOP流转图 (每一项制度作为一个独立 A4 纸张页面) */}
            {targetRegulations.map((reg, regIndex) => {
              if (viewMode === 'single' && selectedSingleId !== reg.id) {
                return null;
              }

              const workflow = getRegulationWorkflow(reg);
              const currentPageNum = (includeCover ? 3 : 1) + regIndex + 1;
              const revisionList: RegulationRevisionRecord[] = reg.revisionHistory && reg.revisionHistory.length > 0
                ? reg.revisionHistory
                : [
                    {
                      version: reg.version || 'v1.0',
                      date: reg.revisionDate || reg.effectiveDate || '2026-01-01',
                      approver: '五莲县人民医院 医务处/医学工程中心',
                      author: reg.issuedBy || '医学工程保障中心',
                      summary: '经医院医学工程管理委员会与院长办公会审议通过，正式印发施行。'
                    }
                  ];

              return (
                <React.Fragment key={reg.id}>
                  <div 
                    id={`page-reg-${reg.id}`}
                    data-page-title={`第 ${currentPageNum} 页 · ${cleanRegulationTitle(reg.title)}`}
                    className="a4-print-page w-[210mm] min-w-[210mm] max-w-[210mm] min-h-[297mm] bg-white shadow-2xl rounded-xs border border-slate-300 mx-auto mb-8 relative flex flex-col justify-between select-text print:shadow-none print:border-none print:m-0 box-border shrink-0"
                    style={{ padding: '20mm 20mm 20mm 24mm', boxSizing: 'border-box' }}
                  >
                    {/* 20mm 左侧装订线提示 */}
                    {showBindingLine && (
                      <div className="no-print absolute left-[20mm] top-0 bottom-0 border-r border-dashed border-blue-400/40 pointer-events-none z-10 flex flex-col justify-center">
                        <span className="bg-blue-50 text-blue-700 text-[10px] px-1 py-0.5 rounded rotate-90 origin-center whitespace-nowrap shadow-xs border border-blue-200">
                          20mm 装订线
                        </span>
                      </div>
                    )}

                    {/* 页眉标头（已去除右上角文号） */}
                    <div className="text-[11px] text-slate-500 font-sans flex items-center justify-between pb-3 border-b border-slate-200 mb-6 shrink-0 print:border-slate-300">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-medium text-slate-700 truncate">
                          {cleanRegulationTitle(reg.title)}
                        </span>
                      </div>
                    </div>

                    {/* 正文主体内容 */}
                    <div className="flex-1">
                      {/* 红头公文顶栏 */}
                      <div className="text-center border-b-2 border-red-600 pb-4 mb-6">
                        <div className="text-red-600 font-serif font-bold text-base sm:text-xl tracking-wider">
                          {hospitalName}
                        </div>
                        <div className="text-slate-600 font-sans text-xs mt-1 font-medium">
                          发文字号：{reg.docNumber} &nbsp;|&nbsp; 内部档案编码：{reg.code}
                        </div>
                      </div>

                      {/* 制度标题 */}
                      <div className="text-center my-6">
                        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-wide font-serif leading-snug">
                          {cleanRegulationTitle(reg.title)}
                        </h2>
                        <div className="flex items-center justify-center gap-3 text-xs text-slate-500 font-sans mt-3 flex-wrap">
                          <span>施行日期：{reg.effectiveDate}</span>
                          <span>•</span>
                          <span>当前版本：{reg.version}</span>
                          <span>•</span>
                          <span>管理级别：{LEVEL_MAP[reg.level]?.label}</span>
                          <span>•</span>
                          <span>责任归口：{reg.issuedBy}</span>
                        </div>
                      </div>

                      {/* 摘要与适用范围 - 规范自然段落排版 */}
                      <div className="my-6 space-y-3 text-xs sm:text-[13px] text-slate-800 leading-relaxed font-serif text-justify">
                        <p className="indent-8">
                          <span className="font-bold font-sans text-slate-900">【制度目的与概述】</span>
                          {formatMarkdownText(reg.summary)}
                        </p>
                        <p className="indent-8">
                          <span className="font-bold font-sans text-slate-900">【适用责任部门】</span>
                          {reg.applicableDepartments.join('、')}
                        </p>
                      </div>

                      {/* 制度修订记录台账 */}
                      {includeRevisionHistory && (
                        <div className="my-6 border border-slate-200 rounded-lg overflow-hidden font-sans regulation-no-break">
                          <div className="bg-slate-100 px-3.5 py-2 border-b border-slate-200 flex items-center justify-between text-xs font-bold text-slate-800">
                            <div className="flex items-center gap-2">
                              <History className="w-3.5 h-3.5 text-blue-600" />
                              <span>制度版本沿革与修订记录</span>
                            </div>
                            <span className="text-[11px] text-slate-500 font-normal">
                              共 {revisionList.length} 次修订记录
                            </span>
                          </div>
                          <table className="w-full border-collapse text-[11px] text-left" style={{ tableLayout: 'fixed' }}>
                            <thead className="bg-slate-50 text-slate-700 border-b border-slate-200 font-semibold">
                              <tr>
                                <th className="py-2 px-3 border-r border-slate-200" style={{ width: '12%' }}>版本</th>
                                <th className="py-2 px-3 border-r border-slate-200" style={{ width: '16%' }}>修订日期</th>
                                <th className="py-2 px-3 border-r border-slate-200" style={{ width: '42%' }}>修订原因与主要变更内容</th>
                                <th className="py-2 px-3 border-r border-slate-200" style={{ width: '16%' }}>起草责任单位</th>
                                <th className="py-2 px-3 text-center" style={{ width: '14%' }}>审批状态</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 text-slate-700">
                              {revisionList.map((rev, rIdx) => (
                                <tr key={rIdx} className="hover:bg-slate-50/50">
                                  <td className="py-2 px-3 font-mono font-bold text-blue-700 border-r border-slate-200">
                                    {rev.version}
                                  </td>
                                  <td className="py-2 px-3 text-slate-600 font-mono border-r border-slate-200">
                                    {rev.date}
                                  </td>
                                  <td className="py-2 px-3 text-slate-800 leading-normal border-r border-slate-200">
                                    {formatMarkdownText(rev.summary)}
                                  </td>
                                  <td className="py-2 px-3 text-slate-600 border-r border-slate-200">
                                    {rev.author || reg.issuedBy}
                                  </td>
                                  <td className="py-2 px-3 text-slate-600 text-center font-normal">
                                    已审定执行
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}

                      {/* 制度正文条例 */}
                      <div className="space-y-3 text-xs sm:text-[13px] text-slate-800 leading-relaxed font-serif text-justify my-6">
                        {reg.content.split(/\r?\n/).filter(line => line.trim().length > 0).map((line, idx) => {
                          const trimmed = line.trim();
                          if (trimmed.startsWith('### ')) {
                            return (
                              <h3 key={idx} className="text-sm sm:text-base font-bold text-slate-900 pt-4 pb-1 border-b border-slate-200 font-sans tracking-wide" style={{ breakAfter: 'avoid' }}>
                                {formatMarkdownText(trimmed.replace('### ', ''))}
                              </h3>
                            );
                          }
                          const isListItem = /^\d+[\.、]/.test(trimmed);
                          return (
                            <p 
                              key={idx} 
                              className={isListItem ? "pl-8 sm:pl-10 text-slate-700" : "indent-8 text-slate-800"}
                            >
                              {formatMarkdownText(trimmed)}
                            </p>
                          );
                        })}
                      </div>

                      {/* 配套 SOP 标准操作流程表 */}
                      {includeSopWorkflows && workflow && workflow.steps && (
                        <div className="mt-8 pt-6 border-t-2 border-dashed border-slate-300 regulation-no-break">
                          <div className="mb-3 font-sans space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="w-2.5 h-2.5 bg-blue-600 rounded-full shrink-0" />
                              <h4 className="font-bold text-xs sm:text-sm text-slate-900">
                                配套标准操作规程 (SOP)：{workflow.workflowName} ({workflow.workflowCode})
                              </h4>
                            </div>
                            {workflow.cycleTime && (
                              <div className="text-[11px] text-slate-600 pl-4.5 leading-normal">
                                <span className="text-slate-500 font-medium">基准时限：</span>
                                <span>{workflow.cycleTime}</span>
                              </div>
                            )}
                          </div>

                          <table className="w-full border-collapse border border-slate-300 text-[11px] font-sans" style={{ tableLayout: 'fixed' }}>
                            <thead>
                              <tr className="bg-slate-100 text-slate-800">
                                <th className="border border-slate-300 p-2 text-center" style={{ width: '8%' }}>环节</th>
                                <th className="border border-slate-300 p-2 text-left" style={{ width: '20%' }}>执行步骤</th>
                                <th className="border border-slate-300 p-2 text-left" style={{ width: '16%' }}>责任岗位/人员</th>
                                <th className="border border-slate-300 p-2 text-left" style={{ width: '38%' }}>操作规范与关键控制点</th>
                                <th className="border border-slate-300 p-2 text-left" style={{ width: '18%' }}>配套制式表单</th>
                              </tr>
                            </thead>
                            <tbody>
                              {workflow.steps.map((st) => (
                                <tr key={st.stepNumber} className="hover:bg-slate-50">
                                  <td className="border border-slate-300 p-2 text-center font-bold text-blue-700">
                                    {st.stepNumber}
                                  </td>
                                  <td className="border border-slate-300 p-2 font-bold text-slate-900">
                                    {st.title}
                                  </td>
                                  <td className="border border-slate-300 p-2 text-slate-700">
                                    {st.role}
                                  </td>
                                  <td className="border border-slate-300 p-2 text-slate-700 leading-normal">
                                    {formatMarkdownText(st.actionDescription)}
                                  </td>
                                  <td className="border border-slate-300 p-2 text-slate-600 font-mono text-[10px]">
                                    {st.deliverables ? formatMarkdownText(st.deliverables) : '业务系统留痕记账'}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}

                      {/* 责任科室发文落款 */}
                      <div className="mt-8 flex justify-end font-sans text-xs">
                        <div className="text-right space-y-1 text-slate-600">
                          <div>发文责任科室：<span className="font-semibold text-slate-800">{reg.issuedBy}</span></div>
                          <div>归档文书编号：<span className="font-mono text-slate-700">{reg.code}</span></div>
                          <div>生效执行日期：<span className="font-mono text-slate-700">{reg.effectiveDate}</span></div>
                        </div>
                      </div>
                    </div>

                    {/* 页脚线与真实连续物理页码 */}
                    <div className="text-[11px] text-slate-500 font-sans flex items-center justify-end pt-3 border-t border-slate-200 mt-6 shrink-0 print:border-slate-300">
                      <span className="font-bold text-slate-700 font-mono">
                        第 {currentPageNum} 页 / 共 {totalA4Pages} 页
                      </span>
                    </div>
                  </div>

                  {/* 篇章之间 A4 分割线（仅全册预览屏幕显示） */}
                  {viewMode === 'all' && regIndex < targetRegulations.length - 1 && (
                    <div className="no-print my-6 flex items-center justify-center gap-3 text-xs text-slate-500 select-none">
                      <div className="h-px bg-slate-400/40 w-28 sm:w-44" />
                      <span className="px-3 py-1 rounded-full bg-slate-200/90 border border-slate-300/80 font-mono text-[11px] text-slate-700 font-medium shadow-xs">
                        第 {currentPageNum} 页 完 · 下一页 A4 幅面
                      </span>
                      <div className="h-px bg-slate-400/40 w-28 sm:w-44" />
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

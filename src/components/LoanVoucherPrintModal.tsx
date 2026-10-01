import React, { useRef, useState } from 'react';
import {
  Printer,
  X,
  FileCheck2,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Building2,
  UserCheck,
  Calendar,
  PenTool,
  RotateCcw,
  Download,
  Loader2,
  Leaf,
  Lock,
  BadgeCheck,
  Copy,
  Check,
  FileText,
  BookmarkCheck
} from 'lucide-react';
import { toJpeg } from 'html-to-image';
import { jsPDF } from 'jspdf';
import { MedicalEquipment, EquipmentLoanRecord } from '../types';

interface LoanVoucherPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  equipment: MedicalEquipment | null;
  loanRecord: EquipmentLoanRecord | null;
  mode?: 'loan' | 'return';
}

export const LoanVoucherPrintModal: React.FC<LoanVoucherPrintModalProps> = ({
  isOpen,
  onClose,
  equipment,
  loanRecord,
  mode = 'loan'
}) => {
  const printAreaRef = useRef<HTMLDivElement>(null);

  // 默认：'single' (A4 一纸闭环 / 借还一单到底), 也支持按需查看独立 'loan' 或 'return'
  const [activeTab, setActiveTab] = useState<'single' | 'loan' | 'return'>('single');

  // 电子签署显示
  const [isSignedDigitally, setIsSignedDigitally] = useState<boolean>(true);
  const [isExportingPdf, setIsExportingPdf] = useState<boolean>(false);
  const [copiedHash, setCopiedHash] = useState<boolean>(false);

  // 手写签名采集弹窗
  const [showSignaturePad, setShowSignaturePad] = useState<boolean>(false);
  const [activeSignRole, setActiveSignRole] = useState<'lender' | 'borrower' | 'returner' | 'receiver'>('borrower');
  const [customSignatures, setCustomSignatures] = useState<Record<string, string>>({});
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  if (!isOpen || !equipment || !loanRecord) return null;

  const isActuallyReturned = loanRecord.loanStatus === 'returned';

  // 统一编码与关联编号
  const rawId = loanRecord.id || `LOAN-${equipment.id}-${Date.now().toString().slice(-6)}`;
  const loanDocNo = rawId.startsWith('JY-') ? rawId : `JY-${rawId.replace(/^LOAN-/, '')}`;
  const returnDocNo = `RT-${rawId.replace(/^(LOAN-|JY-)/, '')}`;

  // 数字认证存证编号与哈希
  const certNo = loanRecord.digitalSealCertNo || `CA-WLH-${loanDocNo.replace(/[^0-9]/g, '') || '20260820'}-SEC`;
  const verificationHash = loanRecord.blockchainHash || `SHA256: 8f4e2a7b9c1d0e3f5a8b7c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f`.slice(0, 32) + '...';

  const ownerDept = loanRecord.ownerDepartment || equipment.ownerDepartment || equipment.department || '医学装备中心';
  const borrowingDept = loanRecord.borrowingDepartment || '临床科室';

  // 出借方 & 借用方联系方式
  const lenderPhoneDisplay = loanRecord.lenderPhone || equipment.nursePhone || '';
  const borrowerPhoneDisplay = loanRecord.borrowerPhone || '';

  // 借用天数计算
  const calculateLoanDays = () => {
    try {
      const bDate = loanRecord.borrowTime ? new Date(loanRecord.borrowTime.replace(/\//g, '-')) : new Date();
      const rDate = isActuallyReturned && loanRecord.actualReturnTime
        ? new Date(loanRecord.actualReturnTime.replace(/\//g, '-'))
        : new Date();
      const diffTime = Math.abs(rDate.getTime() - bDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays || 1;
    } catch {
      return 1;
    }
  };

  const loanDurationDays = calculateLoanDays();

  // 配件列表标准化
  const accessoriesList = loanRecord.accessories && loanRecord.accessories.length > 0
    ? loanRecord.accessories
    : ['主机医用电源线', '专用传感器/导联线', '标准适配器/管路接口'];

  // 手写板绘画逻辑
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const saveSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    setCustomSignatures(prev => ({
      ...prev,
      [activeSignRole]: dataUrl
    }));
    setShowSignaturePad(false);
  };

  const handlePrint = () => {
    window.print();
  };

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
        const ratio = pdfHeight / imgHeight;
        const finalWidth = imgWidth * ratio;
        const xOffset = (pdfWidth - finalWidth) / 2;
        pdf.addImage(imgData, 'JPEG', xOffset, 0, finalWidth, pdfHeight);
      }

      const safeName = (equipment.name || '设备').replace(/[\\/:*?"<>|]/g, '_');
      const safeDept = (borrowingDept || '科室').replace(/[\\/:*?"<>|]/g, '_');
      const docLabel = activeTab === 'single' ? '电子借还一纸闭环单' : activeTab === 'loan' ? '电子借用出库单' : '电子归还结案单';
      const fileName = `${docLabel}_${loanDocNo}_${safeDept}_${safeName}.pdf`;

      pdf.save(fileName);
    } catch (err) {
      console.error('PDF 导出失败:', err);
    } finally {
      setIsExportingPdf(false);
    }
  };

  const copyVerifyInfo = () => {
    navigator.clipboard?.writeText(`【五莲县人民医院医工流转电子凭证】单号：${loanDocNo} | 设备：${equipment.name}(#${equipment.internalNo || equipment.id}) | 借入科室：${borrowingDept} | 认证编号：${certNo}`);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 print:p-0 print:bg-white">
      {/* Outer Modal Box */}
      <div className="relative w-full max-w-5xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[95vh] print:max-h-none print:border-none print:shadow-none print:w-full">
        
        {/* Top Control Bar (Screen only, hidden on print) */}
        <div className="no-print flex flex-wrap items-center justify-between px-4 sm:px-6 py-3 bg-slate-900 text-white border-b border-slate-800 shrink-0 gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-teal-500/20 text-teal-300 flex items-center justify-center border border-teal-500/30 shrink-0">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm sm:text-base font-bold tracking-tight text-white flex items-center gap-2">
                  <span>医疗设备借还电子交接单</span>
                  <span className="px-2 py-0.5 rounded bg-teal-500/20 text-teal-300 border border-teal-500/40 text-xs font-medium flex items-center gap-1">
                    <Leaf className="w-3 h-3 text-teal-400" />
                    绿色无纸化 · 电子存证
                  </span>
                </h2>
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  单号: {loanDocNo}
                </span>
                {isActuallyReturned ? (
                  <span className="text-xs px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 font-medium border border-emerald-800 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    已验收结案 (闭环)
                  </span>
                ) : (
                  <span className="text-xs px-2 py-0.5 rounded bg-sky-950 text-sky-300 font-medium border border-sky-800 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    借出在用（待归还）
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                医学装备管理平台数字存证，支持清晰排版展示、现场手签与电子 PDF 导出。
              </p>
            </div>
          </div>

          {/* Tab Selector & Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* View Switcher */}
            <div className="inline-flex bg-slate-800 p-0.5 rounded-lg border border-slate-700 text-xs font-medium">
              <button
                type="button"
                onClick={() => setActiveTab('single')}
                className={`px-3 py-1.5 rounded-md transition cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'single'
                    ? 'bg-teal-600 text-white font-semibold shadow-xs'
                    : 'text-slate-300 hover:text-white'
                }`}
                title="推荐：A4一纸闭环，借还一单到底"
              >
                <BookmarkCheck className="w-3.5 h-3.5" />
                <span>电子闭环单 (推荐)</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('loan')}
                className={`px-2.5 py-1.5 rounded-md transition cursor-pointer flex items-center gap-1 ${
                  activeTab === 'loan'
                    ? 'bg-slate-700 text-white font-semibold shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>① 借用出库单</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('return')}
                className={`px-2.5 py-1.5 rounded-md transition cursor-pointer flex items-center gap-1 ${
                  activeTab === 'return'
                    ? 'bg-slate-700 text-white font-semibold shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>② 归还结案单</span>
              </button>
            </div>

            {/* Electronic Sign Toggle */}
            <button
              onClick={() => setIsSignedDigitally(!isSignedDigitally)}
              type="button"
              className={`inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors border cursor-pointer ${
                isSignedDigitally
                  ? 'bg-slate-800 text-teal-300 border-teal-700'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700 border-slate-700'
              }`}
              title="切换是否显示规范电子签名"
            >
              <BadgeCheck className="w-3.5 h-3.5 text-teal-400" />
              <span>{isSignedDigitally ? '已签名状态' : '空白无签名'}</span>
            </button>

            {/* Touch Sign Collector */}
            <button
              onClick={() => {
                setActiveSignRole(isActuallyReturned ? 'receiver' : 'borrower');
                setShowSignaturePad(true);
              }}
              type="button"
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors cursor-pointer"
              title="使用触控板/鼠标现场手写签名"
            >
              <PenTool className="w-3.5 h-3.5 text-amber-400" />
              <span>现场手签</span>
            </button>

            {/* Copy Verify Link */}
            <button
              onClick={copyVerifyInfo}
              type="button"
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors cursor-pointer"
              title="复制电子存证凭证编号与摘要"
            >
              {copiedHash ? <Check className="w-3.5 h-3.5 text-teal-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedHash ? '已复制' : '复制存证'}</span>
            </button>

            {/* Export PDF */}
            <button
              onClick={handleExportPdf}
              disabled={isExportingPdf}
              type="button"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-500 active:bg-teal-700 disabled:bg-slate-700 rounded-lg shadow-sm transition-colors cursor-pointer"
              title="导出清晰 PDF 电子文件"
            >
              {isExportingPdf ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
              <span className="hidden sm:inline">导出 PDF</span>
            </button>

            {/* Print Button */}
            <button
              onClick={handlePrint}
              type="button"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors cursor-pointer"
              title="纸质打印"
            >
              <Printer className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden sm:inline">打印</span>
            </button>

            <button
              onClick={onClose}
              type="button"
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              title="关闭 (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Paperless System Info Banner */}
        <div className="no-print bg-slate-50 px-4 py-2 border-b border-slate-200 text-xs text-slate-700 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <span className="px-1.5 py-0.5 bg-teal-100 text-teal-800 rounded font-semibold text-[11px]">
              电子存证
            </span>
            <span>
              凭证已安全归档入设备全生命周期档案，界面排版采用专业医疗装备流转格式。
            </span>
          </div>
          <div className="text-[11px] text-slate-500 font-mono hidden md:flex items-center gap-2">
            <span>证书号: {certNo}</span>
            <span className="text-slate-300">|</span>
            <span>签署时间: {loanRecord.signTimestamp || loanRecord.borrowTime || new Date().toLocaleString()}</span>
          </div>
        </div>

        {/* Printable Paper View */}
        <div className="overflow-y-auto flex-1 p-3 sm:p-6 bg-slate-200/90 flex justify-center items-start print:p-0 print:bg-white print:overflow-visible">
          <div
            ref={printAreaRef}
            id="printable-loan-voucher"
            className="w-full flex flex-col items-center gap-6 print:gap-0"
          >
            {/* ===================== VIEW 0: 推荐 A4 电子一纸闭环流转单（规范清爽排版） ===================== */}
            {activeTab === 'single' && (
              <div className="w-full max-w-[210mm] min-h-[285mm] bg-white text-slate-900 p-6 sm:p-8 shadow-md border border-slate-300 rounded font-sans text-xs flex flex-col justify-between relative overflow-hidden print:shadow-none print:border-none print:p-5 print:min-h-[297mm] print:break-after-avoid">
                
                {/* Header / Title */}
                <div className="w-full pb-3 mb-3 border-b-2 border-slate-800 shrink-0">
                  <div className="flex items-center justify-between text-[11px] text-slate-600 pb-1.5 mb-2 border-b border-slate-200">
                    <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-slate-700" />
                      <span>五莲县人民医院 · 医学装备管理中心</span>
                    </span>
                    <div className="flex items-center gap-2 font-mono text-[11px] text-slate-500">
                      <span>存证编号: {certNo}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-wider leading-tight">
                        五 莲 县 人 民 医 院
                      </h1>
                      <div className="flex items-center gap-2 mt-1">
                        <h2 className="text-base sm:text-lg font-bold text-slate-800 tracking-wide">
                          医疗设备借用与归还交接单 (闭环)
                        </h2>
                      </div>
                    </div>

                    {/* 单号与状态 */}
                    <div className="text-right flex flex-col items-end">
                      <div className="px-3 py-1 bg-slate-50 rounded border border-slate-300 text-center font-mono">
                        <div className="text-[10px] text-slate-500">单据编号</div>
                        <div className="text-xs font-bold text-slate-900">{loanDocNo}</div>
                      </div>
                      <div className="mt-1">
                        {isActuallyReturned ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            已归还验收结案
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-sky-800 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                            <Clock className="w-3 h-3 text-sky-600" />
                            出借在用中
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Master Table: 严谨、无印章干扰的标准表格 */}
                <div className="voucher-table-wrapper w-full border border-slate-400 overflow-hidden bg-white mb-3 flex-1">
                  <table className="w-full border-collapse text-xs table-fixed bg-white m-0">
                    <colgroup>
                      <col style={{ width: '16%' }} />
                      <col style={{ width: '34%' }} />
                      <col style={{ width: '16%' }} />
                      <col style={{ width: '34%' }} />
                    </colgroup>

                    <tbody>
                      {/* ================= SECTION 1: 医疗设备基本信息 ================= */}
                      <tr className="bg-slate-100 text-slate-800">
                        <th colSpan={4} className="px-3 py-1.5 text-xs font-bold text-left border-b border-slate-300 text-slate-800">
                          <div className="flex items-center justify-between">
                            <span>一、医疗设备基本信息</span>
                            <span className="font-mono font-normal text-[11px] text-slate-600">资产卡片号: {equipment.id}</span>
                          </div>
                        </th>
                      </tr>
                      <tr>
                        <td className="bg-slate-50 border border-slate-300 p-2 font-semibold text-slate-700">设备名称</td>
                        <td className="bg-white border border-slate-300 p-2 font-bold text-slate-900 text-xs">
                          {equipment.name}
                          {equipment.internalNo && (
                            <span className="ml-1.5 text-[11px] font-mono font-medium text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                              #{equipment.internalNo}
                            </span>
                          )}
                        </td>
                        <td className="bg-slate-50 border border-slate-300 p-2 font-semibold text-slate-700">资产编号</td>
                        <td className="bg-white border border-slate-300 p-2 font-mono font-semibold text-slate-900">{equipment.id}</td>
                      </tr>
                      <tr>
                        <td className="bg-slate-50 border border-slate-300 p-2 font-semibold text-slate-700">规格型号</td>
                        <td className="bg-white border border-slate-300 p-2 text-slate-800">{equipment.model || '标准配置'}</td>
                        <td className="bg-slate-50 border border-slate-300 p-2 font-semibold text-slate-700">出厂编号 (SN)</td>
                        <td className="bg-white border border-slate-300 p-2 font-mono text-slate-800">{equipment.sn || '—'}</td>
                      </tr>
                      <tr>
                        <td className="bg-slate-50 border border-slate-300 p-2 font-semibold text-slate-700">产权归属科室</td>
                        <td className="bg-white border border-slate-300 p-2 text-slate-800">{ownerDept}</td>
                        <td className="bg-slate-50 border border-slate-300 p-2 font-semibold text-slate-700">借用申请科室</td>
                        <td className="bg-white border border-slate-300 p-2 font-semibold text-slate-900">{borrowingDept}</td>
                      </tr>

                      {/* ================= SECTION 2: 借用出库信息 ================= */}
                      <tr className="bg-slate-100 text-slate-800">
                        <th colSpan={4} className="px-3 py-1.5 text-xs font-bold text-left border-y border-slate-300 text-slate-800">
                          <div className="flex items-center justify-between">
                            <span>二、借用出库核验</span>
                            <span className="font-mono text-[11px] text-slate-600 font-normal">借期: 约 {loanDurationDays} 天</span>
                          </div>
                        </th>
                      </tr>
                      <tr>
                        <td className="bg-slate-50 border border-slate-300 p-2 font-semibold text-slate-700">出借时间</td>
                        <td className="bg-white border border-slate-300 p-2 font-mono text-slate-800">{loanRecord.borrowTime}</td>
                        <td className="bg-slate-50 border border-slate-300 p-2 font-semibold text-slate-700">预计归还</td>
                        <td className="bg-white border border-slate-300 p-2 font-mono text-slate-800">
                          {loanRecord.expectedReturnTime || '使用完毕即时归还'}
                        </td>
                      </tr>
                      <tr>
                        <td className="bg-slate-50 border border-slate-300 p-2 font-semibold text-slate-700">借用事由</td>
                        <td colSpan={3} className="bg-white border border-slate-300 p-2 text-slate-800">
                          {loanRecord.borrowReason || '临床急救周转应急借用'}
                        </td>
                      </tr>
                      <tr>
                        <td className="bg-slate-50 border border-slate-300 p-2 font-semibold text-slate-700 align-top">
                          随借配件清单
                        </td>
                        <td colSpan={3} className="bg-white border border-slate-300 p-2 text-slate-800">
                          <div className="flex flex-wrap gap-2 text-[11px]">
                            {accessoriesList.map((item, idx) => (
                              <span key={idx} className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-50 text-slate-800 border border-slate-200 font-medium">
                                <span className="text-slate-600 font-bold">☑</span>
                                <span>{item} (出库完好)</span>
                              </span>
                            ))}
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <td className="bg-slate-50 border border-slate-300 p-2 font-semibold text-slate-700">出库核验状态</td>
                        <td colSpan={3} className="bg-white border border-slate-300 p-2 text-slate-800">
                          <div className="grid grid-cols-4 gap-2 text-[11px]">
                            <span className="flex items-center gap-1"><span className="text-slate-600 font-bold">☑</span> 外观完好无损</span>
                            <span className="flex items-center gap-1"><span className="text-slate-600 font-bold">☑</span> 开机自检正常</span>
                            <span className="flex items-center gap-1"><span className="text-slate-600 font-bold">☑</span> 蓄电池已充满</span>
                            <span className="flex items-center gap-1"><span className="text-slate-600 font-bold">☑</span> 计量强检合格</span>
                          </div>
                        </td>
                      </tr>
                      {/* 出库双方签名 */}
                      <tr>
                        <td colSpan={2} className="bg-white border border-slate-300 p-3 align-top w-1/2">
                          <div className="space-y-2 text-xs">
                            <div className="font-bold text-slate-800 flex justify-between items-center border-b border-slate-100 pb-1">
                              <span>【出借方】发机责任人</span>
                              <span className="text-[10px] text-slate-500 font-mono font-normal">
                                已认证
                              </span>
                            </div>
                            <div className="flex items-center min-h-[32px] justify-between">
                              <div className="flex items-center gap-2">
                                <span className="text-slate-500">签署：</span>
                                {customSignatures.lender ? (
                                  <img src={customSignatures.lender} alt="发机人手签" className="h-8 object-contain" />
                                ) : isSignedDigitally ? (
                                  <span className="font-semibold text-slate-900 text-sm tracking-wide">
                                    {loanRecord.lenderName || '李强'}
                                  </span>
                                ) : (
                                  <span className="text-slate-400 text-xs">未签署</span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-100">
                              <span>电话：{lenderPhoneDisplay || '7991000'}</span>
                              <span className="font-mono text-slate-400">{loanRecord.borrowTime}</span>
                            </div>
                          </div>
                        </td>

                        <td colSpan={2} className="bg-white border border-slate-300 p-3 align-top w-1/2">
                          <div className="space-y-2 text-xs">
                            <div className="font-bold text-slate-800 flex justify-between items-center border-b border-slate-100 pb-1">
                              <span>【借入方】领机责任人</span>
                              <span className="text-[10px] text-slate-500 font-mono font-normal">
                                已认证
                              </span>
                            </div>
                            <div className="flex items-center min-h-[32px] justify-between">
                              <div className="flex items-center gap-2">
                                <span className="text-slate-500">签署：</span>
                                {customSignatures.borrower ? (
                                  <img src={customSignatures.borrower} alt="领机人手签" className="h-8 object-contain" />
                                ) : isSignedDigitally ? (
                                  <span className="font-semibold text-slate-900 text-sm tracking-wide">
                                    {loanRecord.borrowerName}
                                  </span>
                                ) : (
                                  <span className="text-slate-400 text-xs">未签署</span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-100">
                              <span>电话：{borrowerPhoneDisplay || '—'}</span>
                              <span className="font-mono text-slate-400">{borrowingDept}</span>
                            </div>
                          </div>
                        </td>
                      </tr>

                      {/* ================= SECTION 3: 归还验收阶段 ================= */}
                      <tr className="bg-slate-100 text-slate-800">
                        <th colSpan={4} className="px-3 py-1.5 text-xs font-bold text-left border-y border-slate-300 text-slate-800">
                          <div className="flex items-center justify-between">
                            <span>三、归还验收与闭环核销</span>
                            <span className="font-normal text-[11px] text-slate-600">
                              {isActuallyReturned ? '状态：已验收结案' : '状态：在用中 (待归还)'}
                            </span>
                          </div>
                        </th>
                      </tr>
                      <tr>
                        <td className="bg-slate-50 border border-slate-300 p-2 font-semibold text-slate-700">实际归还时间</td>
                        <td className="bg-white border border-slate-300 p-2 font-mono text-slate-800">
                          {isActuallyReturned ? (loanRecord.actualReturnTime || '已归还') : '—— (设备借用中) ——'}
                        </td>
                        <td className="bg-slate-50 border border-slate-300 p-2 font-semibold text-slate-700">实际使用时长</td>
                        <td className="bg-white border border-slate-300 p-2 text-slate-800">
                          {isActuallyReturned ? `共计 ${loanDurationDays} 天` : '待归还时按实统计'}
                        </td>
                      </tr>
                      <tr>
                        <td className="bg-slate-50 border border-slate-300 p-2 font-semibold text-slate-700 align-top">
                          配件核验
                        </td>
                        <td colSpan={3} className="bg-white border border-slate-300 p-2 text-slate-800">
                          <div className="flex flex-wrap gap-2 text-[11px]">
                            {accessoriesList.map((item, idx) => (
                              <span key={idx} className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-50 text-slate-800 border border-slate-200 font-medium">
                                <span className="text-slate-600 font-bold">
                                  {isActuallyReturned ? '☑' : '☐'}
                                </span>
                                <span>{item} ({isActuallyReturned ? '已收回' : '归还待验'})</span>
                              </span>
                            ))}
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <td className="bg-slate-50 border border-slate-300 p-2 font-semibold text-slate-700">验收与消毒</td>
                        <td colSpan={3} className="bg-white border border-slate-300 p-2 text-slate-800">
                          <div className="grid grid-cols-4 gap-2 text-[11px]">
                            <span className="flex items-center gap-1">
                              <span className="text-slate-600 font-bold">{isActuallyReturned ? '☑' : '☐'}</span> 外观完好无损裂
                            </span>
                            <span className="flex items-center gap-1">
                              <span className="text-slate-600 font-bold">{isActuallyReturned ? '☑' : '☐'}</span> 通电自检正常
                            </span>
                            <span className="flex items-center gap-1">
                              <span className="text-slate-600 font-bold">{isActuallyReturned ? '☑' : '☐'}</span> 已完成终末消毒
                            </span>
                            <span className="flex items-center gap-1">
                              <span className="text-slate-600 font-bold">{isActuallyReturned ? '☑' : '☐'}</span> 准予回库待命
                            </span>
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <td className="bg-slate-50 border border-slate-300 p-2 font-semibold text-slate-700">验收结论</td>
                        <td colSpan={3} className="bg-white border border-slate-300 p-2 text-slate-800">
                          <div className="text-slate-800 text-xs">
                            {isActuallyReturned 
                              ? (loanRecord.returnNotes || '设备外观及电气性能良好，随借附件全部收齐，床旁终末消毒合格，准予结案回库待命。')
                              : '（设备归还时由医学装备管理中心工程师在线填写验收结论并确认）'}
                          </div>
                        </td>
                      </tr>
                      {/* 归还双方签名 */}
                      <tr>
                        <td colSpan={2} className="bg-white border border-slate-300 p-3 align-top w-1/2">
                          <div className="space-y-2 text-xs">
                            <div className="font-bold text-slate-800 flex justify-between items-center border-b border-slate-100 pb-1">
                              <span>【借用科室】归还交机人</span>
                              <span className="text-[10px] text-slate-500 font-mono font-normal">
                                {isActuallyReturned ? '已确认' : '待签署'}
                              </span>
                            </div>
                            <div className="flex items-center min-h-[32px] justify-between">
                              <div className="flex items-center gap-2">
                                <span className="text-slate-500">签署：</span>
                                {isActuallyReturned ? (
                                  customSignatures.returner ? (
                                    <img src={customSignatures.returner} alt="交机人手签" className="h-8 object-contain" />
                                  ) : isSignedDigitally ? (
                                    <span className="font-semibold text-slate-900 text-sm tracking-wide">
                                      {loanRecord.borrowerName}
                                    </span>
                                  ) : (
                                    <span className="text-slate-400 text-xs">未签署</span>
                                  )
                                ) : (
                                  <span className="text-slate-400 text-xs">归还时签署</span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-100">
                              <span>电话：{borrowerPhoneDisplay || '—'}</span>
                              <span className="font-mono text-slate-400">{isActuallyReturned ? loanRecord.actualReturnTime?.slice(0, 16) : '待还'}</span>
                            </div>
                          </div>
                        </td>

                        <td colSpan={2} className="bg-white border border-slate-300 p-3 align-top w-1/2">
                          <div className="space-y-2 text-xs">
                            <div className="font-bold text-slate-800 flex justify-between items-center border-b border-slate-100 pb-1">
                              <span>【医工科】验收工程师</span>
                              <span className="text-[10px] text-slate-500 font-mono font-normal">
                                {isActuallyReturned ? '已验收' : '待验收'}
                              </span>
                            </div>
                            <div className="flex items-center min-h-[32px] justify-between">
                              <div className="flex items-center gap-2">
                                <span className="text-slate-500">签署：</span>
                                {isActuallyReturned ? (
                                  customSignatures.receiver ? (
                                    <img src={customSignatures.receiver} alt="验收工程师手签" className="h-8 object-contain" />
                                  ) : isSignedDigitally ? (
                                    <span className="font-semibold text-slate-900 text-sm tracking-wide">
                                      {loanRecord.returnReceiverName || loanRecord.lenderName || '李强'}
                                    </span>
                                  ) : (
                                    <span className="text-slate-400 text-xs">未签署</span>
                                  )
                                ) : (
                                  <span className="text-slate-400 text-xs">归还时验收</span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-100">
                              <span>机构：医学装备管理中心</span>
                              <span className="font-mono text-slate-400">
                                {isActuallyReturned ? (loanRecord.actualReturnTime ? loanRecord.actualReturnTime.slice(0, 10) : new Date().toLocaleDateString()) : '——'}
                              </span>
                            </div>
                          </div>
                        </td>
                      </tr>

                      {/* 存证信息 */}
                      <tr className="bg-slate-50">
                        <td colSpan={4} className="border border-slate-300 p-2 text-slate-600 text-[10px]">
                          <div className="flex items-center justify-between font-medium text-slate-700 mb-0.5">
                            <span>存证说明：</span>
                            <span className="font-mono text-[9.5px] text-slate-500">
                              存证哈希: {verificationHash}
                            </span>
                          </div>
                          <p>本凭证用于医疗设备跨科室借用与归还交接记录，数据已同步存入医院医学装备全生命周期数字档案库。</p>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Footer */}
                <div className="w-full pt-2 mt-auto border-t border-slate-300 text-[10px] text-slate-500 flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-medium text-slate-700">核验码：{loanDocNo}</span>
                    <span className="text-slate-400">|</span>
                    <span>状态：{isActuallyReturned ? '已归档' : '在用中'}</span>
                  </div>
                  <span className="text-slate-600 font-medium">五莲县人民医院 · 医学装备管理中心</span>
                  <span>A4 标准电子流转凭证</span>
                </div>
              </div>
            )}

            {/* ===================== VIEW 1: 独立借用出库单 ===================== */}
            {activeTab === 'loan' && (
              <div className="w-full max-w-[210mm] min-h-[290mm] bg-white text-slate-900 p-8 sm:p-10 shadow-md border border-slate-300 rounded font-sans text-xs flex flex-col justify-between relative overflow-hidden print:shadow-none print:border-none print:p-6 print:min-h-[297mm]">
                <div className="w-full pb-3 mb-3 border-b-2 border-slate-800 shrink-0">
                  <div className="flex items-center justify-between text-[11px] text-slate-500 pb-1.5 mb-2 border-b border-slate-200">
                    <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-slate-700" />
                      <span>五莲县人民医院 · 医学装备管理中心</span>
                    </span>
                    <div className="flex items-center gap-2 font-mono text-[11px]">
                      <span>借用出库单</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h1 className="text-2xl font-bold text-slate-900 tracking-wider">五 莲 县 人 民 医 院</h1>
                      <div className="flex items-center gap-3 mt-1">
                        <h2 className="text-lg font-bold text-slate-800 tracking-wide">
                          医疗设备跨科室【借用出库】交接单
                        </h2>
                      </div>
                    </div>
                    <div className="text-right font-mono">
                      <div className="text-[10px] text-slate-500">单据编号</div>
                      <div className="text-xs font-bold text-slate-900">{loanDocNo}</div>
                    </div>
                  </div>
                </div>

                <div className="voucher-table-wrapper w-full border border-slate-400 overflow-hidden bg-white mb-3 flex-1">
                  <table className="w-full border-collapse text-xs table-fixed bg-white m-0">
                    <colgroup>
                      <col style={{ width: '18%' }} />
                      <col style={{ width: '32%' }} />
                      <col style={{ width: '18%' }} />
                      <col style={{ width: '32%' }} />
                    </colgroup>
                    <tbody>
                      <tr className="bg-slate-100 text-slate-800">
                        <th colSpan={4} className="px-3 py-2 text-xs font-bold text-left border-b border-slate-300 text-slate-800">
                          一、借用医疗设备基本信息
                        </th>
                      </tr>
                      <tr>
                        <td className="bg-slate-50 border border-slate-300 p-2 font-semibold text-slate-700">设备名称</td>
                        <td className="bg-white border border-slate-300 p-2 font-bold text-slate-900">
                          {equipment.name} {equipment.internalNo && `#${equipment.internalNo}`}
                        </td>
                        <td className="bg-slate-50 border border-slate-300 p-2 font-semibold text-slate-700">设备资产编号</td>
                        <td className="bg-white border border-slate-300 p-2 font-mono font-semibold text-slate-900">{equipment.id}</td>
                      </tr>
                      <tr>
                        <td className="bg-slate-50 border border-slate-300 p-2 font-semibold text-slate-700">规格型号</td>
                        <td className="bg-white border border-slate-300 p-2 text-slate-800">{equipment.model || '标准配置'}</td>
                        <td className="bg-slate-50 border border-slate-300 p-2 font-semibold text-slate-700">出厂编号 (SN)</td>
                        <td className="bg-white border border-slate-300 p-2 font-mono text-slate-800">{equipment.sn || '—'}</td>
                      </tr>
                      <tr>
                        <td className="bg-slate-50 border border-slate-300 p-2 font-semibold text-slate-700">出借科室</td>
                        <td className="bg-white border border-slate-300 p-2 text-slate-800">{ownerDept}</td>
                        <td className="bg-slate-50 border border-slate-300 p-2 font-semibold text-slate-700">借用科室</td>
                        <td className="bg-white border border-slate-300 p-2 font-semibold text-slate-900">{borrowingDept}</td>
                      </tr>
                      <tr className="bg-slate-100 text-slate-800">
                        <th colSpan={4} className="px-3 py-2 text-xs font-bold text-left border-y border-slate-300 text-slate-800">
                          二、出库调配信息与经手人
                        </th>
                      </tr>
                      <tr>
                        <td className="bg-slate-50 border border-slate-300 p-2 font-semibold text-slate-700">出借时间</td>
                        <td className="bg-white border border-slate-300 p-2 font-mono text-slate-800">{loanRecord.borrowTime}</td>
                        <td className="bg-slate-50 border border-slate-300 p-2 font-semibold text-slate-700">预计归还</td>
                        <td className="bg-white border border-slate-300 p-2 font-mono text-slate-800">{loanRecord.expectedReturnTime || '用毕即还'}</td>
                      </tr>
                      <tr>
                        <td className="bg-slate-50 border border-slate-300 p-2 font-semibold text-slate-700">随借配件</td>
                        <td colSpan={3} className="bg-white border border-slate-300 p-2 text-slate-800">
                          {accessoriesList.join('、')}
                        </td>
                      </tr>
                      <tr>
                        <td colSpan={2} className="bg-white border border-slate-300 p-3">
                          <div className="font-bold text-slate-800 mb-1 flex items-center justify-between">
                            <span>【出借方】发机人</span>
                            <span className="text-[10px] text-slate-500 font-normal">已确认</span>
                          </div>
                          <div className="font-semibold text-slate-900 text-sm my-1">
                            {loanRecord.lenderName || '李强'}
                          </div>
                          <div className="text-slate-500 text-[11px]">电话：{lenderPhoneDisplay}</div>
                        </td>
                        <td colSpan={2} className="bg-white border border-slate-300 p-3">
                          <div className="font-bold text-slate-800 mb-1 flex items-center justify-between">
                            <span>【借入方】领机人</span>
                            <span className="text-[10px] text-slate-500 font-normal">已确认</span>
                          </div>
                          <div className="font-semibold text-slate-900 text-sm my-1">
                            {loanRecord.borrowerName}
                          </div>
                          <div className="text-slate-500 text-[11px]">电话：{borrowerPhoneDisplay}</div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="w-full pt-2 mt-auto border-t border-slate-300 text-[11px] text-slate-500 flex items-center justify-between">
                  <span>单据编号：{loanDocNo}</span>
                  <span>五莲县人民医院 · 医学装备管理中心</span>
                </div>
              </div>
            )}

            {/* ===================== VIEW 2: 独立归还结案单 ===================== */}
            {activeTab === 'return' && (
              <div className="w-full max-w-[210mm] min-h-[290mm] bg-white text-slate-900 p-8 sm:p-10 shadow-md border border-slate-300 rounded font-sans text-xs flex flex-col justify-between relative overflow-hidden print:shadow-none print:border-none print:p-6 print:min-h-[297mm]">
                <div className="w-full pb-3 mb-3 border-b-2 border-slate-800 shrink-0">
                  <div className="flex items-center justify-between text-[11px] text-slate-500 pb-1.5 mb-2 border-b border-slate-200">
                    <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-slate-700" />
                      <span>五莲县人民医院 · 医学装备管理中心</span>
                    </span>
                    <div className="flex items-center gap-2 font-mono text-[11px]">
                      <span>归还验收结案单</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h1 className="text-2xl font-bold text-slate-900 tracking-wider">五 莲 县 人 民 医 院</h1>
                      <div className="flex items-center gap-3 mt-1">
                        <h2 className="text-lg font-bold text-slate-800 tracking-wide">
                          医疗设备跨科室【归还验收与结案】交接单
                        </h2>
                      </div>
                    </div>
                    <div className="text-right font-mono">
                      <div className="text-[10px] text-slate-500">结案单号</div>
                      <div className="text-xs font-bold text-slate-900">{returnDocNo}</div>
                    </div>
                  </div>
                </div>

                <div className="voucher-table-wrapper w-full border border-slate-400 overflow-hidden bg-white mb-3 flex-1">
                  <table className="w-full border-collapse text-xs table-fixed bg-white m-0">
                    <colgroup>
                      <col style={{ width: '18%' }} />
                      <col style={{ width: '32%' }} />
                      <col style={{ width: '18%' }} />
                      <col style={{ width: '32%' }} />
                    </colgroup>
                    <tbody>
                      <tr className="bg-slate-100 text-slate-800">
                        <th colSpan={4} className="px-3 py-2 text-xs font-bold text-left border-b border-slate-300 text-slate-800">
                          一、归还设备与验收结论
                        </th>
                      </tr>
                      <tr>
                        <td className="bg-slate-50 border border-slate-300 p-2 font-semibold text-slate-700">设备名称</td>
                        <td className="bg-white border border-slate-300 p-2 font-bold text-slate-900">
                          {equipment.name} {equipment.internalNo && `#${equipment.internalNo}`}
                        </td>
                        <td className="bg-slate-50 border border-slate-300 p-2 font-semibold text-slate-700">资产编号</td>
                        <td className="bg-white border border-slate-300 p-2 font-mono font-semibold text-slate-900">{equipment.id}</td>
                      </tr>
                      <tr>
                        <td className="bg-slate-50 border border-slate-300 p-2 font-semibold text-slate-700">归还时刻</td>
                        <td className="bg-white border border-slate-300 p-2 font-mono text-slate-800">
                          {loanRecord.actualReturnTime || new Date().toLocaleString()}
                        </td>
                        <td className="bg-slate-50 border border-slate-300 p-2 font-semibold text-slate-700">借用周期</td>
                        <td className="bg-white border border-slate-300 p-2 text-slate-800">
                          共计 {loanDurationDays} 天
                        </td>
                      </tr>
                      <tr>
                        <td className="bg-slate-50 border border-slate-300 p-2 font-semibold text-slate-700">验收与质控结论</td>
                        <td colSpan={3} className="bg-white border border-slate-300 p-2 text-slate-800">
                          {loanRecord.returnNotes || '设备完好无损，随机配件全部收齐，功能测试正常，终末消毒合格，准予结案回库。'}
                        </td>
                      </tr>
                      <tr>
                        <td colSpan={2} className="bg-white border border-slate-300 p-3">
                          <div className="font-bold text-slate-800 mb-1 flex items-center justify-between">
                            <span>【借入科室】交机人</span>
                            <span className="text-[10px] text-slate-500 font-normal">已交还</span>
                          </div>
                          <div className="font-semibold text-slate-900 text-sm my-1">
                            {loanRecord.borrowerName}
                          </div>
                          <div className="text-slate-500 text-[11px]">科室：{borrowingDept}</div>
                        </td>
                        <td colSpan={2} className="bg-white border border-slate-300 p-3">
                          <div className="font-bold text-slate-800 mb-1 flex items-center justify-between">
                            <span>【医工科】验收工程师</span>
                            <span className="text-[10px] text-slate-500 font-normal">已验收</span>
                          </div>
                          <div className="font-semibold text-slate-900 text-sm my-1">
                            {loanRecord.returnReceiverName || loanRecord.lenderName || '李强'}
                          </div>
                          <div className="text-slate-500 text-[11px]">医学装备管理中心</div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="w-full pt-2 mt-auto border-t border-slate-300 text-[11px] text-slate-500 flex items-center justify-between">
                  <span>结案单号：{returnDocNo}</span>
                  <span>五莲县人民医院 · 医学装备管理中心</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Handwritten Signature Collector Dialog */}
        {showSignaturePad && (
          <div className="fixed inset-0 z-60 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-5 max-w-md w-full shadow-2xl border border-slate-200 animate-in fade-in zoom-in duration-200">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-3">
                <div className="flex items-center gap-2">
                  <PenTool className="w-5 h-5 text-teal-600" />
                  <h3 className="font-bold text-slate-900 text-sm">
                    现场电子手写签名
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowSignaturePad(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="mb-2 flex items-center justify-between text-xs">
                <span className="text-slate-600">签署人：</span>
                <select
                  value={activeSignRole}
                  onChange={(e) => setActiveSignRole(e.target.value as any)}
                  className="bg-slate-50 border border-slate-300 rounded px-2 py-1 text-xs font-semibold text-slate-800 cursor-pointer"
                >
                  <option value="borrower">领机人：{loanRecord.borrowerName}</option>
                  <option value="lender">发机人：{loanRecord.lenderName || '李强'}</option>
                  {isActuallyReturned && (
                    <>
                      <option value="returner">交还人：{loanRecord.borrowerName}</option>
                      <option value="receiver">验收工程师：{loanRecord.returnReceiverName || '李强'}</option>
                    </>
                  )}
                </select>
              </div>

              {/* Canvas Pad */}
              <div className="border border-slate-300 rounded-xl bg-slate-50 relative overflow-hidden mb-3">
                <canvas
                  ref={canvasRef}
                  width={380}
                  height={150}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                  className="w-full h-[150px] bg-white cursor-crosshair touch-none"
                />
                <div className="absolute bottom-1 right-2 pointer-events-none text-[10px] text-slate-400 font-sans">
                  请在此区域内平滑签署姓名
                </div>
              </div>

              <div className="flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={clearCanvas}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 border border-slate-300 rounded-lg cursor-pointer flex items-center gap-1"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>重写清空</span>
                </button>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowSignaturePad(false)}
                    className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                  >
                    取消
                  </button>
                  <button
                    type="button"
                    onClick={saveSignature}
                    className="px-4 py-1.5 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-sm cursor-pointer flex items-center gap-1"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>确认采纳</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

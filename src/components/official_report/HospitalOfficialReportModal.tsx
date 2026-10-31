import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  Printer, 
  Download, 
  X, 
  Edit3, 
  Check, 
  Copy, 
  RotateCcw, 
  FileText, 
  ShieldCheck, 
  Sparkles, 
  Calendar,
  Building2,
  HelpCircle,
  FileCheck2,
  Eye,
  Sliders,
  ChevronDown
} from 'lucide-react';
import { 
  HospitalOfficialReportData, 
  SEED_REPORT_546,
  SEED_REPORT_545, 
  saveHospitalOfficialReports, 
  loadHospitalOfficialReports,
  getCanonicalMasterDepartmentName
} from '../../utils/hospitalReportGenerator';
import { 
  parseWorkOrderCode, 
  formatWorkOrderCode, 
  inferWorkOrderPrefix, 
  WorkOrderPrefixType,
  WORK_ORDER_TYPE_OPTIONS,
  PREFIX_LABEL_MAP 
} from '../../utils/workOrderCodeGenerator';
import { loadMasterData, DEFAULT_DEPARTMENTS } from '../../utils/masterData';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface HospitalOfficialReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportData?: HospitalOfficialReportData | null;
  onSaveReport?: (updated: HospitalOfficialReportData) => void;
  onOpenRegulation?: (regulationId: string) => void;
}

export const HospitalOfficialReportModal: React.FC<HospitalOfficialReportModalProps> = ({
  isOpen,
  onClose,
  reportData,
  onSaveReport,
  onOpenRegulation
}) => {
  // 编号显示模式：'full_code' (规范全码，更体现专业性与业务分类) | 'short_seq' (简短流水序号)
  const [codeDisplayMode, setCodeDisplayMode] = useState<'full_code' | 'short_seq'>('full_code');
  // 当前文档数据：默认加载工单对应公文 NO. WO-FAC-2026-0546
  const [data, setData] = useState<HospitalOfficialReportData>(() => {
    const base = reportData || SEED_REPORT_546;
    const parsed = parseWorkOrderCode(base.docNo || base.workOrderNo || base.fullWorkOrderCode || '546', 'FAC', 2026, true);
    return {
      ...base,
      docNo: base.docNo?.includes('WO-') ? base.docNo : parsed.paperDocNo,
      fullWorkOrderCode: parsed.fullCode,
      workOrderNo: parsed.fullCode,
      workOrderTypeLabel: parsed.prefixLabel
    };
  });
  // 是否处于编辑模式
  const [isEditing, setIsEditing] = useState(false);
  // 打印与视图模式：'blank_for_physical' (空白供线下笔签打印) | 'with_electronic_signs' (带线上审签意见与印鉴)
  const [signMode, setSignMode] = useState<'blank_for_physical' | 'with_electronic_signs'>('blank_for_physical');
  // 复制反馈状态
  const [copied, setCopied] = useState(false);
  // 导出 PDF 加载中状态
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  // 提示信息
  const [toastMessage, setToastMessage] = useState('');
  // 工单编码体系规范审视与解析说明弹窗
  const [showCodingRuleModal, setShowCodingRuleModal] = useState(false);

  // 切换单据编号格式（规范全码 vs 简短序号）
  const handleToggleCodeMode = (mode: 'full_code' | 'short_seq') => {
    setCodeDisplayMode(mode);
    const parsed = parseWorkOrderCode(data.fullWorkOrderCode || data.docNo);
    const newDocNo = mode === 'full_code' ? `NO. ${parsed.fullCode}` : `NO. ${parsed.sequenceNumber}`;
    setData(prev => ({
      ...prev,
      docNo: newDocNo,
      workOrderNo: mode === 'full_code' ? parsed.fullCode : String(parsed.sequenceNumber)
    }));
    showToast(mode === 'full_code' ? '已启用专业规范全码 (WO-FAC-2026-0546)' : '已切换为简短单号 (NO. 546)');
  };

  // 快捷切换业务申请类型 (更新前缀与全码)
  const handleChangePrefix = (newPrefix: WorkOrderPrefixType) => {
    const parsed = parseWorkOrderCode(data.fullWorkOrderCode || data.docNo, newPrefix);
    const updated = formatWorkOrderCode(newPrefix, parsed.year, parsed.sequenceNumber, codeDisplayMode === 'full_code');
    setData(prev => ({
      ...prev,
      docNo: updated.paperDocNo,
      fullWorkOrderCode: updated.fullCode,
      workOrderNo: codeDisplayMode === 'full_code' ? updated.fullCode : String(updated.sequenceNumber),
      workOrderTypeLabel: updated.prefixLabel,
      category: newPrefix === 'FAC' ? 'factory_overhaul' : newPrefix === 'PRT' ? 'part_replacement' : newPrefix === 'SCR' ? 'scrap' : 'repair'
    }));
    showToast(`已切换为【${updated.prefixLabel}】(编码前缀: ${newPrefix})`);
  };

  // 严格从主数据中读取 98 个标准科室
  const masterDepartments = useMemo(() => {
    try {
      const depts = loadMasterData().departments;
      if (depts && depts.length > 0) return depts;
    } catch {}
    return DEFAULT_DEPARTMENTS;
  }, []);

  const printableRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (reportData) {
      // 保证科室名称规范使用主数据科室名称
      const canonicalDept = getCanonicalMasterDepartmentName(reportData.department);
      setData({
        ...reportData,
        department: canonicalDept
      });
    }
  }, [reportData]);

  if (!isOpen) return null;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  // 1. 打印功能 (调用浏览器原生高保真 A4 打印)
  const handlePrint = () => {
    window.print();
  };

  // 2. 导出高分辨率 PDF 文件
  const handleExportPdf = async () => {
    if (!printableRef.current) return;
    setIsExportingPdf(true);
    try {
      const canvas = await html2canvas(printableRef.current, {
        scale: 2.5, // 高清 2.5 倍超采样
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.98);
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
      const filename = `${data.hospitalName || '五莲县人民医院'}请示报告单-${data.docNo || 'NO.546'}.pdf`;
      pdf.save(filename);
      showToast('✅ 报告单 PDF 已成功下载！');
    } catch (err) {
      console.error('Failed to generate PDF', err);
      showToast('导出 PDF 失败，请直接使用“立即打印”保存为 PDF');
    } finally {
      setIsExportingPdf(false);
    }
  };

  // 3. 复制公文全文文本
  const handleCopyText = () => {
    const fullText = `${data.hospitalName}${data.title}\n文号：${data.docNo}（对应维修工单号）\n申报科室：${data.department}\n\n关于 ${data.subjectUnderlined} 的请示\n\n${data.recipient}\n    ${data.body}\n\n科室签字：\n分管领导意见：\n院长意见：\n阅办人：`;
    navigator.clipboard.writeText(fullText).then(() => {
      setCopied(true);
      showToast('✅ 公文正文内容已复制到剪贴板！');
      setTimeout(() => setCopied(false), 2500);
    });
  };

  // 4. 重置恢复为工单 546 范本
  const handleResetToSeed546 = () => {
    setData(SEED_REPORT_546);
    showToast('已重置为《五莲县人民医院请示报告单 NO. 546》');
  };

  // 5. 保存编辑内容
  const handleSaveData = () => {
    setIsEditing(false);
    const canonicalDept = getCanonicalMasterDepartmentName(data.department);
    const updatedData = {
      ...data,
      department: canonicalDept,
      updatedAt: new Date().toISOString()
    };
    setData(updatedData);

    const existing = loadHospitalOfficialReports();
    const updatedList = existing.some(r => r.id === updatedData.id)
      ? existing.map(r => r.id === updatedData.id ? updatedData : r)
      : [updatedData, ...existing];
    saveHospitalOfficialReports(updatedList);
    if (onSaveReport) {
      onSaveReport(updatedData);
    }
    showToast('✅ 请示报告单已成功保存！');
  };

  // 快速载入预设范本 (科室全部严格采用主数据标准名称，文号遵循规范全码体系)
  const handleLoadPreset = (type: string) => {
    const now = new Date();
    const dateStr = `${now.getFullYear()}年${String(now.getMonth() + 1).padStart(2, '0')}月${String(now.getDate()).padStart(2, '0')}日`;
    
    if (type === 'wolf_546') {
      const fullCode = 'WO-FAC-2026-0546';
      setData({
        ...SEED_REPORT_546,
        docNo: codeDisplayMode === 'full_code' ? `NO. ${fullCode}` : 'NO. 546',
        workOrderNo: fullCode,
        fullWorkOrderCode: fullCode,
        workOrderTypeLabel: '返厂大修',
        category: 'factory_overhaul',
        department: getCanonicalMasterDepartmentName('麻醉手术科'),
        applyDate: dateStr
      });
      showToast('已载入：麻醉手术科 输尿管镜返厂大修请示 (工单: WO-FAC-2026-0546)');
    } else if (type === 'wolf_545') {
      const fullCode = 'WO-FAC-2026-0545';
      setData({
        ...SEED_REPORT_545,
        docNo: codeDisplayMode === 'full_code' ? `NO. ${fullCode}` : 'NO. 545',
        workOrderNo: fullCode,
        fullWorkOrderCode: fullCode,
        workOrderTypeLabel: '返厂大修',
        category: 'factory_overhaul',
        department: getCanonicalMasterDepartmentName('麻醉手术科'),
        applyDate: dateStr
      });
      showToast('已载入：麻醉手术科 输尿管镜返厂大修请示 (工单: WO-FAC-2026-0545)');
    } else if (type === 'ct_tube') {
      const deptName = getCanonicalMasterDepartmentName('医学影像科');
      const fullCode = 'WO-PRT-2026-0547';
      setData({
        ...data,
        id: `REP-DOC-547`,
        docNo: codeDisplayMode === 'full_code' ? `NO. ${fullCode}` : 'NO. 547',
        workOrderNo: fullCode,
        fullWorkOrderCode: fullCode,
        workOrderTypeLabel: '配件更换',
        category: 'part_replacement',
        department: deptName,
        subjectUnderlined: `${deptName}64排CT球管更换与应急维修`,
        body: '医学影像科64排CT（SN: CT-64-88021）球管曝光已达68万次，近期高频出现电弧打火报错导致扫描中断，严重制约急诊危重患者卒中胸痛筛查。申请加急联系原厂采购更换球管并重新校准，以恢复临床正常出诊。恳请审批！',
        applyDate: dateStr,
        deptSignature: { signed: true, name: '陈建国 (科主任)', role: '科室主任', date: now.toISOString().split('T')[0], opinion: '属实。CT为急诊五大中心核心保障，申请绿色通道紧急采购球管。' }
      });
      showToast('已载入：医学影像科 CT球管更换请示 (工单: WO-PRT-2026-0547)');
    } else if (type === 'ventilator') {
      const deptName = getCanonicalMasterDepartmentName('重症医学科(ICU)');
      const fullCode = 'WO-PRT-2026-0548';
      setData({
        ...data,
        id: `REP-DOC-548`,
        docNo: codeDisplayMode === 'full_code' ? `NO. ${fullCode}` : 'NO. 548',
        workOrderNo: fullCode,
        fullWorkOrderCode: fullCode,
        workOrderTypeLabel: '配件更换',
        category: 'part_replacement',
        department: deptName,
        subjectUnderlined: `${deptName}有创呼吸机呼气阀与氧电池置换申请`,
        body: '重症医学科2号床有创呼吸机（SN: PB-840-0932）呼气阀膜片破损伴氧电池测量漂移超限，无法执行持续机械通气，申请联系专业维修并紧急调配正品耗件，保障重症监护生命支持安全。恳请审批！',
        applyDate: dateStr,
        deptSignature: { signed: true, name: '林芳 (科主任)', role: 'ICU主任', date: now.toISOString().split('T')[0], opinion: 'ICU生命支持设备关键备件，恳请院领导予以批复。' }
      });
      showToast('已载入：重症医学科(ICU) 呼吸机急救换件请示 (工单: WO-PRT-2026-0548)');
    } else if (type === 'biochem_analyzer') {
      const deptName = getCanonicalMasterDepartmentName('医学检验科');
      const fullCode = 'WO-REP-2026-0549';
      setData({
        ...data,
        id: `REP-DOC-549`,
        docNo: codeDisplayMode === 'full_code' ? `NO. ${fullCode}` : 'NO. 549',
        workOrderNo: fullCode,
        fullWorkOrderCode: fullCode,
        workOrderTypeLabel: '现场抢修',
        category: 'repair',
        department: deptName,
        subjectUnderlined: `${deptName}全自动生化分析仪光度计故障应急抢修`,
        body: '医学检验科全自动生化分析仪（SN: AU-5800-4109）比色皿光度计传感器自检报错溢出，导致急诊生化肝肾功急查项目停滞，影响门急诊出具报告时限。申请协调专业工程师紧急进场抢修排除故障。恳请审批！',
        applyDate: dateStr,
        deptSignature: { signed: true, name: '王晓辉 (科主任)', role: '检验科主任', date: now.toISOString().split('T')[0], opinion: '门急诊生化急查关键设备，恳请院领导批准绿色通道工程师加急抢修。' }
      });
      showToast('已载入：医学检验科 生化仪现场急修请示 (工单: WO-REP-2026-0549)');
    } else if (type === 'us_scrap') {
      const deptName = getCanonicalMasterDepartmentName('超声医学科');
      const fullCode = 'WO-SCR-2026-0550';
      setData({
        ...data,
        id: `REP-DOC-550`,
        docNo: codeDisplayMode === 'full_code' ? `NO. ${fullCode}` : 'NO. 550',
        workOrderNo: fullCode,
        fullWorkOrderCode: fullCode,
        workOrderTypeLabel: '报废鉴定',
        category: 'scrap',
        department: deptName,
        subjectUnderlined: `${deptName}彩色多普勒超声诊断仪技术鉴定与报废处置请示`,
        body: '超声医学科彩色多普勒超声机（SN: LOGIQ-S7-0231）已服役超过11年，主板芯片老化烧毁且厂商已正式停产停供备件，维修预估成本超过同类新型机购置单价60%以上，符合《医疗器械报废管理办法》。申请进行技术报废鉴定。恳请审批！',
        applyDate: dateStr,
        deptSignature: { signed: true, name: '赵海波 (科主任)', role: '超声医学科主任', date: now.toISOString().split('T')[0], opinion: '设备超期服役严重，元器件老化不可逆，经科室技术鉴定无维修价值，建议同意报废申请。' }
      });
      showToast('已载入：超声医学科 彩超技术鉴定报废请示 (工单: WO-SCR-2026-0550)');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto print:p-0 print:bg-white print:overflow-visible">
      {/* 专用打印样式注入：完全符合 A4 纸张、隐藏所有弹窗边框与操作按钮 */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body * {
            visibility: hidden !important;
          }
          #official-report-printable-sheet,
          #official-report-printable-sheet * {
            visibility: visible !important;
          }
          #official-report-printable-sheet {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 20mm 22mm 25mm 22mm !important;
            box-shadow: none !important;
            border: none !important;
            background: #ffffff !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          @page {
            size: A4 portrait;
            margin: 0;
          }
        }
      `}} />

      {/* 弹窗主卡片容器 */}
      <div className="bg-slate-900/95 border border-slate-700/80 rounded-2xl w-full max-w-5xl max-h-[96vh] flex flex-col shadow-2xl overflow-hidden print:bg-transparent print:border-none print:shadow-none print:max-h-none print:w-auto">
        
        {/* ==================== 顶部交互操作控制栏 (打印时自动隐藏) ==================== */}
        <div className="px-4 py-3 bg-slate-800/90 border-b border-slate-700/80 flex flex-wrap items-center justify-between gap-3 text-white shrink-0 print:hidden">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-red-600/90 text-white flex items-center justify-center shadow-xs">
              <FileCheck2 className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm font-bold text-white tracking-wide">
                  五莲县人民医院请示报告单
                </h2>

                {/* 业务类别切换下拉 (区分申请类型) */}
                <div className="relative group">
                  <button
                    type="button"
                    className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-200 border border-purple-500/40 inline-flex items-center gap-1 cursor-pointer hover:bg-purple-500/30 transition shadow-xs"
                    title="点击切换工单业务类别 (返厂大修/现场急修/配件置换/PM维保/报废等)"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span>
                    <span>{data.workOrderTypeLabel || '返厂大修工单'}</span>
                    <ChevronDown className="w-3 h-3 text-purple-300" />
                  </button>
                  <div className="absolute left-0 top-full mt-1 w-64 bg-slate-800 border border-slate-700 rounded-xl shadow-xl py-1 z-40 hidden group-hover:block text-xs">
                    <div className="px-3 py-1 text-[10px] text-slate-400 font-bold border-b border-slate-700">
                      切换申请类别 (前缀区分)
                    </div>
                    {WORK_ORDER_TYPE_OPTIONS.map((opt) => (
                      <button
                        key={opt.prefix}
                        type="button"
                        onClick={() => handleChangePrefix(opt.prefix)}
                        className={`w-full text-left px-3 py-1.5 hover:bg-slate-700 transition flex items-center justify-between text-xs cursor-pointer ${
                          parseWorkOrderCode(data.fullWorkOrderCode || data.docNo).prefix === opt.prefix ? 'bg-slate-700/60 text-white font-bold' : 'text-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className={`px-1.5 py-0.2 rounded font-mono text-[10px] ${opt.badgeBg} ${opt.badgeText} border ${opt.badgeBorder}`}>
                            {opt.codePrefix}
                          </span>
                          <span>{opt.label}</span>
                        </div>
                        {parseWorkOrderCode(data.fullWorkOrderCode || data.docNo).prefix === opt.prefix && (
                          <Check className="w-3 h-3 text-emerald-400" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 规范全码徽章 */}
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 inline-flex items-center gap-1" title="规范全码工单号 (跨年唯一且区分业务类型)">
                  <span className="text-emerald-400/80 font-sans">工单全码:</span>
                  <span className="text-emerald-200">{data.fullWorkOrderCode || 'WO-FAC-2026-0546'}</span>
                </span>

                {/* 编码模式切换开关 (规范全码 vs 简短序号) */}
                <div className="inline-flex rounded-md bg-slate-950/80 p-0.5 border border-slate-700">
                  <button
                    type="button"
                    onClick={() => handleToggleCodeMode('full_code')}
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold transition cursor-pointer ${
                      codeDisplayMode === 'full_code'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                    title="公文文号印制专业规范全码 (如 NO. WO-FAC-2026-0546)，体现专业性并区分申请类型"
                  >
                    规范全码版 (推荐)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleToggleCodeMode('short_seq')}
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold transition cursor-pointer ${
                      codeDisplayMode === 'short_seq'
                        ? 'bg-slate-700 text-white shadow-xs'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                    title="公文文号印制简写序号 (如 NO. 546)"
                  >
                    简写序号版
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setShowCodingRuleModal(true)}
                  className="px-2 py-0.5 rounded text-[10px] font-medium bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/30 inline-flex items-center gap-1 transition cursor-pointer"
                  title="查看工单编码体系设计规范与审视分析"
                >
                  <HelpCircle className="w-3 h-3 text-amber-400" />
                  <span>编码规范审视</span>
                </button>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                规范全码区分业务类型 · 科室名称严格取自主数据 · 支持标准 A4 打印与高清导出
              </p>
            </div>
          </div>

          {/* 右侧操作按钮组 */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* 范本快速切换 */}
            <div className="relative group">
              <button 
                type="button"
                className="px-2.5 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-xs font-medium transition flex items-center gap-1 cursor-pointer"
                title="选择常见业务请示模板"
              >
                <Sliders className="w-3.5 h-3.5 text-slate-400" />
                <span>载入范本</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>
              <div className="absolute right-0 top-full mt-1 w-72 bg-slate-800 border border-slate-700 rounded-xl shadow-xl py-1 z-30 hidden group-hover:block text-xs">
                <button 
                  onClick={() => handleLoadPreset('wolf_546')}
                  className="w-full text-left px-3 py-2 text-slate-200 hover:bg-slate-700 transition flex flex-col cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-white">输尿管镜返厂大修</span>
                    <span className="px-1.5 py-0.2 rounded font-mono text-[10px] bg-purple-500/20 text-purple-300 border border-purple-500/30">WO-FAC-0546</span>
                  </div>
                  <span className="text-[10px] text-slate-400 mt-0.5">麻醉手术科 / 视向模糊微创碎石急需</span>
                </button>
                <button 
                  onClick={() => handleLoadPreset('wolf_545')}
                  className="w-full text-left px-3 py-2 text-slate-200 hover:bg-slate-700 transition flex flex-col border-t border-slate-700/50 cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-white">输尿管镜返厂大修 (原案)</span>
                    <span className="px-1.5 py-0.2 rounded font-mono text-[10px] bg-purple-500/20 text-purple-300 border border-purple-500/30">WO-FAC-0545</span>
                  </div>
                  <span className="text-[10px] text-slate-400 mt-0.5">麻醉手术科 / 原版归档案卷</span>
                </button>
                <button 
                  onClick={() => handleLoadPreset('ct_tube')}
                  className="w-full text-left px-3 py-2 text-slate-200 hover:bg-slate-700 transition flex flex-col border-t border-slate-700/50 cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-white">64排CT球管更换审批</span>
                    <span className="px-1.5 py-0.2 rounded font-mono text-[10px] bg-blue-500/20 text-blue-300 border border-blue-500/30">WO-PRT-0547</span>
                  </div>
                  <span className="text-[10px] text-slate-400 mt-0.5">医学影像科 / 曝光打火急救筛查保障</span>
                </button>
                <button 
                  onClick={() => handleLoadPreset('ventilator')}
                  className="w-full text-left px-3 py-2 text-slate-200 hover:bg-slate-700 transition flex flex-col border-t border-slate-700/50 cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-white">ICU呼吸机关键备件置换</span>
                    <span className="px-1.5 py-0.2 rounded font-mono text-[10px] bg-blue-500/20 text-blue-300 border border-blue-500/30">WO-PRT-0548</span>
                  </div>
                  <span className="text-[10px] text-slate-400 mt-0.5">重症医学科(ICU) / 呼气阀与氧电池耗件</span>
                </button>
                <button 
                  onClick={() => handleLoadPreset('biochem_analyzer')}
                  className="w-full text-left px-3 py-2 text-slate-200 hover:bg-slate-700 transition flex flex-col border-t border-slate-700/50 cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-white">全自动生化分析仪现场抢修</span>
                    <span className="px-1.5 py-0.2 rounded font-mono text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30">WO-REP-0549</span>
                  </div>
                  <span className="text-[10px] text-slate-400 mt-0.5">医学检验科 / 光度计报错急诊生化保障</span>
                </button>
                <button 
                  onClick={() => handleLoadPreset('us_scrap')}
                  className="w-full text-left px-3 py-2 text-slate-200 hover:bg-slate-700 transition flex flex-col border-t border-slate-700/50 cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-white">彩超技术鉴定与报废处置</span>
                    <span className="px-1.5 py-0.2 rounded font-mono text-[10px] bg-rose-500/20 text-rose-300 border border-rose-500/30">WO-SCR-0550</span>
                  </div>
                  <span className="text-[10px] text-slate-400 mt-0.5">超声医学科 / 11年超期服役芯片老化</span>
                </button>
              </div>
            </div>

            {/* 签批模式切换 */}
            <div className="inline-flex rounded-lg bg-slate-950/60 p-0.5 border border-slate-700">
              <button
                type="button"
                onClick={() => setSignMode('blank_for_physical')}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition ${
                  signMode === 'blank_for_physical'
                    ? 'bg-red-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="公文底部留白，适合打印后手工亲笔签批与线下盖章"
              >
                空白纸质打印
              </button>
              <button
                type="button"
                onClick={() => setSignMode('with_electronic_signs')}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition ${
                  signMode === 'with_electronic_signs'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="显示系统各级审核人意见与电子签章印鉴"
              >
                线上审签预览
              </button>
            </div>

            {/* 编辑公文模式开关 */}
            <button
              type="button"
              onClick={() => {
                if (isEditing) {
                  handleSaveData();
                } else {
                  setIsEditing(true);
                }
              }}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs ${
                isEditing
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  : 'bg-slate-700 hover:bg-slate-600 text-slate-200'
              }`}
            >
              {isEditing ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>保存修改</span>
                </>
              ) : (
                <>
                  <Edit3 className="w-3.5 h-3.5 text-slate-300" />
                  <span>编辑内容</span>
                </>
              )}
            </button>

            {/* 复制公文正文 */}
            <button
              type="button"
              onClick={handleCopyText}
              className="px-2.5 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-xs font-medium transition flex items-center gap-1 cursor-pointer"
              title="复制公文文字以粘贴至医院OA、微信或报销单"
            >
              <Copy className="w-3.5 h-3.5 text-slate-300" />
              <span>{copied ? '已复制' : '复制文本'}</span>
            </button>

            {/* 导出 PDF */}
            <button
              type="button"
              onClick={handleExportPdf}
              disabled={isExportingPdf}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              title="下载为标准 A4 PDF 电子文件"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isExportingPdf ? '生成中...' : '导出 PDF'}</span>
            </button>

            {/* 立即打印 (原生 A4) */}
            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 py-1.5 bg-red-600 hover:bg-red-500 active:scale-95 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-md"
              title="连接打印机直接打印标准 A4 请示报告单"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>立即打印 (A4)</span>
            </button>

            {/* 关闭按钮 */}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition cursor-pointer ml-1"
              title="关闭预览"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 提示条 */}
        {toastMessage && (
          <div className="bg-emerald-600 text-white px-4 py-1.5 text-xs font-semibold text-center shrink-0 print:hidden transition-all">
            {toastMessage}
          </div>
        )}

        {/* ==================== 中间：高仿真 A4 纸张呈现画板 ==================== */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 flex items-start justify-center bg-slate-950/60 print:bg-white print:p-0 print:overflow-visible">
          
          {/* A4 仿真纸质页面 (标准 210mm 宽，保持真实公文版式) */}
          <div 
            id="official-report-printable-sheet"
            ref={printableRef}
            className="w-full max-w-[780px] min-h-[1050px] bg-white text-slate-900 rounded-xs shadow-2xl p-8 sm:p-12 lg:p-16 flex flex-col justify-between font-serif selection:bg-red-100 selection:text-red-900 print:shadow-none print:p-0 print:max-w-none print:min-h-0"
            style={{
              fontFamily: '"SimSun", "Songti SC", "STSong", "FZShuSong-Z01S", "FangSong", "KaiTi", "Times New Roman", serif',
              letterSpacing: '0.02em',
              lineHeight: 1.8
            }}
          >
            {/* 上半部：文头、科室、关于...的请示、正文 */}
            <div>
              {/* 1. 顶部左侧公文编号 (专业规范全码，如 NO. WO-FAC-2026-0546，右上角保持空白纯净) */}
              <div className="flex justify-between items-start text-xs sm:text-sm text-slate-800 mb-6 font-mono">
                <div>
                  {isEditing ? (
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-bold text-slate-500 font-mono">NO.</span>
                      <input 
                        type="text"
                        value={data.docNo.replace(/^NO\.\s*/i, '')}
                        onChange={(e) => {
                          const val = e.target.value.trim();
                          const parsed = parseWorkOrderCode(val, undefined, 2026, codeDisplayMode === 'full_code');
                          setData({ 
                            ...data, 
                            docNo: val ? (val.startsWith('NO.') ? val : `NO. ${val}`) : (codeDisplayMode === 'full_code' ? `NO. ${parsed.fullCode}` : `NO. ${parsed.sequenceNumber}`),
                            workOrderNo: parsed.fullCode,
                            fullWorkOrderCode: parsed.fullCode,
                            workOrderTypeLabel: parsed.prefixLabel
                          });
                        }}
                        className="w-56 px-2 py-0.5 border border-slate-300 rounded font-mono text-xs bg-amber-50/50"
                        title="专业全量工单文号，如 WO-FAC-2026-0546"
                      />
                      <select
                        value={parseWorkOrderCode(data.fullWorkOrderCode || data.docNo).prefix}
                        onChange={(e) => {
                          handleChangePrefix(e.target.value as WorkOrderPrefixType);
                        }}
                        className="px-2 py-0.5 border border-slate-300 rounded text-xs bg-white text-slate-700 font-sans cursor-pointer"
                        title="修改工单申请类别"
                      >
                        {WORK_ORDER_TYPE_OPTIONS.map(opt => (
                          <option key={opt.prefix} value={opt.prefix}>{opt.label} ({opt.codePrefix})</option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <span className="font-semibold tracking-wider font-mono text-slate-900 text-xs sm:text-sm">
                      {data.docNo || (codeDisplayMode === 'full_code' ? `NO. ${data.fullWorkOrderCode || 'WO-FAC-2026-0546'}` : 'NO. 546')}
                    </span>
                  )}
                </div>
                {/* 右上角保持纯净留白，完全符合真实纸质公文原件版式 */}
              </div>

              {/* 2. 医院请示报告单 大标题 (居中加粗宋体) */}
              <div className="text-center mt-2 mb-4">
                {isEditing ? (
                  <input 
                    type="text"
                    value={data.title}
                    onChange={(e) => setData({ ...data, title: e.target.value })}
                    className="w-full text-center text-2xl sm:text-3xl font-black text-slate-900 border-b border-dashed border-slate-400 py-1"
                  />
                ) : (
                  <h1 className="text-2xl sm:text-3xl md:text-[32px] font-black text-slate-900 tracking-wider">
                    {data.title || '五莲县人民医院请示报告单'}
                  </h1>
                )}
              </div>

              {/* 3. 科室副标题 (居中宋体/楷体，严格调用全院主数据标准科室名称) */}
              <div className="text-center mb-8">
                {isEditing ? (
                  <div className="inline-flex flex-col items-center">
                    <select 
                      value={data.department}
                      onChange={(e) => {
                        const newDept = e.target.value;
                        const oldDept = data.department;
                        let newSubject = data.subjectUnderlined;
                        if (newSubject.includes(oldDept)) {
                          newSubject = newSubject.replace(oldDept, newDept);
                        } else {
                          newSubject = `${newDept}${data.equipmentName || '设备'}维修申请`;
                        }
                        setData({ ...data, department: newDept, subjectUnderlined: newSubject });
                      }}
                      className="px-3 py-1 text-center text-lg sm:text-xl font-medium text-slate-900 border border-slate-300 rounded bg-amber-50/50 shadow-xs cursor-pointer font-serif"
                    >
                      {masterDepartments.map((dept) => (
                        <option key={dept.id || dept.name} value={dept.name}>
                          {dept.name} ({dept.buildingName || '院内科室'})
                        </option>
                      ))}
                    </select>
                    <span className="text-[10px] text-slate-400 mt-1 font-sans">
                      严格调用五莲县人民医院标准科室主数据
                    </span>
                  </div>
                ) : (
                  <div className="text-lg sm:text-xl font-medium text-slate-800 tracking-widest">
                    {data.department || '麻醉手术科'}
                  </div>
                )}
              </div>

              {/* 4. 公文主题行 (关于 ... 的请示，中间文字加下划线) */}
              <div className="text-base sm:text-lg text-slate-900 mb-8 flex flex-wrap items-baseline justify-center gap-1 leading-relaxed">
                <span className="font-normal shrink-0">关于</span>
                
                {isEditing ? (
                  <input 
                    type="text"
                    value={data.subjectUnderlined}
                    onChange={(e) => setData({ ...data, subjectUnderlined: e.target.value })}
                    className="flex-1 min-w-[280px] text-center font-semibold text-slate-900 border-b-2 border-slate-900 px-2 py-0.5 bg-amber-50/50"
                  />
                ) : (
                  <span className="font-medium px-3 sm:px-6 border-b border-slate-900 pb-0.5 text-center min-w-[240px]">
                    {data.subjectUnderlined || '麻醉手术科输尿管镜（SN: 826993）维修申请'}
                  </span>
                )}
                
                <span className="font-normal shrink-0">的请示</span>
              </div>

              {/* 5. 呈报对象 (院领导：) */}
              <div className="mb-4">
                {isEditing ? (
                  <input 
                    type="text"
                    value={data.recipient}
                    onChange={(e) => setData({ ...data, recipient: e.target.value })}
                    className="font-bold text-base sm:text-lg text-slate-900 border-b border-slate-300 px-1 py-0.5"
                  />
                ) : (
                  <div className="text-base sm:text-lg font-bold text-slate-900 tracking-wide">
                    {data.recipient || '院领导：'}
                  </div>
                )}
              </div>

              {/* 6. 公文正文 (首行缩进两字 2em，规范公文语调) */}
              <div className="mb-12">
                {isEditing ? (
                  <textarea 
                    rows={5}
                    value={data.body}
                    onChange={(e) => setData({ ...data, body: e.target.value })}
                    className="w-full p-3 border border-slate-400 rounded text-base sm:text-lg leading-loose text-slate-900 bg-amber-50/30"
                  />
                ) : (
                  <p 
                    className="text-base sm:text-lg md:text-[17.5px] leading-loose text-slate-900 text-justify"
                    style={{ textIndent: '2.4em' }}
                  >
                    {data.body || '输尿管镜（SN: 826993）视向模糊且插入部卡顿，无法开展泌尿外科微创碎石手术，申请联系专业维修并更换配件，以恢复手术正常周转。恳请审批！'}
                  </p>
                )}
              </div>
            </div>

            {/* ==================== 下半部：各级签字与审签意见区 (精准复刻原件间距) ==================== */}
            <div className="mt-8 space-y-12 sm:space-y-14">
              
              {/* 1. 科室签字： */}
              <div className="relative">
                <div className="text-base sm:text-lg font-bold text-slate-900 tracking-wide">
                  科室签字：
                </div>
                {signMode === 'with_electronic_signs' && data.deptSignature?.signed && (
                  <div className="mt-2 pl-6 sm:pl-8 flex flex-col gap-1 text-sm text-slate-700">
                    {data.deptSignature.opinion && (
                      <div className="italic text-slate-800">
                        “{data.deptSignature.opinion}”
                      </div>
                    )}
                    <div className="flex items-center gap-4 text-xs text-slate-500 font-mono mt-0.5">
                      <span className="font-semibold text-slate-800">{data.deptSignature.name}</span>
                      <span>{data.deptSignature.date}</span>
                      <span className="px-1.5 py-0.2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded">已电子核签</span>
                    </div>
                  </div>
                )}
                {/* 纸质打印手写留白区 */}
                {signMode === 'blank_for_physical' && (
                  <div className="h-10 print:h-12 border-b border-transparent"></div>
                )}
              </div>

              {/* 2. 分管领导意见： */}
              <div className="relative">
                <div className="text-base sm:text-lg font-bold text-slate-900 tracking-wide">
                  分管领导意见：
                </div>
                {signMode === 'with_electronic_signs' && data.vpSignature?.signed && (
                  <div className="mt-2 pl-6 sm:pl-8 flex flex-col gap-1 text-sm text-slate-700">
                    {data.vpSignature.opinion && (
                      <div className="italic text-slate-800">
                        “{data.vpSignature.opinion}”
                      </div>
                    )}
                    <div className="flex items-center gap-4 text-xs text-slate-500 font-mono mt-0.5">
                      <span className="font-semibold text-slate-800">{data.vpSignature.name}</span>
                      <span>{data.vpSignature.date}</span>
                      <span className="px-1.5 py-0.2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded">已电子核签</span>
                    </div>
                  </div>
                )}
                {signMode === 'blank_for_physical' && (
                  <div className="h-12 print:h-14 border-b border-transparent"></div>
                )}
              </div>

              {/* 3. 院长意见： */}
              <div className="relative">
                <div className="text-base sm:text-lg font-bold text-slate-900 tracking-wide">
                  院长意见：
                </div>
                {signMode === 'with_electronic_signs' && data.presidentSignature?.signed && (
                  <div className="mt-2 pl-6 sm:pl-8 flex flex-col gap-1 text-sm text-slate-700">
                    {data.presidentSignature.opinion && (
                      <div className="italic text-slate-800">
                        “{data.presidentSignature.opinion}”
                      </div>
                    )}
                    <div className="flex items-center gap-4 text-xs text-slate-500 font-mono mt-0.5">
                      <span className="font-semibold text-slate-800">{data.presidentSignature.name}</span>
                      <span>{data.presidentSignature.date}</span>
                    </div>
                  </div>
                )}
                {signMode === 'blank_for_physical' && (
                  <div className="h-12 print:h-14 border-b border-transparent"></div>
                )}
              </div>

              {/* 4. 阅办人： */}
              <div className="relative pt-2">
                <div className="text-base sm:text-lg font-bold text-slate-900 tracking-wide">
                  阅办人：
                </div>
                {signMode === 'with_electronic_signs' && data.reviewerSignature?.signed && (
                  <div className="mt-1 pl-6 sm:pl-8 flex items-center gap-4 text-xs text-slate-500 font-mono">
                    <span className="font-semibold text-slate-800">{data.reviewerSignature.name}</span>
                    <span>{data.reviewerSignature.date}</span>
                  </div>
                )}
                {signMode === 'blank_for_physical' && (
                  <div className="h-8 print:h-10 border-b border-transparent"></div>
                )}
              </div>

            </div>

          </div>

        </div>

        {/* 底部功能条 (打印时隐藏) */}
        <div className="px-4 py-2.5 bg-slate-800/90 border-t border-slate-700/80 flex flex-wrap items-center justify-between text-xs text-slate-400 print:hidden">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5 text-blue-400" />
              <span>主数据科室: <strong className="text-slate-100">{data.department}</strong></span>
            </span>
            <span className="flex items-center gap-1 font-mono">
              <span className="text-slate-400">工单规范全码:</span>
              <strong className="text-emerald-400 font-bold">{data.fullWorkOrderCode || 'WO-FAC-2026-0546'}</strong>
            </span>
            <span className="flex items-center gap-1">
              <span className="text-slate-400">业务类别:</span>
              <strong className="text-purple-300 font-semibold">{data.workOrderTypeLabel || '返厂大修工单'}</strong>
            </span>
            {data.equipmentSn && (
              <span className="flex items-center gap-1 font-mono">
                <span>绑定器械 SN: <strong className="text-slate-200">{data.equipmentSn}</strong></span>
              </span>
            )}
            {data.estimatedCost && (
              <span className="flex items-center gap-1">
                <span>预算预估: <strong className="text-amber-400">¥{data.estimatedCost.toLocaleString()}</strong></span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleResetToSeed546}
              className="text-slate-400 hover:text-slate-200 flex items-center gap-1 transition cursor-pointer"
              title="重置为返厂大修标准范本 (WO-FAC-2026-0546)"
            >
              <RotateCcw className="w-3 h-3" />
              <span>恢复 WO-FAC-2026-0546 范本</span>
            </button>
            <span className="text-slate-600">|</span>
            <span className="text-[11px] text-slate-500">
              符合 GB/T 9704-2012 党政机关与公立医院公文格式规范
            </span>
          </div>
        </div>

      </div>

      {/* ==================== 工单编码体系规范审视与解析说明模态框 ==================== */}
      {showCodingRuleModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col text-slate-200 animate-in fade-in zoom-in-95 duration-150">
            {/* 弹窗头部 */}
            <div className="px-5 py-4 bg-slate-800/90 border-b border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/30 text-amber-400 flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">工单号定义与编码体系工程审视</h3>
                  <p className="text-[11px] text-slate-400">五莲县人民医院医学装备数字化平台 · 编码规范技术报告</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCodingRuleModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 弹窗主体内容 */}
            <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto text-xs leading-relaxed">
              {/* 审视结论警示卡 */}
              <div className="p-3.5 rounded-xl bg-red-950/40 border border-red-800/50 flex items-start gap-3">
                <div className="w-6 h-6 rounded-md bg-red-600/30 text-red-400 flex items-center justify-center shrink-0 mt-0.5 font-bold">
                  !
                </div>
                <div>
                  <h4 className="text-xs font-bold text-red-200">审视结论：纯简单数字排列（如 545, 546）在系统全局不可行</h4>
                  <p className="text-[11px] text-red-300/80 mt-1">
                    若仅在底层使用纯 3 位或 4 位数字作为全局工单主键，在医院实际运转中将产生以下 3 个致命隐患：
                  </p>
                  <ul className="list-disc list-inside mt-1.5 space-y-1 text-[11px] text-red-300/90">
                    <li><strong>跨年度重复碰撞</strong>：三级/二级公立医院年工单量通常在 3,000~8,000 张，单凭 546 数月即用尽，次年再次出现 546，导致历史追溯与计量质控彻底失效；</li>
                    <li><strong>缺乏业务分类语义</strong>：单看“546”无法分辨是现场抢修、精密器械返厂、配件申购还是定期 PM 保养；</li>
                    <li><strong>多系统集成冲突</strong>：对接草料二维码、医院 HIS/HRP/OA 及国家药监 UDI 时，缺乏统一标准前缀将引发数据库冲突。</li>
                  </ul>
                </div>
              </div>

              {/* 真实原件中的号码意义 */}
              <div className="p-3.5 rounded-xl bg-blue-950/30 border border-blue-800/40 space-y-1.5">
                <h4 className="text-xs font-bold text-blue-200 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-blue-400" />
                  <span>纸质报告单中「NO. 546」的真实业务定位</span>
                </h4>
                <p className="text-[11px] text-slate-300">
                  原件左上角的 <code className="text-blue-300 bg-blue-950/80 px-1 py-0.5 rounded font-mono font-bold">NO. 546</code>，实质上是公立医院公文制度中的<strong>「医学装备年度请示登记存根号/纸质公文流转序号」</strong>。医工科与院办在物理流转和归档存查时按此序号排架，与当次报修/维修工单保持 1:1 的纸质存根对应关系。
                </p>
              </div>

              {/* 双轨制复合编码架构 */}
              <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/80 space-y-2.5">
                <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  <span>系统现已落地的「双轨制复合编码体系」</span>
                </h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-700">
                    <span className="text-[10px] text-slate-400 block mb-1">① 系统底层全量业务唯一码 (System UID)</span>
                    <div className="font-mono font-bold text-emerald-400 text-sm">
                      {data.fullWorkOrderCode || 'WO-FAC-2026-0546'}
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">
                      格式：<code>WO-[类别前缀]-[年度]-[4位序列]</code>。跨年永不重复，兼具时间与业务语义。
                    </p>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-700">
                    <span className="text-[10px] text-slate-400 block mb-1">② 纸质请示报告单印制原貌 (Print Stub)</span>
                    <div className="font-mono font-bold text-red-400 text-sm">
                      {data.docNo || 'NO. 546'}
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">
                      严格复刻医院原版请示单左上角版式，符合院领导批示与财务报销习惯。
                    </p>
                  </div>
                </div>

                {/* 常用业务类别前缀表 */}
                <div className="mt-2 pt-2 border-t border-slate-700/60">
                  <span className="text-[11px] font-semibold text-slate-300 block mb-1.5">标准业务分类前缀映射规范：</span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-[10px] font-mono">
                    <div className="p-1 rounded bg-slate-900 border border-slate-800 flex justify-between">
                      <span className="text-amber-400 font-bold">WO-REP</span>
                      <span className="text-slate-400 font-sans">现场抢修</span>
                    </div>
                    <div className="p-1 rounded bg-slate-900 border border-slate-800 flex justify-between">
                      <span className="text-purple-400 font-bold">WO-FAC</span>
                      <span className="text-slate-400 font-sans">返厂大修</span>
                    </div>
                    <div className="p-1 rounded bg-slate-900 border border-slate-800 flex justify-between">
                      <span className="text-blue-400 font-bold">WO-PRT</span>
                      <span className="text-slate-400 font-sans">换件审批</span>
                    </div>
                    <div className="p-1 rounded bg-slate-900 border border-slate-800 flex justify-between">
                      <span className="text-emerald-400 font-bold">WO-PM</span>
                      <span className="text-slate-400 font-sans">预防保养</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 双向检索兼容性 */}
              <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-800/40 text-[11px] text-emerald-300">
                ✅ <strong>双向解析兼容</strong>：工程师或院办人员无论在搜索框或二维码扫描中输入简短的 <code className="bg-emerald-900/60 px-1 py-0.5 rounded text-white font-mono">546</code>、<code className="bg-emerald-900/60 px-1 py-0.5 rounded text-white font-mono">NO. 546</code>，还是全量码 <code className="bg-emerald-900/60 px-1 py-0.5 rounded text-white font-mono">WO-FAC-2026-0546</code>，系统解析引擎均能瞬间精准调取同一请示报告单与关联工单。
              </div>
            </div>

            {/* 弹窗底部操作 */}
            <div className="px-5 py-3 bg-slate-800/80 border-t border-slate-700 flex items-center justify-between gap-3">
              {onOpenRegulation ? (
                <button
                  type="button"
                  onClick={() => {
                    setShowCodingRuleModal(false);
                    onClose();
                    onOpenRegulation('REG-019');
                  }}
                  className="px-3 py-1.5 bg-blue-600/30 hover:bg-blue-600/50 text-blue-300 border border-blue-500/40 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>查阅院级红头制度全文（院医工发〔2026〕19号）</span>
                </button>
              ) : <div />}
              <button
                type="button"
                onClick={() => setShowCodingRuleModal(false)}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold transition cursor-pointer shadow-xs"
              >
                我已了解
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

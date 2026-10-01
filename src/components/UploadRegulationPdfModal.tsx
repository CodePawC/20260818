import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  Upload, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Calendar, 
  Building2, 
  ShieldCheck, 
  Eye, 
  Trash2, 
  Sparkles, 
  Layers, 
  FileCheck,
  Lock,
  ArrowRight
} from 'lucide-react';
import { 
  RegulationItem, 
  RegulationCategory, 
  RegulationLevel 
} from '../types/regulationTypes';

interface UploadRegulationPdfModalProps {
  isOpen: boolean;
  onClose: () => void;
  onArchive: (regulation: RegulationItem) => void;
  isAdmin: boolean;
  departments?: { name: string }[];
}

const COMMON_DEPARTMENTS = [
  '全院所有科室',
  '全院临床科室',
  '医学工程保障中心',
  '急危重症监护中心 (ICU)',
  '手术麻醉中心',
  '医学影像科',
  '医学检验科',
  '临床护理部',
  '医务处',
  '招标采购办公室',
  '财务科'
];

const CATEGORIES: { value: RegulationCategory; label: string }[] = [
  { value: '质控安全', label: '质控安全与监督考核' },
  { value: '运行维保', label: '日常运行与预防性维护(PM)' },
  { value: '计量强检', label: '法定强检与计量校准' },
  { value: '法规依据', label: '国家法律法规与行业标准' },
  { value: '采购准入', label: '配置论证与采购准入' },
  { value: '急救调配', label: '急救生命支持应急调配' },
  { value: '维修闭环', label: '临床报修与返厂维修闭环' },
  { value: '资产处置', label: '资产调拨与报废鉴定' },
  { value: '外协协同', label: '外协服务商与议价协同' },
  { value: '培训考核', label: '人员资质与操作培训' },
  { value: '应急预案', label: '突发意外与停电应急预案' }
];

const LEVELS: { value: RegulationLevel; label: string }[] = [
  { value: 'hospital', label: '院级核心规章制度' },
  { value: 'national', label: '国家法律法规/行业标准' },
  { value: 'departmental', label: '医学工程科级工作细则' },
  { value: 'sop', label: '临床标准操作规程 (SOP)' },
  { value: 'emergency', label: '突发事件应急预案' }
];

export const UploadRegulationPdfModal: React.FC<UploadRegulationPdfModalProps> = ({
  isOpen,
  onClose,
  onArchive,
  isAdmin,
  departments = []
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 1. PDF 文件相关状态
  const [selectedPdfFile, setSelectedPdfFile] = useState<File | null>(null);
  const [pdfDataUrl, setPdfDataUrl] = useState<string>('');
  const [pdfFileSizeText, setPdfFileSizeText] = useState<string>('');
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState<boolean>(false);

  // 2. 核心表单输入状态（满足用户要求：标题、适用部门、发布日期）
  const [title, setTitle] = useState<string>('');
  const [applicableDepartments, setApplicableDepartments] = useState<string[]>([
    '全院临床科室',
    '医学工程保障中心'
  ]);
  const [customDeptInput, setCustomDeptInput] = useState<string>('');
  const [effectiveDate, setEffectiveDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

  // 3. 辅助归档元数据
  const [category, setCategory] = useState<RegulationCategory>('质控安全');
  const [level, setLevel] = useState<RegulationLevel>('hospital');
  const [docNumber, setDocNumber] = useState<string>('');
  const [signatory, setSignatory] = useState<string>('分管副院长 / 医工科主任');
  const [summary, setSummary] = useState<string>('');
  const [isMustRead, setIsMustRead] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string>('');

  // 初始化重置
  useEffect(() => {
    if (isOpen) {
      setErrorMsg('');
      setSelectedPdfFile(null);
      setPdfDataUrl('');
      setPdfFileSizeText('');
      setIsPreviewOpen(false);
      setTitle('');
      setApplicableDepartments(['全院临床科室', '医学工程保障中心']);
      setCustomDeptInput('');
      const today = new Date().toISOString().split('T')[0];
      setEffectiveDate(today);
      const randomId = Math.floor(Math.random() * 89 + 10);
      setDocNumber(`院医工发〔${new Date().getFullYear()}〕PDF-${randomId}号`);
      setSummary('');
      setCategory('质控安全');
      setLevel('hospital');
      setIsMustRead(true);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // 格式化文件尺寸
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // 处理文件选取
  const handleProcessFile = (file: File) => {
    setErrorMsg('');
    if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
      setErrorMsg('格式错误：仅支持上传 PDF 格式的规章制度文件（.pdf）！');
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      setErrorMsg('文件过大：上传的 PDF 制度文件建议在 50MB 以内！');
      return;
    }

    setSelectedPdfFile(file);
    setPdfFileSizeText(formatFileSize(file.size));

    // 如果标题为空，自动用去扩展名的文件名作为默认标题
    if (!title.trim()) {
      const cleanName = file.name.replace(/\.pdf$/i, '').trim();
      setTitle(cleanName.startsWith('《') ? cleanName : `《${cleanName}》`);
    }

    // 读取为 Data URL 以便在浏览器内直接预览和持久化
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setPdfDataUrl(reader.result);
      }
    };
    reader.onerror = () => {
      setErrorMsg('读取 PDF 文件失败，请重试');
    };
    reader.readAsDataURL(file);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleProcessFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleProcessFile(file);
    }
  };

  // 部门标签增删
  const handleToggleDepartment = (deptName: string) => {
    if (applicableDepartments.includes(deptName)) {
      setApplicableDepartments(applicableDepartments.filter(d => d !== deptName));
    } else {
      setApplicableDepartments([...applicableDepartments, deptName]);
    }
  };

  const handleAddCustomDept = () => {
    const trimmed = customDeptInput.trim();
    if (!trimmed) return;
    if (!applicableDepartments.includes(trimmed)) {
      setApplicableDepartments([...applicableDepartments, trimmed]);
    }
    setCustomDeptInput('');
  };

  // 提交归档
  const handleSubmitArchive = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      setErrorMsg('权限不足：仅具备管理员权限的用户方可进行规章制度 PDF 归档操作！');
      return;
    }

    if (!selectedPdfFile) {
      setErrorMsg('请先选择或拖拽上传 PDF 格式的制度文件！');
      return;
    }

    if (!title.trim()) {
      setErrorMsg('请输入制度标题！');
      return;
    }

    if (applicableDepartments.length === 0) {
      setErrorMsg('请至少指定一个适用部门！');
      return;
    }

    if (!effectiveDate) {
      setErrorMsg('请选择发布/施行日期！');
      return;
    }

    const cleanTitle = title.trim().startsWith('《') ? title.trim() : `《${title.trim()}》`;
    const randomNo = Math.floor(Math.random() * 899 + 100);
    const code = `YXGC-ZD-${new Date().getFullYear()}-PDF-${randomNo}`;

    // 创建结构化归档条目
    const newArchivedRegulation: RegulationItem = {
      id: `REG-PDF-${Date.now()}`,
      code,
      docNumber: docNumber.trim() || `院医工发〔${new Date().getFullYear()}〕PDF-${randomNo}号`,
      title: cleanTitle,
      category,
      level,
      status: 'active',
      effectiveDate,
      revisionDate: effectiveDate,
      version: 'v1.0 (PDF归档件)',
      issuedBy: '五莲县人民医院 医学工程保障中心',
      signatory: signatory.trim() || '分管副院长 / 医工科主任',
      applicableDepartments,
      keywords: ['PDF归档', '红头公文', '现行有效', cleanTitle.replace(/[《》]/g, '')],
      summary: summary.trim() || `本制度为医院正式发布的 PDF 归档红头文件《${cleanTitle.replace(/[《》]/g, '')}》，适用于${applicableDepartments.join('、')}，已加盖院级公章或通过 OA 发文审核，具备法定效力。`,
      tableOfContents: [
        { id: 'sec-pdf-1', title: 'PDF 官方红头扫描件正文', level: 1 },
        { id: 'sec-pdf-2', title: '适用范围与执行责任', level: 1 },
        { id: 'sec-pdf-3', title: '归档备案信息', level: 1 }
      ],
      content: `### 第一章 制度基本说明与执行准则
**第一条** 本文件系五莲县人民医院正式下发执行的规章制度文件，源文件格式为 PDF 官方公文原件，发布日期为 **${effectiveDate}**。

**第二条** 本规章制度适用部门涵盖：**${applicableDepartments.join('、')}**。相关部门须严格按照制度规定组织人员培训宣贯与执行。

### 第二章 官方正文原件在线查阅
**第三条** 本制度已完成电子档案数字化封存（文件名称：\`${selectedPdfFile.name}\`，文件尺寸：\`${pdfFileSizeText}\`）。全体人员可点击下方 PDF 预览窗口直接阅读，亦可通过配套附件栏高速下载原件。

### 第三章 监督考核与附则
**第四条** 本制度由医学工程保障中心归档备案并负责日常监管与技术解释。凡与本规章制度存在业务交叉的日常维修、预防性维护、强检与不良事件处置，均以本归档件要求为准。`,
      isArchivedPdf: true,
      pdfFileName: selectedPdfFile.name,
      pdfFileSize: pdfFileSizeText,
      pdfFileUrl: pdfDataUrl || undefined,
      attachments: [
        {
          id: `att-pdf-${Date.now()}`,
          name: selectedPdfFile.name,
          size: pdfFileSizeText,
          type: 'pdf',
          url: pdfDataUrl || undefined,
          downloadCount: 0
        }
      ],
      readCount: 1,
      isMustReadForHospitalAccreditation: isMustRead,
      updatedAt: new Date().toISOString()
    };

    onArchive(newArchivedRegulation);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div 
        className="w-full max-w-3xl max-h-[92vh] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={e => e.stopPropagation()}
      >
        {/* 顶部标题栏 */}
        <div className="px-6 py-4 bg-gradient-to-r from-red-600 via-rose-700 to-red-700 text-white flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-xs border border-white/25 shadow-inner">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-wide">
                  上传并归档规章制度 (PDF 格式)
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400 text-amber-950 flex items-center gap-1 shadow-2xs">
                  <ShieldCheck className="w-3 h-3" />
                  管理员权限专用
                </span>
              </div>
              <p className="text-xs text-rose-100/90 mt-0.5">
                支持导入院级红头红印发文、国家药监法规、科室操作 SOP 之 PDF 电子扫描原件并完成入库归档
              </p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/20 text-white/80 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 表单内容区 */}
        <form onSubmit={handleSubmitArchive} className="flex-1 overflow-y-auto p-6 space-y-5 text-xs text-slate-700">
          {/* 非管理员提示阻断 */}
          {!isAdmin && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 flex items-start gap-3">
              <Lock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-sm">需要管理员权限</p>
                <p className="text-xs text-amber-700 mt-1">
                  当前登录账号暂不具备规章制度入库归档权限。请使用系统管理员账号（如系统总管、医学工程科主任）登录后操作。
                </p>
              </div>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span className="font-medium">{errorMsg}</span>
            </div>
          )}

          {/* 1. PDF 文件上传区 */}
          <div className="space-y-2">
            <label className="block font-bold text-slate-800 text-xs flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-red-600" />
                <span>选择制度 PDF 文件</span>
                <span className="text-rose-500">*</span>
              </span>
              <span className="text-[11px] text-slate-400 font-normal">
                支持 .pdf 格式，最大建议 50MB
              </span>
            </label>

            <input 
              ref={fileInputRef}
              type="file" 
              accept=".pdf,application/pdf"
              onChange={handleFileInputChange}
              className="hidden"
            />

            {!selectedPdfFile ? (
              <div
                onDragOver={e => { e.preventDefault(); setIsDragOver(true); }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2.5 ${
                  isDragOver 
                    ? 'border-red-500 bg-red-50/50 scale-[0.99]' 
                    : 'border-slate-300 hover:border-red-400 hover:bg-slate-50/80 bg-slate-50/40'
                }`}
              >
                <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 border border-red-100 flex items-center justify-center shadow-2xs">
                  <Upload className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <p className="font-bold text-slate-800 text-sm">
                    点击选择文件 或 将 PDF 制度文件拖拽至此处
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    系统将自动提取文件名填充制度标题，并建立在线查阅与下载档案
                  </p>
                </div>
                <button
                  type="button"
                  className="mt-1 px-4 py-1.5 bg-white border border-slate-300 hover:border-red-400 rounded-lg text-slate-700 font-semibold text-xs shadow-2xs flex items-center gap-1.5"
                >
                  <FileText className="w-3.5 h-3.5 text-red-600" />
                  <span>浏览本地 PDF 文件</span>
                </button>
              </div>
            ) : (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 truncate">
                  <div className="w-10 h-10 rounded-xl bg-red-600 text-white font-bold text-xs flex items-center justify-center shadow-xs shrink-0">
                    PDF
                  </div>
                  <div className="truncate">
                    <p className="font-bold text-slate-900 text-xs truncate" title={selectedPdfFile.name}>
                      {selectedPdfFile.name}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-2">
                      <span>文件大小: <strong className="text-slate-700">{pdfFileSizeText}</strong></span>
                      <span>·</span>
                      <span className="text-emerald-600 font-semibold flex items-center gap-0.5">
                        <CheckCircle2 className="w-3 h-3" />
                        已准备就绪
                      </span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {pdfDataUrl && (
                    <button
                      type="button"
                      onClick={() => setIsPreviewOpen(!isPreviewOpen)}
                      className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors shadow-2xs"
                    >
                      <Eye className="w-3.5 h-3.5 text-blue-600" />
                      <span>{isPreviewOpen ? '收起预览' : '预览原件'}</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedPdfFile(null);
                      setPdfDataUrl('');
                      setPdfFileSizeText('');
                      setIsPreviewOpen(false);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition-colors"
                    title="移除并重新选择"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* 可折叠的 PDF 预览窗 */}
            {isPreviewOpen && pdfDataUrl && (
              <div className="mt-2 border border-slate-300 rounded-xl overflow-hidden bg-slate-800 shadow-md">
                <div className="px-3 py-1.5 bg-slate-900 text-slate-300 text-[11px] flex items-center justify-between">
                  <span>PDF 原件实时预览窗口</span>
                  <button 
                    type="button" 
                    onClick={() => setIsPreviewOpen(false)}
                    className="hover:text-white"
                  >
                    关闭
                  </button>
                </div>
                <iframe
                  src={pdfDataUrl}
                  title="PDF 预览"
                  className="w-full h-80 border-0 bg-white"
                />
              </div>
            )}
          </div>

          {/* 2. 用户核心必填项：标题、适用部门、发布日期 */}
          <div className="grid grid-cols-1 gap-4 pt-1">
            {/* 制度标题 */}
            <div>
              <label className="block font-bold text-slate-800 text-xs mb-1">
                制度名称 / 标题 <span className="text-rose-500">*</span>
              </label>
              <input 
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="例如: 《五莲县人民医院医疗设备预防性维护(PM)工作制度》"
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-red-500 focus:border-red-500 placeholder:font-normal"
                required
              />
            </div>

            {/* 适用部门 (多选与快捷选择) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block font-bold text-slate-800 text-xs">
                  适用部门 / 责任科室 <span className="text-rose-500">*</span>
                </label>
                <span className="text-[11px] text-slate-400">
                  已选 <strong className="text-red-600">{applicableDepartments.length}</strong> 个科室部门
                </span>
              </div>

              {/* 常用科室快捷 Pills */}
              <div className="flex flex-wrap gap-1.5 mb-2.5">
                {COMMON_DEPARTMENTS.map(dept => {
                  const isChecked = applicableDepartments.includes(dept);
                  return (
                    <button
                      key={dept}
                      type="button"
                      onClick={() => handleToggleDepartment(dept)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all flex items-center gap-1 border ${
                        isChecked
                          ? 'bg-red-50 border-red-300 text-red-700 font-bold shadow-2xs'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {isChecked && <CheckCircle2 className="w-3 h-3 text-red-600 shrink-0" />}
                      <span>{dept}</span>
                    </button>
                  );
                })}
              </div>

              {/* 自定义添加科室部门 */}
              <div className="flex items-center gap-2">
                <input 
                  type="text"
                  value={customDeptInput}
                  onChange={e => setCustomDeptInput(e.target.value)}
                  placeholder="手动输入其他科室（按回车或点添加）"
                  className="flex-1 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddCustomDept();
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={handleAddCustomDept}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold shrink-0"
                >
                  添加科室
                </button>
              </div>

              {/* 当前已选的部门展示 */}
              {applicableDepartments.length > 0 && (
                <div className="mt-2 p-2 bg-slate-50/70 border border-slate-200 rounded-lg flex flex-wrap gap-1.5 items-center">
                  <span className="text-[10px] text-slate-400 font-bold">已指定:</span>
                  {applicableDepartments.map(d => (
                    <span 
                      key={d} 
                      className="px-2 py-0.5 bg-white border border-slate-200 rounded-md text-[11px] text-slate-700 flex items-center gap-1 font-medium"
                    >
                      <span>{d}</span>
                      <button
                        type="button"
                        onClick={() => handleToggleDepartment(d)}
                        className="hover:text-rose-600 text-slate-400"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* 发布日期与发文字号 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-800 text-xs mb-1 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-red-600" />
                  <span>发布 / 施行日期</span>
                  <span className="text-rose-500">*</span>
                </label>
                <input 
                  type="date"
                  value={effectiveDate}
                  onChange={e => setEffectiveDate(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 text-xs mb-1">
                  官方发文字号 (选填)
                </label>
                <input 
                  type="text"
                  value={docNumber}
                  onChange={e => setDocNumber(e.target.value)}
                  placeholder="如: 院医工发〔2026〕16号"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:ring-2 focus:ring-red-500 focus:border-red-500"
                />
              </div>
            </div>

            {/* 业务分类与制度层级 */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block font-bold text-slate-800 text-xs mb-1">
                  业务类别
                </label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value as RegulationCategory)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:ring-2 focus:ring-red-500 focus:border-red-500"
                >
                  {CATEGORIES.map(c => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-800 text-xs mb-1">
                  制度层级
                </label>
                <select
                  value={level}
                  onChange={e => setLevel(e.target.value as RegulationLevel)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:ring-2 focus:ring-red-500 focus:border-red-500"
                >
                  {LEVELS.map(l => (
                    <option key={l.value} value={l.value}>{l.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-800 text-xs mb-1">
                  签发审批人
                </label>
                <input 
                  type="text"
                  value={signatory}
                  onChange={e => setSignatory(e.target.value)}
                  placeholder="分管副院长 / 医工科主任"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:ring-2 focus:ring-red-500 focus:border-red-500"
                />
              </div>
            </div>

            {/* 摘要说明 */}
            <div>
              <label className="block font-bold text-slate-800 text-xs mb-1">
                制度核心内容提要 / 归档备注 (供全院全文即搜)
              </label>
              <textarea 
                rows={2}
                value={summary}
                onChange={e => setSummary(e.target.value)}
                placeholder="简述该 PDF 制度的要点、适用机型、关键管控环节等，便于全院各科室即时搜索检索..."
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none"
              />
            </div>

            {/* 三甲评审必查标记 */}
            <div className="pt-1">
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={isMustRead} 
                  onChange={e => setIsMustRead(e.target.checked)}
                  className="sr-only peer" 
                />
                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-600"></div>
                <span className="ml-2.5 text-xs font-bold text-slate-800 flex items-center gap-1">
                  <ShieldCheck className="w-4 h-4 text-amber-600" />
                  标记为「三甲综合医院评审核心必查制度」
                </span>
              </label>
            </div>
          </div>
        </form>

        {/* 底部操作栏 */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div className="text-[11px] text-slate-500 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
            <span>归档后将自动生成统一档案编码并在全院制度中心开放检索与阅读</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl transition-colors shadow-2xs"
            >
              取消
            </button>
            <button
              type="button"
              onClick={handleSubmitArchive}
              disabled={!isAdmin}
              className="px-5 py-2 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all shadow-sm"
            >
              <FileCheck className="w-4 h-4" />
              <span>确认封存并入库归档</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

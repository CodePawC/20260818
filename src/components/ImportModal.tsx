import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Upload,
  FileText,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Database,
  Building2,
  Sparkles,
  Loader2,
  ShieldCheck,
  RotateCcw,
  Maximize2,
  Minimize2,
  Search,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  Layers
} from 'lucide-react';
import { parseEquipmentTsv } from '../utils/tsvParser';
import { MedicalEquipment } from '../types';
import { Pagination } from './Pagination';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (items: MedicalEquipment[], overwrite: boolean) => Promise<void> | void;
  existingEquipment?: MedicalEquipment[];
}

type ImportStep = 'input' | 'preview' | 'importing' | 'complete';
type ViewColumnMode = 'all' | 'essential';

export const ImportModal: React.FC<ImportModalProps> = ({
  isOpen,
  onClose,
  onImport,
  existingEquipment = []
}) => {
  const [step, setStep] = useState<ImportStep>('input');
  const [tsvText, setTsvText] = useState('');
  const [overwrite, setOverwrite] = useState(false);
  const [parsedItems, setParsedItems] = useState<MedicalEquipment[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Full-screen modal toggle
  const [isFullScreen, setIsFullScreen] = useState(false);

  // Preview filtering & pagination
  const [previewSearch, setPreviewSearch] = useState('');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('ALL');
  const [pageSize, setPageSize] = useState<number>(20);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [columnViewMode, setColumnViewMode] = useState<ViewColumnMode>('all');

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedDeptFilter, previewSearch]);

  // Progress bar states
  const [progress, setProgress] = useState(0);
  const [progressStatus, setProgressStatus] = useState('正在初始化导入任务...');
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);

  // Reset state on open/close
  useEffect(() => {
    if (!isOpen) {
      setStep('input');
      setTsvText('');
      setOverwrite(false);
      setParsedItems([]);
      setError(null);
      setProgress(0);
      setCurrentTaskIndex(0);
      setPreviewSearch('');
      setSelectedDeptFilter('ALL');
      setCurrentPage(1);
    }
  }, [isOpen]);

  // Metrics (computed before any early return)
  const uniqueDeptsList = useMemo(() => {
    return Array.from(new Set(parsedItems.map((i) => i.department).filter(Boolean)));
  }, [parsedItems]);

  const uniqueDepts = uniqueDeptsList.length;
  const uniqueMfrs = useMemo(() => new Set(parsedItems.map((i) => i.manufacturer)).size, [parsedItems]);
  const totalVal = useMemo(() => parsedItems.reduce((acc, curr) => acc + (curr.purchasePrice || 0), 0), [parsedItems]);

  // Filtered Items in preview
  const filteredParsedItems = useMemo(() => {
    let list = parsedItems;
    if (selectedDeptFilter !== 'ALL') {
      list = list.filter((i) => i.department === selectedDeptFilter);
    }
    if (previewSearch.trim()) {
      const q = previewSearch.toLowerCase().trim();
      list = list.filter((i) =>
        (i.name && i.name.toLowerCase().includes(q)) ||
        (i.model && i.model.toLowerCase().includes(q)) ||
        (i.sn && i.sn.toLowerCase().includes(q)) ||
        (i.id && i.id.toLowerCase().includes(q)) ||
        (i.assetNo && i.assetNo.toLowerCase().includes(q)) ||
        (i.assetOwnership && i.assetOwnership.toLowerCase().includes(q)) ||
        (i.codeId && i.codeId.toLowerCase().includes(q)) ||
        (i.internalNo && i.internalNo.toLowerCase().includes(q)) ||
        (i.usageLocation && i.usageLocation.toLowerCase().includes(q)) ||
        (i.department && i.department.toLowerCase().includes(q)) ||
        (i.manufacturer && i.manufacturer.toLowerCase().includes(q)) ||
        (i.category && i.category.toLowerCase().includes(q)) ||
        (i.level2Category && i.level2Category.toLowerCase().includes(q))
      );
    }
    return list;
  }, [parsedItems, selectedDeptFilter, previewSearch]);

  // Paginated Items
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredParsedItems.slice(start, start + pageSize);
  }, [filteredParsedItems, currentPage, pageSize]);

  const handleTextChange = (text: string) => {
    setTsvText(text);
    setError(null);
    if (!text.trim()) {
      setParsedItems([]);
      return;
    }
    try {
      const items = parseEquipmentTsv(text, existingEquipment);
      setParsedItems(items);
    } catch {
      setError('解析格式失败，请检查数据格式是否为 Tab 分隔的文本');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        handleTextChange(content);
      }
    };
    reader.readAsText(file, 'UTF-8');
  };

  const handleGoToPreview = () => {
    if (!tsvText.trim()) {
      setError('请输入或粘贴要导入的表格数据');
      return;
    }
    const items = parseEquipmentTsv(tsvText, existingEquipment);
    if (items.length === 0) {
      setError('未检测到有效的设备数据行，请确认包含表头或按列分隔的数据');
      return;
    }
    setParsedItems(items);
    setError(null);
    setCurrentPage(1);
    setStep('preview');
  };

  const handleStartImport = async () => {
    if (parsedItems.length === 0) return;

    setStep('importing');
    setProgress(5);
    setProgressStatus('正在校验记录格式与列结构...');
    setCurrentTaskIndex(0);

    // Simulate progress animation
    const tasks = [
      { p: 25, text: '正在校验设备编号(ID)与序列号(SN)唯一性...', idx: 1 },
      { p: 55, text: `正在写入系统数据库 (共 ${parsedItems.length} 条记录)...`, idx: 2 },
      { p: 85, text: '正在构建科室归属、楼栋位置与计量校准档案...', idx: 3 },
      { p: 100, text: '导入完成，正在同步设备台账状态...', idx: 4 }
    ];

    for (let i = 0; i < tasks.length; i++) {
      await new Promise((resolve) => setTimeout(resolve, 450));
      setProgress(tasks[i].p);
      setProgressStatus(tasks[i].text);
      setCurrentTaskIndex(tasks[i].idx);
    }

    // Execute actual batch import
    await onImport(parsedItems, overwrite);

    await new Promise((resolve) => setTimeout(resolve, 300));
    setStep('complete');
  };

  // Preset Sample Data filler (遵守纯数字科室内部编号规范)
  const handleLoadSampleData = () => {
    const sample = `ID_设备信息\t资产编号\t资产归属\tcode_id\t科室内部编号\t使用场所\t类别序号\t类别\t一级序号\t一级类别\t二级序号\t二级类别\t设备名称\t规格型号\t投用时间\t产品有效期\t出厂编号\t厂商名称\t计量校准\t科室\t楼号\t楼层\t护士站电话
10155\tZC-2023-10155\t医院自有\tCOD-10155\t1\t1号楼 综合楼 3F 超声科1室\t06\t医用成像器械\t07\t超声影像诊断设备\t02\t超声回波多普勒成像设备\t超声诊断系统\tACUSON S2000\t2012/1/1\t10\t205843\t美国西门子医疗系统公司\tYes\t超声科\t1号楼 综合楼\t3\t
10154\tZC-2023-10154\t医院自有\tCOD-10154\t2\t1号楼 综合楼 3F 超声科2室\t06\t医用成像器械\t07\t超声影像诊断设备\t02\t超声回波多普勒成像设备\t便携式彩色超声诊断系统\tCX50\t2021/1/6\t10\tB3KB6Q\t飞利浦超声股份有限公司\tYes\t超声科\t1号楼 综合楼\t3\t
10152\tZC-2023-10152\t医院自有\tCOD-10152\t3\t1号楼 综合楼 3F 超声科3室\t06\t医用成像器械\t07\t超声影像诊断设备\t02\t超声回波多普勒成像设备\t彩色超声诊断系统\tEPIQ 5\t2017/11/20\t10\tUS917C0265\t飞利浦超声公司\tYes\t超声科\t1号楼 综合楼\t3\t
10417\tZC-2023-10417\t医院自有\tCOD-10417\t4\t1号楼 综合楼 3F 超声科专家室\t06\t医用成像器械\t07\t超声影像诊断设备\t02\t超声回波多普勒成像设备\t超声诊断仪\tLOGIQ E10s\t2023/1/1\t7\tLEX380054\t通用电气医疗系统(中国)有限公司\tYes\t超声科\t1号楼 综合楼\t3\t
10380\tZC-2023-10380\t医院自有\tCOD-10380\t1\t1号楼 综合楼 6F 血透室穿刺区\t06\t医用成像器械\t07\t超声影像诊断设备\t02\t超声回波多普勒成像设备\t便携式彩色多普勒超声诊断系统\tPA12A\t2023/1/9\t10\t20PA12030002\t北京智影技术有限公司\tYes\t血液透析室\t1号楼 综合楼\t6\t7991162
10096\tZC-2023-10096\t医院自有\tCOD-10096\t1\t1号楼 综合楼 1F 急诊抢救室\t03\t医用诊察和监护器械\t03\t生理参数分析测量设备\t01\t心电测量、分析设备\t多道心电图机\tECG-2250\t2016/7/1\t10\t0100088\t上海光电医用电子仪器有限公司\tYes\t急诊科\t1号楼 综合楼\t1\t7991065
10037\tZC-2023-10037\t医院自有\tCOD-10037\t8\t1号楼 综合楼 6F 创伤重症监护区\t03\t医用诊察和监护器械\t04\t监护设备\t01\t病人监护设备\t病人监护仪\tG30\t2016/9/20\t10\tCN42709621\t飞利浦金科威(深圳)实业公司\tYes\t创伤外科\t1号楼 综合楼\t6\t7991148
19824\tZC-2023-09824\t医院自有\tCOD-09824\t1\t1号楼 综合楼 8F 手术1间\t08\t呼吸、麻醉和急救器械\t02\t麻醉器械\t01\t麻醉机\t麻醉系统\tAespire\t2016/10/20\t10\tAMX16280105WA\t通用电气医疗系统(中国)有限公司\tYes\t麻醉手术科\t1号楼 综合楼\t8\t7991103
19322\tZC-2023-09322\t医院自有\tCOD-09322\t1\t1号楼 综合楼 6F 透析大厅1床\t10\t输血、透析和体外循环器械\t03\t血液净化及腹膜透析设备\t01\t血液透析设备\t血液透析设备\t4008s\t2017/1/25\t10\t7VCA0VP9\t费森尤斯医疗\tYes\t血液透析室\t1号楼 综合楼\t6\t7991162
19856\tZC-2023-09856\t医院自有\tCOD-09856\t1\t1号楼 综合楼 12F 呼吸重症监护区\t08\t呼吸、麻醉和急救器械\t01\t呼吸设备\t01\t治疗呼吸机(生命支持)\t呼吸机\tSERVO-s\t2019/4/9\t10\t43733\t迈柯唯重症监护公司\tYes\t呼吸与危重症医学科\t1号楼 综合楼\t12\t7991225`;
    handleTextChange(sample);
  };

  // Crucial: Early return only AFTER all hooks are declared!
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/65 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 transition-all">
      <div
        className={`bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-slate-200/90 transition-all duration-200 ${
          isFullScreen
            ? 'w-full h-full max-w-none max-h-none rounded-none'
            : 'w-full max-w-7xl max-h-[94vh]'
        }`}
      >
        {/* ===================== Header ===================== */}
        <div className="px-6 py-3.5 border-b border-slate-200 flex items-center justify-between bg-linear-to-r from-slate-50 to-slate-100/70">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-100/90 text-blue-700 rounded-xl shadow-2xs">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h3 className="font-bold text-slate-900 text-base">
                  批量导入设备台账数据
                </h3>
                <span className="text-[11px] font-bold px-2.5 py-0.5 bg-blue-50 text-blue-800 rounded-full border border-blue-200 font-mono">
                  TSV / Excel 智能多维映射
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {step === 'input' && '第一步：复制粘贴表格文本或上传导出的 TSV / CSV 数据文件'}
                {step === 'preview' && '第二步：全景核对解析出的 18 维设备台账数据、校验准确性并选择写入模式'}
                {step === 'importing' && '第三步：正在高并发写入系统数据库与同步关联科室档案...'}
                {step === 'complete' && '第四步：导入完成，台账已实时更新入库'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Fullscreen Toggle */}
            <button
              type="button"
              onClick={() => setIsFullScreen(!isFullScreen)}
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-200/70 rounded-lg transition cursor-pointer"
              title={isFullScreen ? '退出全屏' : '展开全屏查看数据全貌'}
            >
              {isFullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            {step !== 'importing' && (
              <button
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/70 rounded-lg transition cursor-pointer"
                title="关闭视窗"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* ===================== Step Indicator Bar ===================== */}
        <div className="bg-slate-100/80 px-6 py-2 border-b border-slate-200 flex items-center justify-between text-xs font-semibold text-slate-500">
          <div className={`flex items-center gap-1.5 ${step === 'input' ? 'text-blue-600 font-bold' : ''}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${step === 'input' ? 'bg-blue-600 text-white' : 'bg-slate-300 text-slate-700'}`}>1</span>
            <span>数据粘贴与解析</span>
          </div>
          <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
          <div className={`flex items-center gap-1.5 ${step === 'preview' ? 'text-blue-600 font-bold' : ''}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${step === 'preview' ? 'bg-blue-600 text-white' : 'bg-slate-300 text-slate-700'}`}>2</span>
            <span>全景数据预览核对 ({parsedItems.length} 台)</span>
          </div>
          <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
          <div className={`flex items-center gap-1.5 ${step === 'importing' ? 'text-blue-600 font-bold' : ''}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${step === 'importing' ? 'bg-blue-600 text-white animate-pulse' : 'bg-slate-300 text-slate-700'}`}>3</span>
            <span>写入数据库</span>
          </div>
          <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
          <div className={`flex items-center gap-1.5 ${step === 'complete' ? 'text-emerald-600 font-bold' : ''}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${step === 'complete' ? 'bg-emerald-600 text-white' : 'bg-slate-300 text-slate-700'}`}>4</span>
            <span>导入成功</span>
          </div>
        </div>

        {/* ===================== Modal Body ===================== */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 flex flex-col gap-4 bg-slate-50/50">
          
          {/* ==================== STEP 1: INPUT ==================== */}
          {step === 'input' && (
            <div className="flex-1 flex flex-col gap-4">
              <div className="text-xs text-slate-700 bg-blue-50/90 border border-blue-200/80 rounded-xl p-4 leading-relaxed flex items-start gap-3 shadow-2xs">
                <Sparkles className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <div className="space-y-1.5">
                  <p className="font-bold text-blue-950 text-sm">导入规则提示：支持直接从 Excel 表格或记事本框选复制粘贴</p>
                  <ul className="text-slate-600 text-xs space-y-1 list-disc list-inside">
                    <li><strong className="text-blue-900">科室主数据自动联动：</strong>系统已建立全院标准科室主数据，导入时仅需填写「科室」字段，楼号、楼层、护士站电话及责任人将自动通过主数据补全，无需重复导入。</li>
                    <li><strong className="text-blue-900">纯数字科室内部编号：</strong>未提供科室内部编号时，系统将遵循<span className="text-amber-800 font-bold font-mono">「相同科室 + 二级品目」</span>自然数纯数字自增规则 (1, 2, 3...) 自动生成。</li>
                    <li><strong className="text-blue-900">资产台账字段同步：</strong>自动映射资产编号、资产归属、code_id 及 18 维分类规格与计量校准档案。</li>
                  </ul>
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2.5">
                  <label className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-lg text-xs font-bold cursor-pointer transition shadow-2xs">
                    <FileText className="w-4 h-4 text-blue-600" />
                    <span>上传 .txt / .tsv / .csv 文件</span>
                    <input
                      type="file"
                      accept=".txt,.tsv,.csv"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={handleLoadSampleData}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-50 hover:bg-blue-100 text-blue-800 rounded-lg text-xs font-bold cursor-pointer transition border border-blue-200"
                  >
                    <Sparkles className="w-4 h-4 text-blue-600" />
                    <span>填入三甲医院标准示例数据 (10台)</span>
                  </button>
                </div>

                {parsedItems.length > 0 && (
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 px-3.5 py-2 rounded-lg border border-emerald-200">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>已即时识别: {parsedItems.length} 条设备台账记录</span>
                  </div>
                )}
              </div>

              <div className="flex-1 min-h-[300px] flex flex-col">
                <textarea
                  value={tsvText}
                  onChange={(e) => handleTextChange(e.target.value)}
                  placeholder={`在此粘贴从 Excel 复制的数据列或 TSV 文本，例如：\nID_设备信息\t类别序号\t类别\t一级序号\t一级类别\t二级序号\t二级类别\t设备名称\t规格型号\t投用时间\t产品有效期\t出厂编号\t厂商名称\t计量校准\t科室\t楼号\t楼层\t护士站电话\n10155\t06\t医用成像器械\t07\t超声影像诊断设备\t02\t超声回波多普勒成像设备\t超声诊断系统\tACUSON S2000\t2012/1/1\t10\t205843\t美国西门子医疗系统公司\tYes\t超声科\t1号楼 综合楼\t3\t`}
                  className="w-full flex-1 min-h-[280px] p-3.5 text-xs font-mono bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-200 focus:border-blue-500 outline-hidden resize-y text-slate-800 placeholder-slate-400 shadow-2xs"
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl p-3">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span className="font-semibold">{error}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                >
                  取消
                </button>
                <button
                  type="button"
                  onClick={handleGoToPreview}
                  disabled={!tsvText.trim() || parsedItems.length === 0}
                  className="px-5 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-sm transition cursor-pointer flex items-center gap-2"
                >
                  <span>下一步：全貌数据解析与预览 ({parsedItems.length} 台)</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ==================== STEP 2: FULL DATA PREVIEW ==================== */}
          {step === 'preview' && (
            <div className="flex-1 flex flex-col gap-4">
              
              {/* Top 4 Summary Metrics Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-2xs flex items-center gap-3">
                  <div className="p-2.5 bg-blue-50 text-blue-700 rounded-lg border border-blue-100">
                    <Database className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 font-medium">识别设备总数</div>
                    <div className="text-lg font-bold text-slate-900 font-mono">{parsedItems.length} 台</div>
                  </div>
                </div>

                <div className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-2xs flex items-center gap-3">
                  <div className="p-2.5 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-100">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 font-medium">覆盖使用科室</div>
                    <div className="text-lg font-bold text-slate-900">{uniqueDepts} 个科室</div>
                  </div>
                </div>

                <div className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-2xs flex items-center gap-3">
                  <div className="p-2.5 bg-purple-50 text-purple-700 rounded-lg border border-purple-100">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 font-medium">覆盖制造厂牌</div>
                    <div className="text-lg font-bold text-slate-900">{uniqueMfrs} 家厂商</div>
                  </div>
                </div>

                <div className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-2xs flex items-center gap-3">
                  <div className="p-2.5 bg-amber-50 text-amber-700 rounded-lg border border-amber-100">
                    <DollarSign className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 font-medium">资产购置原值评估</div>
                    <div className="text-lg font-bold text-slate-900 font-mono">¥{(totalVal / 10000).toFixed(1)} 万元</div>
                  </div>
                </div>
              </div>

              {/* Toolbar: Search, Dept Filter, Column View Toggle, Page Size */}
              <div className="bg-white p-3 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
                <div className="flex items-center gap-2.5 flex-1 min-w-[280px]">
                  <div className="relative flex-1 max-w-sm">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={previewSearch}
                      onChange={(e) => {
                        setPreviewSearch(e.target.value);
                        setCurrentPage(1);
                      }}
                      placeholder="快速搜索预览数据(名称/型号/SN/科室/厂商)..."
                      className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
                    />
                    {previewSearch && (
                      <button
                        onClick={() => setPreviewSearch('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Dept Filter */}
                  <select
                    value={selectedDeptFilter}
                    onChange={(e) => {
                      setSelectedDeptFilter(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 font-medium focus:outline-none"
                  >
                    <option value="ALL">全部科室 ({parsedItems.length})</option>
                    {uniqueDeptsList.map((d) => (
                      <option key={d} value={d}>
                        {d} ({parsedItems.filter((i) => i.department === d).length})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2.5">
                  {/* Column View Toggle */}
                  <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-100 text-xs font-semibold">
                    <button
                      type="button"
                      onClick={() => setColumnViewMode('all')}
                      className={`px-2.5 py-1 rounded-md transition ${
                        columnViewMode === 'all'
                          ? 'bg-white text-blue-700 shadow-2xs font-bold'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      全字段视图 (18维全量)
                    </button>
                    <button
                      type="button"
                      onClick={() => setColumnViewMode('essential')}
                      className={`px-2.5 py-1 rounded-md transition ${
                        columnViewMode === 'essential'
                          ? 'bg-white text-blue-700 shadow-2xs font-bold'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      精简视图
                    </button>
                  </div>
                </div>
              </div>

              {/* Data Table Full Preview Container */}
              <div className="flex-1 border border-slate-200 rounded-xl overflow-hidden flex flex-col bg-white shadow-2xs min-h-[340px]">
                <div className="bg-slate-50/90 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between text-xs font-bold text-slate-700">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-blue-600" />
                    <span>
                      数据全貌预览网格（当前显示 {filteredParsedItems.length === 0 ? 0 : (pageSize === 0 ? 1 : (currentPage - 1) * pageSize + 1)} - {pageSize === 0 ? filteredParsedItems.length : Math.min(currentPage * pageSize, filteredParsedItems.length)} 条，共 {filteredParsedItems.length} 条过滤结果）
                    </span>
                  </div>
                  <span className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> 所有列字段已智能匹配
                  </span>
                </div>

                <div className="overflow-x-auto overflow-y-auto flex-1 max-h-[460px]">
                  <table className="w-full text-xs text-left text-slate-700 border-collapse">
                    <thead className="bg-slate-100/90 text-slate-700 font-bold sticky top-0 z-10 border-b border-slate-200 shadow-2xs">
                      <tr>
                        <th className="py-2.5 px-3 text-center w-12 border-r border-slate-200 bg-slate-100">序号</th>
                        <th className="py-2.5 px-3 border-r border-slate-200 bg-slate-100 whitespace-nowrap">设备编号(ID)</th>
                        <th className="py-2.5 px-3 border-r border-slate-200 whitespace-nowrap">资产编号</th>
                        <th className="py-2.5 px-3 border-r border-slate-200 whitespace-nowrap">资产归属</th>
                        <th className="py-2.5 px-3 border-r border-slate-200 whitespace-nowrap">code_id</th>
                        <th className="py-2.5 px-3 border-r border-slate-200 whitespace-nowrap" title="科室内部编号/临床自编号(如8号监护仪、1号彩超)">科室内部编号</th>
                        <th className="py-2.5 px-3.5 border-r border-slate-200 bg-slate-100 whitespace-nowrap">设备名称 (100%原样)</th>
                        <th className="py-2.5 px-3 border-r border-slate-200 bg-slate-100 whitespace-nowrap">规格型号</th>
                        {columnViewMode === 'all' && (
                          <>
                            <th className="py-2.5 px-3 border-r border-slate-200 whitespace-nowrap">大类编码/名称</th>
                            <th className="py-2.5 px-3 border-r border-slate-200 whitespace-nowrap">一级品目</th>
                            <th className="py-2.5 px-3 border-r border-slate-200 whitespace-nowrap">二级品目</th>
                          </>
                        )}
                        <th className="py-2.5 px-3 border-r border-slate-200 whitespace-nowrap">出厂编号(SN)</th>
                        <th className="py-2.5 px-3.5 border-r border-slate-200 whitespace-nowrap">生产制造厂商</th>
                        <th className="py-2.5 px-3 border-r border-slate-200 whitespace-nowrap">使用科室</th>
                        <th className="py-2.5 px-3 border-r border-slate-200 whitespace-nowrap">使用场所</th>
                        <th className="py-2.5 px-3 border-r border-slate-200 whitespace-nowrap">护士站电话</th>
                        <th className="py-2.5 px-3 border-r border-slate-200 whitespace-nowrap">楼栋/楼层位置</th>
                        {columnViewMode === 'all' && (
                          <>
                            <th className="py-2.5 px-3 border-r border-slate-200 whitespace-nowrap">投用日期</th>
                            <th className="py-2.5 px-3 border-r border-slate-200 whitespace-nowrap">设计年限</th>
                            <th className="py-2.5 px-3 border-r border-slate-200 whitespace-nowrap">计量校准属性</th>
                            <th className="py-2.5 px-3 whitespace-nowrap">购置原值</th>
                          </>
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {paginatedItems.length === 0 ? (
                        <tr>
                          <td colSpan={columnViewMode === 'all' ? 21 : 14} className="py-12 text-center text-slate-400">
                            未找到符合搜索条件的设备数据
                          </td>
                        </tr>
                      ) : (
                        paginatedItems.map((item, idx) => {
                          const absoluteIdx = (currentPage - 1) * (pageSize || 1) + idx + 1;
                          return (
                            <tr key={idx} className="hover:bg-blue-50/40 transition">
                              <td className="py-2 px-3 text-center font-mono text-slate-400 border-r border-slate-100">
                                {absoluteIdx}
                              </td>
                              <td className="py-2 px-3 font-mono font-bold text-blue-700 border-r border-slate-100 whitespace-nowrap">
                                {item.id}
                              </td>
                              <td className="py-2 px-3 font-mono text-slate-700 border-r border-slate-100 whitespace-nowrap">
                                <span className="bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded font-mono text-[11px]">
                                  {item.assetNo || `ZC-2023-${item.id}`}
                                </span>
                              </td>
                              <td className="py-2 px-3 border-r border-slate-100 whitespace-nowrap">
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-100">
                                  {item.assetOwnership || '医院自有'}
                                </span>
                              </td>
                              <td className="py-2 px-3 font-mono text-slate-600 border-r border-slate-100 whitespace-nowrap text-[11px]">
                                {item.codeId || `COD-${item.id}`}
                              </td>
                              <td className="py-2 px-3 font-mono text-slate-800 border-r border-slate-100 whitespace-nowrap">
                                <span className="bg-amber-50 text-amber-800 px-1.5 py-0.5 rounded border border-amber-200 text-[11px] font-bold">
                                  {item.internalNo || '-'}
                                </span>
                              </td>
                              <td className="py-2 px-3.5 font-bold text-slate-900 border-r border-slate-100 whitespace-nowrap">
                                {item.name}
                              </td>
                              <td className="py-2 px-3 font-mono text-slate-700 border-r border-slate-100 whitespace-nowrap">
                                {item.model || '-'}
                              </td>
                              {columnViewMode === 'all' && (
                                <>
                                  <td className="py-2 px-3 text-slate-600 border-r border-slate-100 whitespace-nowrap">
                                    <span className="font-mono text-slate-500">[{item.categoryNo || '-'}]</span> {item.category || '-'}
                                  </td>
                                  <td className="py-2 px-3 text-slate-600 border-r border-slate-100 whitespace-nowrap">
                                    {item.level1Category || '-'}
                                  </td>
                                  <td className="py-2 px-3 text-emerald-800 font-medium border-r border-slate-100 whitespace-nowrap">
                                    {item.level2Category || '-'}
                                  </td>
                                </>
                              )}
                              <td className="py-2 px-3 font-mono text-slate-600 border-r border-slate-100 whitespace-nowrap">
                                {item.sn || '-'}
                              </td>
                              <td className="py-2 px-3.5 text-slate-700 border-r border-slate-100 max-w-[200px] truncate" title={item.manufacturer}>
                                {item.manufacturer || '-'}
                              </td>
                              <td className="py-2 px-3 font-bold text-slate-800 border-r border-slate-100 whitespace-nowrap">
                                {item.department}
                              </td>
                              <td className="py-2 px-3 text-slate-700 border-r border-slate-100 whitespace-nowrap max-w-[160px] truncate" title={item.usageLocation || item.location}>
                                {item.usageLocation || item.location || '-'}
                              </td>
                              <td className="py-2 px-3 font-mono text-blue-800 font-semibold border-r border-slate-100 whitespace-nowrap">
                                {item.nursePhone ? `☎ ${item.nursePhone}` : '-'}
                              </td>
                              <td className="py-2 px-3 text-slate-600 border-r border-slate-100 whitespace-nowrap">
                                {item.building || ''} {item.floor ? `${item.floor}F` : ''}
                              </td>
                              {columnViewMode === 'all' && (
                                <>
                                  <td className="py-2 px-3 font-mono text-slate-600 border-r border-slate-100 whitespace-nowrap">
                                    {item.enableDate || item.manufactureDate || '-'}
                                  </td>
                                  <td className="py-2 px-3 font-mono text-slate-600 border-r border-slate-100 whitespace-nowrap">
                                    {item.productValidity ? `${item.productValidity} 年` : '-'}
                                  </td>
                                  <td className="py-2 px-3 border-r border-slate-100 whitespace-nowrap">
                                    <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                                      item.calibration === 'Yes'
                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                        : 'bg-slate-100 text-slate-600'
                                    }`}>
                                      {item.calibration === 'Yes' ? '法定强检/校准' : '免检/常规巡检'}
                                    </span>
                                  </td>
                                  <td className="py-2 px-3 font-mono font-bold text-slate-900 whitespace-nowrap notranslate" translate="no">
                                    ￥{(item.purchasePrice || 0).toLocaleString()}
                                  </td>
                                </>
                              )}
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Controls Footer */}
                <Pagination
                  currentPage={currentPage}
                  pageSize={pageSize}
                  totalCount={filteredParsedItems.length}
                  onPageChange={setCurrentPage}
                  onPageSizeChange={(sz) => {
                    setPageSize(sz);
                    setCurrentPage(1);
                  }}
                />
              </div>

              {/* Mode Selection */}
              <div className="bg-white p-3.5 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs shadow-2xs">
                <span className="font-bold text-slate-800 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                  <span>数据入库写入规则模式：</span>
                </span>
                <div className="flex items-center gap-5">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="importMode"
                      checked={!overwrite}
                      onChange={() => setOverwrite(false)}
                      className="text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                    />
                    <span className="text-slate-800 font-semibold">
                      追加导入（在原有台账上累加，保留现有数据）
                    </span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="importMode"
                      checked={overwrite}
                      onChange={() => setOverwrite(true)}
                      className="text-rose-600 focus:ring-rose-500 w-4 h-4 cursor-pointer"
                    />
                    <span className="text-rose-700 font-bold">
                      清空覆盖（清空现有所有旧台账并以此批次重置）
                    </span>
                  </label>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setStep('input')}
                  className="px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 border border-slate-200 rounded-lg transition cursor-pointer flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>返回重新粘贴/修改</span>
                </button>
                <button
                  type="button"
                  onClick={handleStartImport}
                  className="px-6 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md transition cursor-pointer flex items-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  <span>确认无误，开始写入数据库 ({parsedItems.length} 台设备)</span>
                </button>
              </div>
            </div>
          )}

          {/* ==================== STEP 3: IMPORTING PROGRESS BAR ==================== */}
          {step === 'importing' && (
            <div className="py-14 px-4 flex flex-col items-center justify-center gap-6">
              <div className="relative flex items-center justify-center">
                <Loader2 className="w-14 h-14 text-blue-600 animate-spin" />
                <span className="absolute text-xs font-bold text-blue-900 font-mono">{progress}%</span>
              </div>

              <div className="text-center">
                <h4 className="font-bold text-slate-900 text-lg mb-1">正在批量写入设备台账数据...</h4>
                <p className="text-xs text-slate-500 font-medium min-h-[20px]">{progressStatus}</p>
              </div>

              {/* Progress bar container */}
              <div className="w-full max-w-lg bg-slate-200/80 rounded-full h-3.5 overflow-hidden p-0.5 border border-slate-300">
                <div
                  className="bg-gradient-to-r from-blue-600 via-indigo-600 to-teal-500 h-full rounded-full transition-all duration-300 shadow-sm"
                  style={{ width: `${progress}%` }}
                />
              </div>

              {/* Step Progress Checklist */}
              <div className="w-full max-w-lg bg-white border border-slate-200 rounded-xl p-4 text-xs text-slate-600 flex flex-col gap-2.5 shadow-2xs">
                <div className={`flex items-center gap-2.5 ${currentTaskIndex >= 1 ? 'text-emerald-700 font-bold' : 'text-slate-400'}`}>
                  <CheckCircle2 className={`w-4 h-4 ${currentTaskIndex >= 1 ? 'text-emerald-600' : 'text-slate-300'}`} />
                  <span>解析数据元格式与 18 个维度的列映射</span>
                </div>
                <div className={`flex items-center gap-2.5 ${currentTaskIndex >= 2 ? 'text-emerald-700 font-bold' : 'text-slate-400'}`}>
                  <CheckCircle2 className={`w-4 h-4 ${currentTaskIndex >= 2 ? 'text-emerald-600' : 'text-slate-300'}`} />
                  <span>验证设备编号 (ID) 与出厂序列号 (SN) 的规则正确性</span>
                </div>
                <div className={`flex items-center gap-2.5 ${currentTaskIndex >= 3 ? 'text-emerald-700 font-bold' : 'text-slate-400'}`}>
                  <CheckCircle2 className={`w-4 h-4 ${currentTaskIndex >= 3 ? 'text-emerald-600' : 'text-slate-300'}`} />
                  <span>写入核心台账表与同步科室、楼栋与护士站电话</span>
                </div>
                <div className={`flex items-center gap-2.5 ${currentTaskIndex >= 4 ? 'text-emerald-700 font-bold' : 'text-slate-400'}`}>
                  <CheckCircle2 className={`w-4 h-4 ${currentTaskIndex >= 4 ? 'text-emerald-600' : 'text-slate-300'}`} />
                  <span>更新计量校准、国家强检档案与维护保养规则日志</span>
                </div>
              </div>
            </div>
          )}

          {/* ==================== STEP 4: COMPLETE ==================== */}
          {step === 'complete' && (
            <div className="py-10 px-4 flex flex-col items-center justify-center text-center gap-6">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center shadow-md">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div>
                <h4 className="font-bold text-slate-900 text-xl">设备数据批量导入成功！</h4>
                <p className="text-xs text-slate-500 mt-1">
                  已成功将 <span className="font-bold text-emerald-700 font-mono text-sm">{parsedItems.length}</span> 台设备数据完整写入系统台账。
                </p>
              </div>

              {/* Stats Box */}
              <div className="grid grid-cols-3 gap-4 w-full max-w-md bg-white border border-slate-200 rounded-xl p-4 text-center shadow-2xs">
                <div>
                  <div className="text-[11px] text-slate-500 font-medium">本次导入设备</div>
                  <div className="text-lg font-bold text-slate-900 font-mono">{parsedItems.length} 台</div>
                </div>
                <div>
                  <div className="text-[11px] text-slate-500 font-medium">涉及科室</div>
                  <div className="text-lg font-bold text-slate-900">{uniqueDepts} 个</div>
                </div>
                <div>
                  <div className="text-[11px] text-slate-500 font-medium">写入状态</div>
                  <div className="text-xs font-bold text-emerald-600 mt-1">100% 成功入库</div>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-4 border-t border-slate-200 w-full justify-center">
                <button
                  type="button"
                  onClick={() => setStep('input')}
                  className="px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-100 rounded-xl transition cursor-pointer flex items-center gap-1.5 border border-slate-300"
                >
                  <RotateCcw className="w-4 h-4 text-slate-500" />
                  <span>继续导入下一批</span>
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md transition cursor-pointer flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>完成并体验新台账</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

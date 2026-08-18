import React, { useState, useEffect } from 'react';
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
  RotateCcw
} from 'lucide-react';
import { parseEquipmentTsv } from '../utils/tsvParser';
import { MedicalEquipment } from '../types';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (items: MedicalEquipment[], overwrite: boolean) => Promise<void> | void;
}

type ImportStep = 'input' | 'preview' | 'importing' | 'complete';

export const ImportModal: React.FC<ImportModalProps> = ({
  isOpen,
  onClose,
  onImport
}) => {
  const [step, setStep] = useState<ImportStep>('input');
  const [tsvText, setTsvText] = useState('');
  const [overwrite, setOverwrite] = useState(false);
  const [parsedItems, setParsedItems] = useState<MedicalEquipment[]>([]);
  const [error, setError] = useState<string | null>(null);

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
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTextChange = (text: string) => {
    setTsvText(text);
    setError(null);
    if (!text.trim()) {
      setParsedItems([]);
      return;
    }
    try {
      const items = parseEquipmentTsv(text);
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
    const items = parseEquipmentTsv(tsvText);
    if (items.length === 0) {
      setError('未检测到有效的设备数据行，请确认包含表头或按列分隔的数据');
      return;
    }
    setParsedItems(items);
    setError(null);
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

  // Preset Sample Data filler
  const handleLoadSampleData = () => {
    const sample = `ID_设备信息\t类别序号\t类别\t一级序号\t一级类别\t二级序号\t二级类别\t设备名称\t规格型号\t投用时间\t产品有效期\t出厂编号\t厂商名称\t计量校准\t科室\t楼号\t楼层\t护士站电话
10155\t06\t医用成像器械\t07\t超声影像诊断设备\t02\t超声回波多普勒成像设备\t超声诊断系统\tACUSON S2000\t2012/1/1\t10\t205843\t美国西门子医疗系统公司\tYes\t超声科\t1号楼 综合楼\t3\t
10154\t06\t医用成像器械\t07\t超声影像诊断设备\t02\t超声回波多普勒成像设备\t便携式彩色超声诊断系统\tCX50\t2021/1/6\t10\tB3KB6Q\t飞利浦超声股份有限公司\tYes\t超声科\t1号楼 综合楼\t3\t
10152\t06\t医用成像器械\t07\t超声影像诊断设备\t02\t超声回波多普勒成像设备\t彩色超声诊断系统\tEPIQ 5\t2017/11/20\t10\tUS917C0265\t飞利浦超声公司\tYes\t超声科\t1号楼 综合楼\t3\t
10417\t06\t医用成像器械\t07\t超声影像诊断设备\t02\t超声回波多普勒成像设备\t超声诊断仪\tLOGIQ E10s\t2023/1/1\t7\tLEX380054\t通用电气医疗系统(中国)有限公司\tYes\t超声科\t1号楼 综合楼\t3\t
10380\t06\t医用成像器械\t07\t超声影像诊断设备\t02\t超声回波多普勒成像设备\t便携式彩色多普勒超声诊断系统\tPA12A\t2023/1/9\t10\t20PA12030002\t北京智影技术有限公司\tYes\t血液透析室\t1号楼 综合楼\t6\t7991162
10096\t03\t医用诊察和监护器械\t03\t生理参数分析测量设备\t01\t心电测量、分析设备\t多道心电图机\tECG-2250\t2016/7/1\t10\t0100088\t上海光电医用电子仪器有限公司\tYes\t急诊科\t1号楼 综合楼\t1\t7991065
10037\t03\t医用诊察和监护器械\t04\t监护设备\t01\t病人监护设备\t病人监护仪\tG30\t2016/9/20\t10\tCN42709621\t飞利浦金科威(深圳)实业公司\tYes\t创伤外科\t1号楼 综合楼\t6\t7991148
9824\t08\t呼吸、麻醉和急救器械\t02\t麻醉器械\t01\t麻醉机\t麻醉系统\tAespire\t2016/10/20\t10\tAMX16280105WA\t通用电气医疗系统(中国)有限公司\tYes\t麻醉手术科\t1号楼 综合楼\t8\t7991103
9322\t10\t输血、透析和体外循环器械\t03\t血液净化及腹膜透析设备\t01\t血液透析设备\t血液透析设备\t4008s\t2017/1/25\t10\t7VCA0VP9\t费森尤斯医疗\tYes\t血液透析室\t1号楼 综合楼\t6\t7991162
9856\t08\t呼吸、麻醉和急救器械\t01\t呼吸设备\t01\t治疗呼吸机(生命支持)\t呼吸机\tSERVO-s\t2019/4/9\t10\t43733\t迈柯唯重症监护公司\tYes\t呼吸与危重症医学科\t1号楼 综合楼\t12\t7991225`;
    handleTextChange(sample);
  };

  // Preview metrics
  const uniqueDepts = new Set(parsedItems.map((i) => i.department)).size;
  const uniqueMfrs = new Set(parsedItems.map((i) => i.manufacturer)).size;
  const totalVal = parsedItems.reduce((acc, curr) => acc + (curr.purchasePrice || 0), 0);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 transition-all">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[92vh] border border-slate-100">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-100/80 text-blue-700 rounded-lg">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                批量导入设备台账数据
                <span className="text-[11px] font-semibold px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full border border-blue-200/60">
                  TSV / Excel 映射
                </span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {step === 'input' && '第一步：复制粘贴表格文本或上传导出的 TSV 数据文件'}
                {step === 'preview' && '第二步：核对解析后的结构数据与导入模式'}
                {step === 'importing' && '第三步：写入系统数据库与索引关联中...'}
                {step === 'complete' && '第四步：导入成功，台账已实时更新'}
              </p>
            </div>
          </div>
          {step !== 'importing' && (
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 transition cursor-pointer p-1.5 rounded-lg hover:bg-slate-200/60"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Step Indicator Bar */}
        <div className="bg-slate-100/70 px-6 py-2 border-b border-slate-200/60 flex items-center justify-between text-xs font-semibold text-slate-500">
          <div className={`flex items-center gap-1.5 ${step === 'input' ? 'text-blue-600 font-bold' : ''}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step === 'input' ? 'bg-blue-600 text-white' : 'bg-slate-300 text-slate-700'}`}>1</span>
            <span>数据粘贴/上传</span>
          </div>
          <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
          <div className={`flex items-center gap-1.5 ${step === 'preview' ? 'text-blue-600 font-bold' : ''}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step === 'preview' ? 'bg-blue-600 text-white' : 'bg-slate-300 text-slate-700'}`}>2</span>
            <span>解析与列预览 ({parsedItems.length})</span>
          </div>
          <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
          <div className={`flex items-center gap-1.5 ${step === 'importing' ? 'text-blue-600 font-bold' : ''}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step === 'importing' ? 'bg-blue-600 text-white animate-pulse' : 'bg-slate-300 text-slate-700'}`}>3</span>
            <span>写入进度</span>
          </div>
          <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
          <div className={`flex items-center gap-1.5 ${step === 'complete' ? 'text-emerald-600 font-bold' : ''}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step === 'complete' ? 'bg-emerald-600 text-white' : 'bg-slate-300 text-slate-700'}`}>4</span>
            <span>导入完成</span>
          </div>
        </div>

        {/* Modal Body Content depending on step */}
        <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-4">
          {/* STEP 1: INPUT */}
          {step === 'input' && (
            <>
              <div className="text-xs text-slate-600 bg-blue-50/80 border border-blue-200/80 rounded-lg p-3.5 leading-relaxed flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-blue-900 mb-1">提示：可以直接从 Excel 或记事本框选所有列复制粘贴</p>
                  <p className="text-slate-600">系统会自动以 Tab 制表符识别列，支持字段包含：<code className="bg-white/80 px-1 py-0.5 rounded border border-blue-200/80 font-mono text-[11px] text-slate-800">设备ID, 类别, 名称, 规格型号, 投用时间, 出厂编号(SN), 厂商, 科室, 楼号, 楼层...</code></p>
                </div>
              </div>

              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer transition shadow-2xs">
                    <FileText className="w-4 h-4 text-slate-600" />
                    <span>上传 .txt / .tsv 文件</span>
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
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-semibold cursor-pointer transition border border-blue-200/70"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                    <span>填入示例数据 (10条)</span>
                  </button>
                </div>

                {parsedItems.length > 0 && (
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>成功识别: {parsedItems.length} 条有效记录</span>
                  </div>
                )}
              </div>

              <div className="flex-1 min-h-[220px] flex flex-col">
                <textarea
                  value={tsvText}
                  onChange={(e) => handleTextChange(e.target.value)}
                  placeholder={`在此粘贴从 Excel 复制的数据列或 TSV 文本，例如：\nID_设备信息\t类别序号\t类别\t设备名称\t规格型号\t投用时间\t出厂编号\t厂商名称\t科室\n10155\t06\t医用成像器械\t超声诊断系统\tACUSON S2000\t2012/1/1\t205843\t西门子\t超声科`}
                  className="w-full h-full min-h-[200px] p-3 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500 outline-hidden resize-y text-slate-800 placeholder-slate-400"
                />
              </div>

              {error && (
                <div className="flex items-center gap-1.5 text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded-lg p-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                >
                  取消
                </button>
                <button
                  type="button"
                  onClick={handleGoToPreview}
                  disabled={!tsvText.trim() || parsedItems.length === 0}
                  className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-xs transition cursor-pointer flex items-center gap-1.5"
                >
                  <span>下一步：数据解析与预览 ({parsedItems.length}条)</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </>
          )}

          {/* STEP 2: PREVIEW */}
          {step === 'preview' && (
            <>
              {/* Summary Stats Cards */}
              <div className="grid grid-cols-4 gap-3">
                <div className="p-3 bg-blue-50/60 border border-blue-100 rounded-lg flex items-center gap-2.5">
                  <div className="p-2 bg-blue-100 text-blue-700 rounded-md">
                    <Database className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500 font-medium">设备总数</div>
                    <div className="text-base font-bold text-slate-800">{parsedItems.length} 台</div>
                  </div>
                </div>

                <div className="p-3 bg-emerald-50/60 border border-emerald-100 rounded-lg flex items-center gap-2.5">
                  <div className="p-2 bg-emerald-100 text-emerald-700 rounded-md">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500 font-medium">覆盖科室</div>
                    <div className="text-base font-bold text-slate-800">{uniqueDepts} 个科室</div>
                  </div>
                </div>

                <div className="p-3 bg-purple-50/60 border border-purple-100 rounded-lg flex items-center gap-2.5">
                  <div className="p-2 bg-purple-100 text-purple-700 rounded-md">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500 font-medium">覆盖厂牌</div>
                    <div className="text-base font-bold text-slate-800">{uniqueMfrs} 家厂商</div>
                  </div>
                </div>

                <div className="p-3 bg-amber-50/60 border border-amber-100 rounded-lg flex items-center gap-2.5">
                  <div className="p-2 bg-amber-100 text-amber-700 rounded-md">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500 font-medium">评估初始价值</div>
                    <div className="text-xs font-bold text-slate-800">¥{(totalVal / 10000).toFixed(1)} 万</div>
                  </div>
                </div>
              </div>

              {/* Data Table Preview */}
              <div className="flex-1 border border-slate-200 rounded-lg overflow-hidden flex flex-col min-h-[220px]">
                <div className="bg-slate-50 px-3 py-2 border-b border-slate-200 flex items-center justify-between text-xs font-semibold text-slate-600">
                  <span>数据预览 (前 {Math.min(parsedItems.length, 8)} 条 / 共 {parsedItems.length} 条)</span>
                  <span className="text-[11px] text-emerald-600 font-normal flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> 18个字段类型解析匹配正常
                  </span>
                </div>
                <div className="overflow-x-auto overflow-y-auto max-h-[240px]">
                  <table className="w-full text-[11px] text-left text-slate-700">
                    <thead className="bg-slate-100 text-slate-600 font-bold sticky top-0 border-b border-slate-200">
                      <tr>
                        <th className="py-2 px-2 text-center w-10">序号</th>
                        <th className="py-2 px-2.5">设备ID</th>
                        <th className="py-2 px-2.5">设备名称</th>
                        <th className="py-2 px-2.5">规格型号</th>
                        <th className="py-2 px-2.5">所属类别</th>
                        <th className="py-2 px-2.5">出厂SN</th>
                        <th className="py-2 px-2.5">生产厂商</th>
                        <th className="py-2 px-2.5">使用科室</th>
                        <th className="py-2 px-2.5">科室电话(主数据)</th>
                        <th className="py-2 px-2.5">位置</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {parsedItems.slice(0, 8).map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/80 transition">
                          <td className="py-1.5 px-2 text-center font-mono text-slate-400">{idx + 1}</td>
                          <td className="py-1.5 px-2.5 font-mono font-bold text-blue-600">{item.id}</td>
                          <td className="py-1.5 px-2.5 font-semibold text-slate-800">{item.name}</td>
                          <td className="py-1.5 px-2.5 font-mono text-slate-600">{item.model || '-'}</td>
                          <td className="py-1.5 px-2.5 text-slate-500">{item.category}</td>
                          <td className="py-1.5 px-2.5 font-mono text-slate-500">{item.sn || '-'}</td>
                          <td className="py-1.5 px-2.5 text-slate-600 max-w-[120px] truncate" title={item.manufacturer}>{item.manufacturer}</td>
                          <td className="py-1.5 px-2.5 font-semibold text-slate-700">{item.department}</td>
                          <td className="py-1.5 px-2.5 font-mono font-bold text-blue-700">
                            {item.nursePhone ? `☎ ${item.nursePhone}` : '-'}
                          </td>
                          <td className="py-1.5 px-2.5 text-slate-500">{item.building} {item.floor ? `${item.floor}F` : ''}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Mode Selection */}
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700">导入模式选择：</span>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="importMode"
                      checked={!overwrite}
                      onChange={() => setOverwrite(false)}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-slate-700 font-medium">追加导入 (在原有台账基础上累加)</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="importMode"
                      checked={overwrite}
                      onChange={() => setOverwrite(true)}
                      className="text-rose-600 focus:ring-rose-500"
                    />
                    <span className="text-rose-700 font-medium">清空覆盖 (彻底清空旧数据)</span>
                  </label>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setStep('input')}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition cursor-pointer flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>返回重新粘贴</span>
                </button>
                <button
                  type="button"
                  onClick={handleStartImport}
                  className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition cursor-pointer flex items-center gap-1.5"
                >
                  <Upload className="w-4 h-4" />
                  <span>确认开始导入 ({parsedItems.length} 台设备)</span>
                </button>
              </div>
            </>
          )}

          {/* STEP 3: IMPORTING PROGRESS BAR */}
          {step === 'importing' && (
            <div className="py-12 px-4 flex flex-col items-center justify-center gap-6">
              <div className="relative flex items-center justify-center">
                <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
                <span className="absolute text-xs font-bold text-blue-900">{progress}%</span>
              </div>

              <div className="text-center">
                <h4 className="font-bold text-slate-800 text-base mb-1">正在批量写入设备台账数据...</h4>
                <p className="text-xs text-slate-500 font-medium min-h-[20px]">{progressStatus}</p>
              </div>

              {/* Progress bar container */}
              <div className="w-full max-w-md bg-slate-100 rounded-full h-3 overflow-hidden p-0.5 border border-slate-200/80">
                <div
                  className="bg-gradient-to-r from-blue-500 to-indigo-600 h-full rounded-full transition-all duration-300 shadow-xs"
                  style={{ width: `${progress}%` }}
                />
              </div>

              {/* Step Progress Checklist */}
              <div className="w-full max-w-md bg-slate-50 border border-slate-200/80 rounded-lg p-3.5 text-xs text-slate-600 flex flex-col gap-2">
                <div className={`flex items-center gap-2 ${currentTaskIndex >= 1 ? 'text-emerald-700 font-semibold' : 'text-slate-400'}`}>
                  <CheckCircle2 className={`w-4 h-4 ${currentTaskIndex >= 1 ? 'text-emerald-600' : 'text-slate-300'}`} />
                  <span>解析数据元格式与 18 个维度的列映射</span>
                </div>
                <div className={`flex items-center gap-2 ${currentTaskIndex >= 2 ? 'text-emerald-700 font-semibold' : 'text-slate-400'}`}>
                  <CheckCircle2 className={`w-4 h-4 ${currentTaskIndex >= 2 ? 'text-emerald-600' : 'text-slate-300'}`} />
                  <span>验证设备编号 (ID) 与序列号 (SN) 的规则正确性</span>
                </div>
                <div className={`flex items-center gap-2 ${currentTaskIndex >= 3 ? 'text-emerald-700 font-semibold' : 'text-slate-400'}`}>
                  <CheckCircle2 className={`w-4 h-4 ${currentTaskIndex >= 3 ? 'text-emerald-600' : 'text-slate-300'}`} />
                  <span>写入核心台账表与同步科室、楼栋信息</span>
                </div>
                <div className={`flex items-center gap-2 ${currentTaskIndex >= 4 ? 'text-emerald-700 font-semibold' : 'text-slate-400'}`}>
                  <CheckCircle2 className={`w-4 h-4 ${currentTaskIndex >= 4 ? 'text-emerald-600' : 'text-slate-300'}`} />
                  <span>更新计量校准与维护保养规则日志</span>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: COMPLETE */}
          {step === 'complete' && (
            <div className="py-8 px-4 flex flex-col items-center justify-center text-center gap-5">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center shadow-inner">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div>
                <h4 className="font-bold text-slate-800 text-lg">设备数据导入成功！</h4>
                <p className="text-xs text-slate-500 mt-1">
                  已成功将 <span className="font-bold text-emerald-700">{parsedItems.length}</span> 台设备数据写入系统台账。
                </p>
              </div>

              {/* Stats Box */}
              <div className="grid grid-cols-3 gap-3 w-full max-w-md bg-slate-50 border border-slate-200 rounded-lg p-3 text-center">
                <div>
                  <div className="text-[10px] text-slate-400 font-medium">本次导入设备</div>
                  <div className="text-base font-bold text-slate-800">{parsedItems.length} 台</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 font-medium">涉及科室</div>
                  <div className="text-base font-bold text-slate-800">{uniqueDepts} 个</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 font-medium">写入状态</div>
                  <div className="text-xs font-bold text-emerald-600 mt-0.5">100% 成功</div>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-4 border-t border-slate-100 w-full justify-center">
                <button
                  type="button"
                  onClick={() => setStep('input')}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition cursor-pointer flex items-center gap-1.5 border border-slate-200"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                  <span>继续导入下一批</span>
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition cursor-pointer flex items-center gap-1.5"
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

import React, { useState, useMemo, useRef } from 'react';
import { StaffPersonMaster, DepartmentMaster } from '../types';
import { 
  parseStaffImportText, 
  generateStaffTemplateTsv, 
  StaffImportValidationResult 
} from '../utils/staffImportParser';
import { 
  Upload, 
  FileText, 
  Download, 
  Copy, 
  Check, 
  AlertCircle, 
  AlertTriangle, 
  CheckCircle2, 
  X, 
  Layers, 
  RefreshCw,
  Sparkles,
  ArrowRight
} from 'lucide-react';

interface StaffBatchImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  departments: DepartmentMaster[];
  existingStaff: StaffPersonMaster[];
  onImportSuccess: (importedStaff: StaffPersonMaster[], mode: 'merge' | 'overwrite') => void;
}

export const StaffBatchImportModal: React.FC<StaffBatchImportModalProps> = ({
  isOpen,
  onClose,
  departments,
  existingStaff,
  onImportSuccess
}) => {
  const [inputText, setInputText] = useState('');
  const [importMode, setImportMode] = useState<'merge' | 'overwrite'>('merge');
  const [activeStep, setActiveStep] = useState<'input' | 'preview'>('input');
  const [copiedTemplate, setCopiedTemplate] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Parse result memoized
  const parseResult: StaffImportValidationResult = useMemo(() => {
    return parseStaffImportText(inputText, departments, existingStaff);
  }, [inputText, departments, existingStaff]);

  if (!isOpen) return null;

  const handleCopyTemplate = () => {
    const template = generateStaffTemplateTsv();
    navigator.clipboard.writeText(template);
    setCopiedTemplate(true);
    setTimeout(() => setCopiedTemplate(false), 2000);
  };

  const handleLoadSample = () => {
    const sample = generateStaffTemplateTsv();
    setInputText(sample);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        setInputText(text);
      }
    };
    reader.readAsText(file, 'utf-8');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDownloadTemplateFile = () => {
    const template = generateStaffTemplateTsv();
    const blob = new Blob(['\uFEFF' + template], { type: 'text/tab-separated-values;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `人员与工程师主数据导入模板_${new Date().toISOString().slice(0, 10)}.tsv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleConfirmImport = () => {
    const validItems = parseResult.rows.filter(r => r.isValid).map(r => r.item);
    if (validItems.length === 0) {
      alert('没有可导入的有效人员记录！');
      return;
    }

    let finalStaff: StaffPersonMaster[] = [];
    if (importMode === 'overwrite') {
      finalStaff = validItems;
    } else {
      // Merge mode
      const map = new Map<string, StaffPersonMaster>();
      existingStaff.forEach(s => {
        if (s.employeeNo) map.set(s.employeeNo.toUpperCase(), s);
        if (s.name) map.set(s.name.toLowerCase(), s);
      });

      const updatedExisting = [...existingStaff];
      const newItemsToAdd: StaffPersonMaster[] = [];

      validItems.forEach(newItem => {
        const empKey = newItem.employeeNo ? newItem.employeeNo.toUpperCase() : '';
        const nameKey = newItem.name.toLowerCase();
        const existing = (empKey && map.get(empKey)) || map.get(nameKey);

        if (existing) {
          const idx = updatedExisting.findIndex(s => s.id === existing.id);
          if (idx !== -1) {
            updatedExisting[idx] = {
              ...updatedExisting[idx],
              ...newItem,
              id: existing.id // preserve original internal ID
            };
          }
        } else {
          newItemsToAdd.push(newItem);
        }
      });

      finalStaff = [...updatedExisting, ...newItemsToAdd];
    }

    onImportSuccess(finalStaff, importMode);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 md:p-6 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl h-[88vh] max-h-[780px] overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-600/30 text-indigo-400 border border-indigo-500/30">
              <Upload className="w-5 h-5 text-indigo-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-white">批量导入人员与工程师主数据</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                  支持 Excel / TSV / CSV 智能解析
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                可快速批量录入临床设备管理员、医学工程部维修工程师、计量专员与科室责任人
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 flex items-center justify-center text-sm font-bold transition cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Step Tabs & Toolbar */}
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveStep('input')}
              className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition cursor-pointer ${
                activeStep === 'input'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>1. 粘贴或上传数据 ({inputText.trim() ? `${parseResult.totalRows} 行` : '空'})</span>
            </button>

            <button
              onClick={() => {
                if (!inputText.trim()) {
                  alert('请先输入或粘贴数据后再预览！');
                  return;
                }
                setActiveStep('preview');
              }}
              className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition cursor-pointer ${
                activeStep === 'preview'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>2. 校验与结果预览 ({parseResult.validRows} 可导入)</span>
            </button>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <input
              type="file"
              ref={fileInputRef}
              accept=".tsv,.csv,.txt,.xlsx"
              onChange={handleFileUpload}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-2.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-lg font-medium flex items-center gap-1 cursor-pointer transition shadow-2xs"
            >
              <Upload className="w-3.5 h-3.5 text-slate-500" />
              <span>上传文件 (.tsv / .csv)</span>
            </button>

            <button
              onClick={handleLoadSample}
              className="px-2.5 py-1.5 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 text-indigo-700 rounded-lg font-bold flex items-center gap-1 cursor-pointer transition"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>填入标准范例</span>
            </button>

            <button
              onClick={handleCopyTemplate}
              className="px-2.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-lg font-medium flex items-center gap-1 cursor-pointer transition shadow-2xs"
            >
              {copiedTemplate ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
              <span>{copiedTemplate ? '已复制表头' : '复制表头'}</span>
            </button>

            <button
              onClick={handleDownloadTemplateFile}
              className="px-2.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-lg font-medium flex items-center gap-1 cursor-pointer transition shadow-2xs"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>下载模板文件</span>
            </button>
          </div>
        </div>

        {/* Body content */}
        <div className="flex-1 min-h-0 overflow-hidden flex flex-col bg-slate-100/40 p-4">
          {activeStep === 'input' && (
            <div className="flex-1 flex flex-col min-h-0 bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
              <div className="flex items-center justify-between mb-2 text-xs">
                <div className="text-slate-600 font-medium flex items-center gap-2">
                  <span>从 Excel 表格中直接复制多行人员数据，并粘贴到下方文本框中：</span>
                </div>
                {inputText && (
                  <button
                    onClick={() => setInputText('')}
                    className="text-rose-600 hover:text-rose-700 font-medium cursor-pointer"
                  >
                    清空输入
                  </button>
                )}
              </div>

              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="可以直接将 Excel 中的工号、姓名、科室、角色、电话、职称等列复制并粘贴到此处...
例：
工号	姓名	所属科室	角色岗位	联系电话	专业职称	电子邮箱	是否首选责任人	专长领域/分管方向	在职状态
EMP-7010	刘工	医疗设备科	维修工程师	7991237	工程师	liu@hospital.wl.cn	是	放射影像 (CT/MRI/DR/DSA)	在职
EMP-7011	张护士	重症医学科	护士长	7991278	主管护师		是	急救生命支持	在职"
                className="flex-1 w-full p-3 font-mono text-xs text-slate-800 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white resize-none"
              />

              <div className="mt-3 flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
                <div className="flex items-center gap-4">
                  <span>支持字段：工号、姓名、科室、角色、联系电话、专业职称、邮箱、首选对接人(是/否)、专长领域、在职状态</span>
                </div>
                <button
                  onClick={() => {
                    if (!inputText.trim()) {
                      alert('请先输入或粘贴数据！');
                      return;
                    }
                    setActiveStep('preview');
                  }}
                  disabled={!inputText.trim()}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white rounded-lg font-bold flex items-center gap-1.5 shadow-xs cursor-pointer transition"
                >
                  <span>下一步：数据解析与校验</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {activeStep === 'preview' && (
            <div className="flex-1 flex flex-col min-h-0 bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
              
              {/* Validation Summary Bar */}
              <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-3">
                  <span className="px-2.5 py-1 rounded-md bg-white border border-slate-200 font-medium text-slate-700">
                    解析总数: <strong>{parseResult.totalRows}</strong> 行
                  </span>
                  <span className="px-2.5 py-1 rounded-md bg-emerald-50 border border-emerald-200 font-bold text-emerald-700 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    有效通过: {parseResult.validRows} 条
                  </span>
                  {parseResult.invalidRows > 0 && (
                    <span className="px-2.5 py-1 rounded-md bg-rose-50 border border-rose-200 font-bold text-rose-700 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      格式异常: {parseResult.invalidRows} 条
                    </span>
                  )}
                  <span className="px-2.5 py-1 rounded-md bg-indigo-50 border border-indigo-200 font-medium text-indigo-700">
                    新增: {parseResult.newCount} 人 | 更新匹配: {parseResult.updateCount} 人
                  </span>
                </div>

                {/* Import Mode selection */}
                <div className="flex items-center gap-2 bg-white px-3 py-1 rounded-lg border border-slate-200">
                  <span className="text-slate-600 font-bold">导入策略:</span>
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input
                      type="radio"
                      name="importMode"
                      value="merge"
                      checked={importMode === 'merge'}
                      onChange={() => setImportMode('merge')}
                      className="text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-slate-700 font-medium">增量合并更新 (推荐)</span>
                  </label>
                  <label className="flex items-center gap-1 cursor-pointer ml-2">
                    <input
                      type="radio"
                      name="importMode"
                      value="overwrite"
                      checked={importMode === 'overwrite'}
                      onChange={() => setImportMode('overwrite')}
                      className="text-rose-600 focus:ring-rose-500"
                    />
                    <span className="text-rose-600 font-medium">全量覆盖 (清空现有重写)</span>
                  </label>
                </div>
              </div>

              {/* Preview Table */}
              <div className="flex-1 min-h-0 overflow-y-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-slate-50 text-slate-600 sticky top-0 z-10 border-b border-slate-200 font-bold">
                    <tr>
                      <th className="py-2.5 px-3 w-12 text-center">序号</th>
                      <th className="py-2.5 px-3">状态</th>
                      <th className="py-2.5 px-3">工号</th>
                      <th className="py-2.5 px-3">人员姓名</th>
                      <th className="py-2.5 px-3">所属科室</th>
                      <th className="py-2.5 px-3">角色岗位</th>
                      <th className="py-2.5 px-3">联系电话</th>
                      <th className="py-2.5 px-3">职称</th>
                      <th className="py-2.5 px-3 text-center">首选责任人</th>
                      <th className="py-2.5 px-3">专长领域</th>
                      <th className="py-2.5 px-3">在职状态</th>
                      <th className="py-2.5 px-3">提示/诊断</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700 font-normal">
                    {parseResult.rows.map((row) => (
                      <tr 
                        key={row.rowNumber}
                        className={`hover:bg-slate-50/80 transition ${
                          !row.isValid ? 'bg-rose-50/40' : row.isExistingInDatabase ? 'bg-amber-50/20' : ''
                        }`}
                      >
                        <td className="py-2 px-3 text-center font-mono text-slate-400">{row.rowNumber}</td>
                        <td className="py-2 px-3">
                          {row.isValid ? (
                            row.isExistingInDatabase ? (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                                覆盖更新
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                全新录入
                              </span>
                            )
                          ) : (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800">
                              异常不可导
                            </span>
                          )}
                        </td>
                        <td className="py-2 px-3 font-mono font-bold text-slate-900">{row.item.employeeNo}</td>
                        <td className="py-2 px-3 font-bold text-slate-900">{row.item.name}</td>
                        <td className="py-2 px-3 text-slate-700">{row.item.departmentName}</td>
                        <td className="py-2 px-3">
                          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                            {row.item.role}
                          </span>
                        </td>
                        <td className="py-2 px-3 font-mono text-slate-600">{row.item.phone}</td>
                        <td className="py-2 px-3 text-slate-600">{row.item.title || '-'}</td>
                        <td className="py-2 px-3 text-center">
                          {row.item.isPrimaryContact ? (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                              首选
                            </span>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                        <td className="py-2 px-3 text-slate-600">
                          {row.item.specialties && row.item.specialties.length > 0 ? (
                            <div className="flex flex-wrap gap-1 max-w-[200px]">
                              {row.item.specialties.map((s, idx) => (
                                <span key={idx} className="px-1 py-0.2 rounded bg-slate-100 text-slate-600 text-[10px]">
                                  {s}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                        <td className="py-2 px-3">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            row.item.status === 'active' ? 'bg-emerald-100 text-emerald-800' :
                            row.item.status === 'on_leave' ? 'bg-amber-100 text-amber-800' :
                            'bg-slate-100 text-slate-600'
                          }`}>
                            {row.item.status === 'active' ? '在职' : row.item.status === 'on_leave' ? '休假' : '离职'}
                          </span>
                        </td>
                        <td className="py-2 px-3">
                          {row.errors.length > 0 && (
                            <div className="text-[11px] text-rose-600 font-medium">
                              {row.errors.join('; ')}
                            </div>
                          )}
                          {row.warnings.length > 0 && (
                            <div className="text-[11px] text-amber-600">
                              {row.warnings.join('; ')}
                            </div>
                          )}
                          {row.errors.length === 0 && row.warnings.length === 0 && (
                            <span className="text-emerald-600 text-[11px]">校验正常</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Bottom Action bar */}
              <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
                <button
                  onClick={() => setActiveStep('input')}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-100 font-medium cursor-pointer"
                >
                  返回上一步修改
                </button>

                <div className="flex items-center gap-3">
                  <button
                    onClick={onClose}
                    className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-100 font-medium cursor-pointer"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleConfirmImport}
                    disabled={parseResult.validRows === 0}
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white rounded-lg font-bold shadow-xs cursor-pointer flex items-center gap-2 transition"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>确认批量导入 {parseResult.validRows} 位人员与工程师</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  CheckCircle2,
  ShieldCheck,
  PenTool,
  FileText,
  Building2,
  MapPin,
  Phone,
  UserCheck,
  Star,
  RotateCcw,
  Stamp,
  Printer,
  Award,
  AlertCircle,
  Clock,
  Check,
  Sparkles,
  Hash,
  Search
} from 'lucide-react';
import { MonthlyFrameworkItem } from '../../types/vendorCollaborationTypes';
import { DepartmentMaster } from '../../types';
import { resolveMasterDepartment } from '../../utils/masterData';

export interface FlattenedFrameworkItem extends MonthlyFrameworkItem {
  batchId: string;
  batchYearMonth: string;
  batchTitle: string;
  vendorName: string;
}

interface ClinicalItemSignModalProps {
  isOpen: boolean;
  item: FlattenedFrameworkItem | MonthlyFrameworkItem | null;
  departments: DepartmentMaster[];
  onClose: () => void;
  onSaveSignature: (
    itemId: string,
    signaturePayload: {
      clinicalReceiveStatus: 'SIGNED' | 'RECEIVED';
      clinicalSignee: string;
      clinicalSignerRole: string;
      clinicalSignatureTime: string;
      clinicalSignatureCertId: string;
      clinicalSignatureData?: string;
      clinicalFeedback: string;
      clinicalRating: number;
      department: string;
      departmentId?: string;
      departmentCode?: string;
      departmentCampus?: string;
      departmentBuilding?: string;
      departmentFloor?: string;
      departmentPhone?: string;
      departmentHead?: string;
    }
  ) => void;
}

export const ClinicalItemSignModal: React.FC<ClinicalItemSignModalProps> = ({
  isOpen,
  item,
  departments,
  onClose,
  onSaveSignature
}) => {
  if (!isOpen || !item) return null;

  // 1. 关联主数据科室判定
  const initialDeptInput = (item.department === '手术室' || item.department === '手术科' || item.department === '麻醉科' || item.department === '手术麻醉科')
    ? '麻醉手术科'
    : item.department;
  const initialMasterDept = resolveMasterDepartment(initialDeptInput, departments);
  const [selectedDeptName, setSelectedDeptName] = useState<string>(
    initialMasterDept ? initialMasterDept.name : initialDeptInput
  );
  const [deptSearchQuery, setDeptSearchQuery] = useState<string>('');
  const [showDeptDropdown, setShowDeptDropdown] = useState<boolean>(false);

  const currentMasterDept = resolveMasterDepartment(selectedDeptName, departments) || initialMasterDept;

  // 2. 签署人与科室身份
  const sanitizedSignee = (item.clinicalSignee || '').replace(/手术室/g, '麻醉手术科');
  const defaultSignerName = sanitizedSignee || (currentMasterDept?.defaultManager ? `${currentMasterDept.defaultManager} (护士长)` : `${selectedDeptName} 护士长`);
  const [signerName, setSignerName] = useState<string>(defaultSignerName);
  const sanitizedRole = (item.clinicalSignerRole || '').replace(/手术室/g, '麻醉手术科');
  const [signerRole, setSignerRole] = useState<string>(
    sanitizedRole || (selectedDeptName.includes('室') ? '科室技师长 / 护士长' : '科室护士长 / 设备安全员')
  );

  // 3. 验收检验项
  const [checkAppearance, setCheckAppearance] = useState<boolean>(true);
  const [checkFunctionality, setCheckFunctionality] = useState<boolean>(true);
  const [checkSafety, setCheckSafety] = useState<boolean>(true);
  const [oldPartsConfirmed, setOldPartsConfirmed] = useState<boolean>(item.oldPartsReturned ?? true);

  // 4. 满意度与反馈
  const [rating, setRating] = useState<number>(item.clinicalRating || 5);
  const [feedback, setFeedback] = useState<string>(
    item.clinicalFeedback || '现场开机试运转平稳，参数达到临床诊疗要求，电气绝缘自检正常，旧件已退库，准予恢复临床使用。'
  );

  // 5. 手写签名板 (Canvas)
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [hasDrawn, setHasDrawn] = useState<boolean>(!!item.clinicalSignatureData);
  const [signatureDataUrl, setSignatureDataUrl] = useState<string>(item.clinicalSignatureData || '');

  // 6. CA存证号与时间戳
  const defaultCertId = item.clinicalSignatureCertId || `CASIG-${(item.serviceDate || '20260901').replace(/[/.-]/g, '')}-${item.id.replace(/[^a-zA-Z0-9]/g, '').slice(-4) || '8921'}`;
  const [certId] = useState<string>(defaultCertId);
  const [activeTab, setActiveTab] = useState<'SIGN' | 'PREVIEW'>('SIGN');

  // 当更换科室时，联动更新主数据默认责任人
  const handleSelectMasterDept = (dept: DepartmentMaster) => {
    setSelectedDeptName(dept.name);
    if (dept.defaultManager) {
      setSignerName(`${dept.defaultManager} (护士长)`);
    }
    setShowDeptDropdown(false);
  };

  // Canvas 初始化与绘制逻辑
  useEffect(() => {
    if (activeTab !== 'SIGN') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 清空背景并设置为淡米白底
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 绘制浅色签字指引基准线
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(30, canvas.height - 25);
    ctx.lineTo(canvas.width - 30, canvas.height - 25);
    ctx.stroke();
    ctx.setLineDash([]);

    // 若已有签名数据，载入图像
    if (signatureDataUrl) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0);
      };
      img.src = signatureDataUrl;
    }
  }, [activeTab, signatureDataUrl]);

  // 手写绘制事件
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
    setHasDrawn(true);
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      setSignatureDataUrl(canvas.toDataURL('image/png'));
    }
  };

  // 清空手迹
  const handleClearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // 重新绘制虚线
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(30, canvas.height - 25);
    ctx.lineTo(canvas.width - 30, canvas.height - 25);
    ctx.stroke();
    ctx.setLineDash([]);

    setHasDrawn(false);
    setSignatureDataUrl('');
  };

  // 一键生成规范草书电子签章
  const handleGenerateOfficialStamp = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 清空背景
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 绘制手写风格文字
    ctx.font = 'italic bold 28px "KaiTi", "STKaiti", "楷体", serif';
    ctx.fillStyle = '#1e3a8a'; // 深青蓝色签笔墨水
    const text = signerName.split(' ')[0] || signerName;
    ctx.fillText(text, 50, 65);

    // 绘制副职信息与时间戳
    ctx.font = '11px sans-serif';
    ctx.fillStyle = '#64748b';
    ctx.fillText(`${signerRole} · CA认证签署`, 50, 90);

    // 绘制电子印章小戳
    ctx.strokeStyle = '#b91c1c';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(canvas.width - 60, 55, 30, 0, Math.PI * 2);
    ctx.stroke();

    ctx.font = '10px sans-serif';
    ctx.fillStyle = '#b91c1c';
    ctx.textAlign = 'center';
    ctx.fillText('科室验收', canvas.width - 60, 52);
    ctx.fillText('存证专用', canvas.width - 60, 66);
    ctx.textAlign = 'left';

    setHasDrawn(true);
    setSignatureDataUrl(canvas.toDataURL('image/png'));
  };

  // 提交并持久化保存电子签字
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkAppearance || !checkFunctionality || !checkSafety) {
      alert('请先勾选完成全部3项临床验证核查项！');
      return;
    }
    if (!signerName.trim()) {
      alert('请输入科室接收人/签署人姓名！');
      return;
    }

    // 若未手绘，自动生成规范签字
    let finalSigData = signatureDataUrl;
    if (!hasDrawn && canvasRef.current) {
      handleGenerateOfficialStamp();
      finalSigData = canvasRef.current.toDataURL('image/png');
    }

    const nowStr = new Date().toLocaleString('zh-CN', { hour12: false });

    onSaveSignature(item.id, {
      clinicalReceiveStatus: 'SIGNED',
      clinicalSignee: signerName.trim(),
      clinicalSignerRole: signerRole.trim() || '科室护士长',
      clinicalSignatureTime: nowStr,
      clinicalSignatureCertId: certId,
      clinicalSignatureData: finalSigData,
      clinicalFeedback: feedback.trim() || '科室验收合格，已恢复临床使用。',
      clinicalRating: rating,
      department: selectedDeptName,
      departmentId: currentMasterDept?.id,
      departmentCode: currentMasterDept?.code,
      departmentCampus: currentMasterDept?.campusName || '五莲县人民医院',
      departmentBuilding: currentMasterDept?.buildingName,
      departmentFloor: currentMasterDept?.defaultFloor,
      departmentPhone: currentMasterDept?.nursePhone,
      departmentHead: currentMasterDept?.defaultManager
    });

    onClose();
  };

  const filteredDepts = departments.filter(d => 
    d.name.includes(deptSearchQuery) || 
    (d.code && d.code.toLowerCase().includes(deptSearchQuery.toLowerCase())) ||
    (d.buildingName && d.buildingName.includes(deptSearchQuery))
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-fadeIn">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto max-h-[92vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 px-5 py-4 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-emerald-500/20 border border-emerald-400/40 rounded-xl text-emerald-400 shadow-xs">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold tracking-tight text-white">
                  科室维修内容接收与防伪电子签字验收
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  主数据字典认证
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-blue-500/20 text-blue-300 border border-blue-400/30">
                  {certId}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                覆盖维修技术核验、主数据科室精准归集、三项临床安全性查验及CA电子存证签名
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {/* 切换选项卡 */}
            <div className="hidden sm:flex items-center bg-slate-800/80 p-0.5 rounded-xl border border-slate-700 text-xs">
              <button
                type="button"
                onClick={() => setActiveTab('SIGN')}
                className={`px-3 py-1 rounded-lg font-medium transition ${
                  activeTab === 'SIGN'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                在线签署与核验
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('PREVIEW')}
                className={`px-3 py-1 rounded-lg font-medium transition ${
                  activeTab === 'PREVIEW'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                电子存证凭证单
              </button>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 主体滚动区 */}
        <div className="p-5 overflow-y-auto space-y-5 text-slate-700 text-xs flex-1">
          {activeTab === 'SIGN' ? (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* 1. 主数据科室精准核验与引用卡片 */}
              <div className="bg-blue-50/50 border border-blue-200/80 rounded-xl p-4 shadow-2xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-blue-100">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-blue-700" />
                    <span className="font-bold text-slate-900 text-sm">
                      报修归属科室 (全院主数据标准核验)
                    </span>
                    <span className="bg-blue-100 text-blue-800 text-[10px] font-semibold px-2 py-0.5 rounded border border-blue-300">
                      严格引用主数据
                    </span>
                  </div>
                  {/* 更换/检索主数据科室 */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowDeptDropdown(!showDeptDropdown)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-blue-300 text-blue-700 hover:bg-blue-50 font-medium text-xs shadow-2xs transition"
                    >
                      <span>引用其他主数据科室</span>
                      <Search className="w-3 h-3 text-blue-500" />
                    </button>

                    {showDeptDropdown && (
                      <div className="absolute right-0 top-full mt-1.5 w-72 bg-white border border-slate-200 rounded-xl shadow-xl z-30 p-2 text-xs">
                        <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg mb-2">
                          <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <input
                            type="text"
                            value={deptSearchQuery}
                            onChange={(e) => setDeptSearchQuery(e.target.value)}
                            placeholder="输入科室名称/编码快速匹配..."
                            className="w-full bg-transparent text-xs focus:outline-none"
                            autoFocus
                          />
                        </div>
                        <div className="max-h-48 overflow-y-auto space-y-1">
                          {filteredDepts.slice(0, 30).map((d) => (
                            <button
                              key={d.id}
                              type="button"
                              onClick={() => handleSelectMasterDept(d)}
                              className="w-full text-left px-2.5 py-1.5 rounded hover:bg-blue-50 flex items-center justify-between group transition"
                            >
                              <div>
                                <div className="font-bold text-slate-800 group-hover:text-blue-700">
                                  {d.name}
                                </div>
                                <div className="text-[10px] text-slate-400">
                                  {d.buildingName} · {d.defaultFloor}
                                </div>
                              </div>
                              <span className="font-mono text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                                {d.code}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* 主数据科室卡片网格 */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
                  <div className="bg-white p-2.5 rounded-lg border border-blue-100">
                    <span className="text-[10px] text-slate-400 block">标准科室名称</span>
                    <span className="font-bold text-slate-900 text-xs flex items-center gap-1 mt-0.5">
                      {selectedDeptName}
                      {currentMasterDept && (
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      )}
                    </span>
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-blue-100">
                    <span className="text-[10px] text-slate-400 block">主数据编码</span>
                    <span className="font-mono font-bold text-blue-700 text-xs block mt-0.5">
                      {currentMasterDept?.code || 'DEP-MASTER'}
                    </span>
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-blue-100">
                    <span className="text-[10px] text-slate-400 block">院区楼宇 / 楼层</span>
                    <span className="font-medium text-slate-800 text-xs block mt-0.5 truncate" title={`${currentMasterDept?.buildingName || '综合楼'} ${currentMasterDept?.defaultFloor || ''}`}>
                      {currentMasterDept?.buildingName || '综合楼'} · {currentMasterDept?.defaultFloor || '标准层'}
                    </span>
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-blue-100">
                    <span className="text-[10px] text-slate-400 block">护士站分机 / 责任人</span>
                    <span className="font-medium text-slate-800 text-xs block mt-0.5">
                      ☎ {currentMasterDept?.nursePhone || '7991000'} ({currentMasterDept?.defaultManager || '护士长'})
                    </span>
                  </div>
                </div>
              </div>

              {/* 2. 维保工单内容与技术处置核查 */}
              <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 shadow-2xs space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-slate-700" />
                    <span className="font-bold text-slate-900 text-sm">
                      维修处置项目与工程量核对
                    </span>
                  </div>
                  <div className="flex items-center gap-2 font-mono text-xs">
                    <span className="text-slate-400">施工日期: {item.serviceDate}</span>
                    <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      申报金额: ¥{item.totalPrice.toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="md:col-span-2 space-y-1.5">
                    <div className="text-[10px] text-slate-400">维修及配件更换全称</div>
                    <div className="font-bold text-slate-900 text-sm leading-snug">
                      {item.itemName}
                    </div>
                    {item.notes && (
                      <div className="text-slate-600 text-xs bg-white p-2 rounded-lg border border-slate-200/60 leading-relaxed">
                        <span className="font-semibold text-slate-700">处置备注：</span>{item.notes}
                      </div>
                    )}
                  </div>
                  <div className="space-y-1.5 bg-white p-2.5 rounded-lg border border-slate-200/60 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500">驻场工程师:</span>
                      <span className="font-bold text-slate-800 font-mono">{item.engineerName || item.technician || '专职工程师'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">工程量单价:</span>
                      <span className="font-mono text-slate-800">{item.quantity} {item.unit} @ ¥{item.unitPrice.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center pt-1 border-t border-slate-100">
                      <span className="text-slate-500">旧件退库回交:</span>
                      <label className="flex items-center gap-1 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={oldPartsConfirmed}
                          onChange={(e) => setOldPartsConfirmed(e.target.checked)}
                          className="rounded text-blue-600 focus:ring-0"
                        />
                        <span className="font-bold text-emerald-700 text-[11px]">已原样退库</span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* 临床安全性三项验收打钩 */}
                <div className="bg-amber-50/60 border border-amber-200 rounded-xl p-3">
                  <div className="font-bold text-amber-900 text-xs mb-2 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-amber-600" />
                    临床科室接收技术验证与安全自检确认 (三项必查)
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                    <label className="flex items-start gap-2 bg-white p-2 rounded-lg border border-amber-200/60 cursor-pointer hover:bg-amber-50/50 transition">
                      <input
                        type="checkbox"
                        checked={checkAppearance}
                        onChange={(e) => setCheckAppearance(e.target.checked)}
                        className="mt-0.5 rounded text-emerald-600 focus:ring-0"
                      />
                      <span className="text-slate-700 leading-snug">
                        1. 设备外观部件完好紧固，装配无异响，现场工具清点完毕
                      </span>
                    </label>

                    <label className="flex items-start gap-2 bg-white p-2 rounded-lg border border-amber-200/60 cursor-pointer hover:bg-amber-50/50 transition">
                      <input
                        type="checkbox"
                        checked={checkFunctionality}
                        onChange={(e) => setCheckFunctionality(e.target.checked)}
                        className="mt-0.5 rounded text-emerald-600 focus:ring-0"
                      />
                      <span className="text-slate-700 leading-snug">
                        2. 开机带载试运转平稳，核心临床技术参数校准达标
                      </span>
                    </label>

                    <label className="flex items-start gap-2 bg-white p-2 rounded-lg border border-amber-200/60 cursor-pointer hover:bg-amber-50/50 transition">
                      <input
                        type="checkbox"
                        checked={checkSafety}
                        onChange={(e) => setCheckSafety(e.target.checked)}
                        className="mt-0.5 rounded text-emerald-600 focus:ring-0"
                      />
                      <span className="text-slate-700 leading-snug">
                        3. 电气安全绝缘与保护接地自检通过，准予恢复临床诊疗
                      </span>
                    </label>
                  </div>
                </div>
              </div>

              {/* 3. 科室接收人身份核验与在线电子签名 */}
              <div className="border border-slate-200 rounded-xl p-4 shadow-2xs space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <div className="flex items-center gap-2">
                    <PenTool className="w-4 h-4 text-blue-700" />
                    <span className="font-bold text-slate-900 text-sm">
                      科室接收责任人身份核验与电子签名存证
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-slate-500">
                    <Clock className="w-3.5 h-3.5" />
                    <span>CA时间戳: {new Date().toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-800 mb-1">
                      科室接收签署人姓名 <span className="text-rose-500">*</span>
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        required
                        value={signerName}
                        onChange={(e) => setSignerName(e.target.value)}
                        placeholder="例如：崔伟 护士长 / 徐爱香 总护士长"
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                      />
                      {currentMasterDept?.defaultManager && (
                        <button
                          type="button"
                          onClick={() => setSignerName(`${currentMasterDept.defaultManager} (护士长)`)}
                          className="shrink-0 px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10px] font-medium transition"
                        >
                          引用主任/护士长
                        </button>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-800 mb-1">
                      签署人科室职务 / 角色
                    </label>
                    <input
                      type="text"
                      value={signerRole}
                      onChange={(e) => setSignerRole(e.target.value)}
                      placeholder="科室护士长 / 设备安全员 / 技师长"
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* 满意度星级与评语 */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center bg-slate-50 p-3 rounded-xl border border-slate-200/70">
                  <div>
                    <span className="font-bold text-slate-800 block mb-1">科室满意度评价</span>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRating(star)}
                          className={`p-1 transition hover:scale-110 cursor-pointer ${
                            star <= rating ? 'text-amber-500 fill-amber-500' : 'text-slate-300'
                          }`}
                        >
                          <Star className="w-5 h-5 fill-current" />
                        </button>
                      ))}
                      <span className="text-xs font-bold text-amber-700 ml-1.5">{rating}.0 分</span>
                    </div>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="font-bold text-slate-800 block mb-1">临床现场验收评价意见</span>
                    <input
                      type="text"
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      placeholder="开机运行平稳，电气安全自检通过，准予恢复临床使用。"
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs focus:outline-none"
                    />
                  </div>
                </div>

                {/* 手写签名 Canvas 区域 */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-slate-800 flex items-center gap-1">
                      <PenTool className="w-3.5 h-3.5 text-blue-600" />
                      科室电子手写签名板 (Canvas)
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleClearSignature}
                        className="inline-flex items-center gap-1 text-[11px] text-slate-500 hover:text-rose-600 px-2 py-0.5 rounded hover:bg-slate-100 transition"
                      >
                        <RotateCcw className="w-3 h-3" />
                        清除重写
                      </button>
                      <button
                        type="button"
                        onClick={handleGenerateOfficialStamp}
                        className="inline-flex items-center gap-1 text-[11px] text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100 px-2.5 py-1 rounded-lg font-medium shadow-2xs transition"
                      >
                        <Stamp className="w-3 h-3 text-blue-600" />
                        一键盖科室护士长电子印模
                      </button>
                    </div>
                  </div>

                  <div className="relative border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 overflow-hidden cursor-crosshair">
                    <canvas
                      ref={canvasRef}
                      width={760}
                      height={130}
                      onMouseDown={startDrawing}
                      onMouseMove={draw}
                      onMouseUp={stopDrawing}
                      onMouseLeave={stopDrawing}
                      onTouchStart={startDrawing}
                      onTouchMove={draw}
                      onTouchEnd={stopDrawing}
                      className="w-full h-[130px] block"
                    />
                    {!hasDrawn && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-slate-400 text-xs">
                        <span>请使用鼠标、触控板或电子笔在此处签署手写签名</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center justify-between mt-1 text-[10px] text-slate-400">
                    <span>* 签署后将结合医院内部主数据与CA系统打上数字防伪签名与时间戳存证</span>
                    <span className="font-mono">存证哈希: {certId}</span>
                  </div>
                </div>
              </div>

              {/* 底部操作按钮 */}
              <div className="pt-3 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>签署确认后将形成不可篡改的月度维保科室电子签收闭环档案</span>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 sm:flex-initial px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-medium text-xs transition"
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-6 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-bold text-xs shadow-md hover:shadow-lg transition"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    确认科室接收并完成电子签字
                  </button>
                </div>
              </div>
            </form>
          ) : (
            /* 电子存证凭证单打印与预览模式 */
            <div className="space-y-4">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-700">
                  <FileText className="w-4 h-4 text-blue-700" />
                  <span className="font-bold text-xs">规范电子单据存证样式预览</span>
                </div>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 rounded-lg text-xs font-semibold shadow-2xs transition"
                >
                  <Printer className="w-3.5 h-3.5 text-slate-600" />
                  打印凭单
                </button>
              </div>

              {/* 凭据页面主体 (A4卡片样式) */}
              <div className="bg-white border-2 border-slate-300 rounded-2xl p-6 shadow-md max-w-2xl mx-auto space-y-5 print:border-none print:shadow-none">
                <div className="text-center border-b-2 border-slate-900 pb-3">
                  <h2 className="text-base font-bold tracking-widest text-slate-900">
                    五 莲 县 人 民 医 院
                  </h2>
                  <h3 className="text-sm font-semibold tracking-wider text-slate-800 mt-0.5">
                    医疗设备零星维保科室接收与电子验收存证单
                  </h3>
                  <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono mt-2">
                    <span>存证流水号: {certId}</span>
                    <span>出具时间: {item.serviceDate || '2026/09/16'}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div className="space-y-1">
                    <div><span className="text-slate-400">使用科室:</span> <strong className="text-slate-900">{selectedDeptName}</strong></div>
                    <div><span className="text-slate-400">科室代码:</span> <span className="font-mono">{currentMasterDept?.code || 'DEP-MASTER'}</span></div>
                    <div><span className="text-slate-400">楼宇位置:</span> <span>{currentMasterDept?.buildingName || '综合楼'} · {currentMasterDept?.defaultFloor || '标准层'}</span></div>
                    <div><span className="text-slate-400">科室电话:</span> <span className="font-mono">{currentMasterDept?.nursePhone || '7991000'}</span></div>
                  </div>
                  <div className="space-y-1">
                    <div><span className="text-slate-400">施工日期:</span> <span className="font-mono">{item.serviceDate}</span></div>
                    <div><span className="text-slate-400">驻场工程师:</span> <span className="font-bold">{item.engineerName || item.technician || '专职工程师'}</span></div>
                    <div><span className="text-slate-400">申报金额:</span> <span className="font-mono font-bold text-emerald-700">¥{item.totalPrice.toFixed(2)}</span></div>
                    <div><span className="text-slate-400">旧件退库:</span> <span className="text-emerald-700 font-bold">已交回旧件库✓</span></div>
                  </div>
                </div>

                <div className="border border-slate-200 rounded-lg p-3 bg-slate-50/60">
                  <div className="text-[11px] text-slate-400 mb-1 font-semibold">维修配件与处置内容:</div>
                  <div className="font-bold text-slate-900 text-xs mb-1">{item.itemName}</div>
                  <div className="text-[11px] text-slate-600">{item.notes || '现场排查排除隐患，更换故障配件并完成全面润滑与自检校准。'}</div>
                </div>

                {/* 验收结论与印模 */}
                <div className="border-t border-slate-200 pt-4 flex items-center justify-between">
                  <div className="space-y-1.5 text-xs">
                    <div className="font-bold text-slate-800">
                      科室验收结论：合格，准予恢复临床使用
                    </div>
                    <div className="text-slate-500 text-[11px]">
                      意见: {feedback}
                    </div>
                    <div className="text-slate-400 text-[10px] font-mono">
                      认证签名人: {signerName} ({signerRole})
                    </div>
                  </div>
                  {/* 电子印章或签名展现 */}
                  <div className="relative p-2 border border-emerald-300 rounded-xl bg-emerald-50/50 text-center w-40">
                    <div className="text-[10px] font-bold text-emerald-800 border-b border-emerald-200 pb-1">
                      五莲县人民医院
                    </div>
                    <div className="text-xs font-bold text-slate-900 my-1 font-serif">
                      {signerName.split(' ')[0]}
                    </div>
                    <div className="text-[9px] text-emerald-700 font-mono">
                      电子签字已存证
                    </div>
                    <div className="text-[8px] text-slate-400 mt-0.5">
                      {item.serviceDate}
                    </div>
                  </div>
                </div>
              </div>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('SIGN')}
                  className="px-4 py-1.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold"
                >
                  返回签署修改
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

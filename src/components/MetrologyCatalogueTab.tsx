import React, { useState, useMemo, useEffect } from 'react';
import { 
  Scale, 
  ShieldCheck, 
  Sparkles, 
  Search, 
  Plus, 
  Edit3, 
  Trash2, 
  DollarSign, 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  Info, 
  RotateCcw, 
  ExternalLink, 
  ArrowRight, 
  Tag, 
  Clock, 
  Building2,
  BookOpen,
  Check,
  Zap,
  HelpCircle,
  TrendingDown,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { MetrologyCatalogueItem, MedicalEquipment } from '../types';
import { 
  DEFAULT_METROLOGY_CATALOGUE, 
  matchEquipmentToMetrologyCatalogue, 
  reclassifyEquipmentListByPolicy 
} from '../utils/metrologyCatalogueData';
import { Pagination } from './Pagination';

interface MetrologyCatalogueTabProps {
  catalogue: MetrologyCatalogueItem[];
  equipmentList: MedicalEquipment[];
  onUpdateCatalogue: (catalogue: MetrologyCatalogueItem[]) => void;
  onUpdateEquipmentList?: (list: MedicalEquipment[]) => void;
  onResetCatalogueToDefault: () => void;
}

export const MetrologyCatalogueTab: React.FC<MetrologyCatalogueTabProps> = ({
  catalogue,
  equipmentList,
  onUpdateCatalogue,
  onUpdateEquipmentList,
  onResetCatalogueToDefault,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'mandatory' | 'periodic_calibration' | 'active'>('all');
  const [showPolicyDrawer, setShowPolicyDrawer] = useState(false);
  const [editingItem, setEditingItem] = useState<MetrologyCatalogueItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // 分页状态
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // 表单状态
  const [formCode, setFormCode] = useState('');
  const [formName, setFormName] = useState('');
  const [formType, setFormType] = useState<'mandatory' | 'periodic_calibration'>('mandatory');
  const [formPeriod, setFormPeriod] = useState<number>(12);
  const [formLegalBasis, setFormLegalBasis] = useState('');
  const [formVerificationBody, setFormVerificationBody] = useState('');
  const [formKeywords, setFormKeywords] = useState('');
  const [formScope, setFormScope] = useState('');
  const [formFeeEst, setFormFeeEst] = useState<number>(300);
  const [formStatus, setFormStatus] = useState<'active' | 'inactive'>('active');
  const [formNotes, setFormNotes] = useState('');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // 统计与测算数据
  const stats = useMemo(() => {
    let mandatoryEquipmentCount = 0;
    let paidCalibrationEquipmentCount = 0;
    let exemptEquipmentCount = 0;
    let totalEstimatedSavings = 0;
    let totalEstimatedBudget = 0;

    equipmentList.forEach(eq => {
      const match = matchEquipmentToMetrologyCatalogue(eq.name, eq.model, eq.category, catalogue);
      if (match.matchType === 'mandatory') {
        mandatoryEquipmentCount++;
        totalEstimatedSavings += match.matchedItem?.standardVerificationFeeEst || 300;
      } else if (match.matchType === 'periodic_calibration') {
        paidCalibrationEquipmentCount++;
        totalEstimatedBudget += match.matchedItem?.standardVerificationFeeEst || 200;
      } else {
        exemptEquipmentCount++;
      }
    });

    const mandatoryCatalogCount = catalogue.filter(c => c.managementType === 'mandatory').length;
    const periodicCatalogCount = catalogue.filter(c => c.managementType === 'periodic_calibration').length;

    return {
      mandatoryEquipmentCount,
      paidCalibrationEquipmentCount,
      exemptEquipmentCount,
      totalEstimatedSavings,
      totalEstimatedBudget,
      mandatoryCatalogCount,
      periodicCatalogCount,
      totalCatalogCount: catalogue.length
    };
  }, [equipmentList, catalogue]);

  // 过滤目录列表
  const filteredCatalogue = useMemo(() => {
    return catalogue.filter(item => {
      // 搜索匹配
      const q = searchQuery.trim().toLowerCase();
      const matchQuery = !q || 
        item.name.toLowerCase().includes(q) || 
        item.catalogueCode.toLowerCase().includes(q) || 
        item.legalBasis.toLowerCase().includes(q) ||
        item.matchKeywords.some(k => k.toLowerCase().includes(q)) ||
        item.applicableScope.toLowerCase().includes(q);

      // 类型过滤
      let matchType = true;
      if (filterType === 'mandatory') {
        matchType = item.managementType === 'mandatory';
      } else if (filterType === 'periodic_calibration') {
        matchType = item.managementType === 'periodic_calibration';
      } else if (filterType === 'active') {
        matchType = item.status === 'active';
      }

      return matchQuery && matchType;
    });
  }, [catalogue, searchQuery, filterType]);

  // 重置分页
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterType]);

  const paginatedCatalogue = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredCatalogue.slice(startIndex, startIndex + pageSize);
  }, [filteredCatalogue, currentPage, pageSize]);

  // 打开新增/编辑弹窗
  const handleOpenAdd = () => {
    const nextQjCount = catalogue.filter(c => c.managementType === 'mandatory').length + 1;
    const code = `QJ-${String(nextQjCount).padStart(2, '0')}`;
    setEditingItem(null);
    setFormCode(code);
    setFormName('');
    setFormType('mandatory');
    setFormPeriod(12);
    setFormLegalBasis('《计量法》第9条、国家市场监管总局2020年第42号公告、财税〔2017〕20号（国家免征强检费）');
    setFormVerificationBody('法定计量检定机构 (通过e-CQS全国强检平台备案申请)');
    setFormKeywords('');
    setFormScope('');
    setFormFeeEst(300);
    setFormStatus('active');
    setFormNotes('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: MetrologyCatalogueItem) => {
    setEditingItem(item);
    setFormCode(item.catalogueCode);
    setFormName(item.name);
    setFormType(item.managementType === 'mandatory' ? 'mandatory' : 'periodic_calibration');
    setFormPeriod(item.verificationPeriodMonths);
    setFormLegalBasis(item.legalBasis);
    setFormVerificationBody(item.verificationBody);
    setFormKeywords(item.matchKeywords.join('、'));
    setFormScope(item.applicableScope);
    setFormFeeEst(item.standardVerificationFeeEst || 0);
    setFormStatus(item.status);
    setFormNotes(item.notes || '');
    setIsModalOpen(true);
  };

  // 保存目录项
  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formCode.trim()) {
      alert('请填写目录代码和器具名称');
      return;
    }

    const keywordsArray = formKeywords
      .split(/[,，、\s]+/)
      .map(k => k.trim())
      .filter(Boolean);

    const feePolicy = formType === 'mandatory' ? 'free_national' : 'paid_hospital';

    const newItem: MetrologyCatalogueItem = {
      id: editingItem ? editingItem.id : `CAT-${formCode.trim().toUpperCase()}-${Date.now().toString().slice(-4)}`,
      catalogueCode: formCode.trim().toUpperCase(),
      name: formName.trim(),
      managementType: formType,
      feePolicy,
      legalBasis: formLegalBasis.trim(),
      verificationPeriodMonths: Number(formPeriod) || 12,
      verificationBody: formVerificationBody.trim(),
      matchKeywords: keywordsArray.length > 0 ? keywordsArray : [formName.trim()],
      applicableScope: formScope.trim(),
      standardVerificationFeeEst: Number(formFeeEst) || 0,
      status: formStatus,
      updatedAt: new Date().toISOString().split('T')[0],
      notes: formNotes.trim()
    };

    let updated: MetrologyCatalogueItem[];
    if (editingItem) {
      updated = catalogue.map(c => c.id === editingItem.id ? newItem : c);
      showToast(`已成功更新目录条目【${newItem.catalogueCode} ${newItem.name}】`);
    } else {
      updated = [newItem, ...catalogue];
      showToast(`已新增目录条目【${newItem.catalogueCode} ${newItem.name}】`);
    }

    onUpdateCatalogue(updated);
    setIsModalOpen(false);
  };

  // 删除目录项
  const handleDeleteItem = (id: string, name: string) => {
    if (window.confirm(`确定删除国家/院内计量目录条目「${name}」吗？`)) {
      const updated = catalogue.filter(c => c.id !== id);
      onUpdateCatalogue(updated);
      showToast(`已删除条目「${name}」`);
    }
  };

  // 切换启用状态
  const handleToggleStatus = (item: MetrologyCatalogueItem) => {
    const nextStatus = item.status === 'active' ? 'inactive' : 'active';
    const updated = catalogue.map(c => c.id === item.id ? { ...c, status: nextStatus } : c);
    onUpdateCatalogue(updated);
    showToast(`已将【${item.name}】状态切换为: ${nextStatus === 'active' ? '启用' : '停用'}`);
  };

  // 一键按国家强检目录重新归类并同步全院设备
  const handleReclassifyAllEquipment = () => {
    if (!onUpdateEquipmentList) {
      alert('无法更新设备台账列表');
      return;
    }

    const result = reclassifyEquipmentListByPolicy(equipmentList, catalogue);
    onUpdateEquipmentList(result.updatedList);

    showToast(
      `✅ 依据国家政策目录成功对齐全院 ${equipmentList.length} 台设备！` +
      `其中强检(国家免费) ${result.mandatoryCount} 台（预计年减免费用 ￥${result.estimatedAnnualSavings.toLocaleString()}），` +
      `自费定期校准 ${result.periodicCalibrationCount} 台（年预算 ￥${result.estimatedCalibrationBudget.toLocaleString()}），` +
      `常规免计量 ${result.exemptCount} 台，共更新修正 ${result.changesCount} 处分类！`
    );
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 h-full overflow-y-auto p-4 space-y-4 bg-slate-50/60 custom-scrollbar">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-lg shadow-xl border border-slate-700 text-xs flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* 1. 法规政策核心说明与对比横幅 (政策背景与辨析) */}
      <div className="bg-slate-900 text-white p-4 sm:p-5 rounded-xl shadow-xs border border-slate-800 space-y-3.5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex items-start sm:items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-indigo-600/80 border border-indigo-400/40 flex items-center justify-center text-white shadow-inner shrink-0 mt-0.5 sm:mt-0">
              <Scale className="w-5 h-5 text-indigo-200" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm sm:text-base font-bold text-white tracking-wide truncate">
                  国家法定强检目录维护与计量政策管理中心
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-bold border border-emerald-400/30 flex items-center gap-1 shrink-0">
                  <Sparkles className="w-3 h-3 text-emerald-300 shrink-0" /> 国家免征强检收费政策
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed line-clamp-2 sm:line-clamp-none">
                依据《计量法》及<strong>财税〔2017〕20号</strong>，
                医疗卫生强检器具实行<strong>全国免费检定（免征强检费，国家财政保障）</strong>；
                非强检设备由医院自主管理，委托第三方进行<strong>定期自费校准（收费检验）</strong>。
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 shrink-0 self-end lg:self-center">
            <button
              onClick={() => setShowPolicyDrawer(!showPolicyDrawer)}
              className="px-3 py-1.5 rounded-lg bg-indigo-800/60 hover:bg-indigo-700 text-indigo-100 border border-indigo-500/40 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition whitespace-nowrap"
            >
              <BookOpen className="w-3.5 h-3.5 shrink-0" />
              <span>政策法规库 {showPolicyDrawer ? '▲' : '▼'}</span>
            </button>

            <button
              onClick={handleReclassifyAllEquipment}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-xs flex items-center gap-1.5 cursor-pointer transition whitespace-nowrap active:scale-98"
              title="按当前国家目录规则重新智能扫描全院设备台账并修正分类属性"
            >
              <Zap className="w-3.5 h-3.5 text-amber-300 shrink-0" />
              <span>一键对齐全院设备</span>
            </button>
          </div>
        </div>

        {/* 政策法规与对比解析展开卡片 */}
        {showPolicyDrawer && (
          <div className="p-3.5 bg-slate-950/90 border border-indigo-800/60 rounded-xl space-y-2.5 text-xs animate-fadeIn">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h4 className="font-bold text-indigo-300 flex items-center gap-1.5 truncate">
                <Info className="w-4 h-4 text-indigo-400 shrink-0" /> 
                【国家法定强检】与【医院自费定期校准】法律与经济属性权威对比
              </h4>
              <span className="text-[11px] text-slate-400 shrink-0 hidden md:inline">法规依据：计量法第9条 / 财税〔2017〕20号</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 text-[11px]">
              {/* 强检属性 */}
              <div className="p-2.5 bg-emerald-950/40 border border-emerald-800/50 rounded-lg space-y-1">
                <div className="flex items-center justify-between gap-1 flex-wrap">
                  <span className="font-bold text-emerald-300 text-xs flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> 国家法定强制检定 (强检目录)
                  </span>
                  <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/40 text-[10px]">
                    0元免费检定
                  </span>
                </div>
                <ul className="space-y-0.5 text-slate-300 list-disc list-inside">
                  <li><strong>典型设备：</strong>心电图机、脑电图仪、超声诊断仪(彩超)、CT机、DSA、常规DR、血压计、直线加速器等。</li>
                  <li><strong>申报渠道：</strong>通过国家市场监管总局 <strong>e-CQS 全国强检业务平台</strong> 申报备案。</li>
                  <li><strong>法律效力：</strong>出具法定《检定证书》，未检或脱检设备严禁用于临床医疗。</li>
                </ul>
              </div>

              {/* 非强检定期校准属性 */}
              <div className="p-2.5 bg-sky-950/40 border border-sky-800/50 rounded-lg space-y-1">
                <div className="flex items-center justify-between gap-1 flex-wrap">
                  <span className="font-bold text-sky-300 text-xs flex items-center gap-1">
                    <Scale className="w-3.5 h-3.5 text-sky-400 shrink-0" /> 非强检 / 医院自费定期校准
                  </span>
                  <span className="px-1.5 py-0.2 rounded bg-sky-500/20 text-sky-300 font-semibold border border-sky-500/40 text-[10px]">
                    商业付费检验
                  </span>
                </div>
                <ul className="space-y-0.5 text-slate-300 list-disc list-inside">
                  <li><strong>典型设备：</strong>输液泵/注射泵、监护仪综合参数、高频手术电刀、呼吸机、除颤仪、离心机等。</li>
                  <li><strong>管理模式：</strong>由医院自主委托具备 CNAS/CMA 资质的第三方机构开展定期校准。</li>
                  <li><strong>费用性质：</strong>由医院自费支付校准服务费，出具《校准证书》或检测报告。</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* 2. 经济效益与全院台账统计卡片 (KPI Row) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 pt-1 border-t border-indigo-900/50">
          <div className="bg-slate-900/80 p-2.5 sm:p-3 rounded-lg border border-indigo-900/50 flex flex-col justify-between min-w-0">
            <span className="text-slate-400 text-[11px] font-medium flex items-center gap-1 truncate">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> 强检设备 (国家免费)
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-lg sm:text-xl font-bold text-emerald-400 font-mono">
                {stats.mandatoryEquipmentCount}
              </span>
              <span className="text-[11px] text-slate-400">台</span>
            </div>
            <span className="text-[10px] text-emerald-300/90 mt-0.5 truncate">
              占比 {Math.round((stats.mandatoryEquipmentCount / Math.max(1, stats.mandatoryEquipmentCount + stats.paidCalibrationEquipmentCount)) * 100)}%
            </span>
          </div>

          <div className="bg-slate-900/80 p-2.5 sm:p-3 rounded-lg border border-indigo-900/50 flex flex-col justify-between min-w-0">
            <span className="text-slate-400 text-[11px] font-medium flex items-center gap-1 truncate">
              <TrendingDown className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> 年免征减免效益
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-lg sm:text-xl font-bold text-emerald-300 font-mono notranslate" translate="no">
                ￥{stats.totalEstimatedSavings.toLocaleString()}
              </span>
              <span className="text-[10px] text-slate-400">/年</span>
            </div>
            <span className="text-[10px] text-slate-400 mt-0.5 truncate">
              财税〔2017〕20号政策红利
            </span>
          </div>

          <div className="bg-slate-900/80 p-2.5 sm:p-3 rounded-lg border border-indigo-900/50 flex flex-col justify-between min-w-0">
            <span className="text-slate-400 text-[11px] font-medium flex items-center gap-1 truncate">
              <Scale className="w-3.5 h-3.5 text-sky-400 shrink-0" /> 自费定期校准设备
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-lg sm:text-xl font-bold text-sky-400 font-mono">
                {stats.paidCalibrationEquipmentCount}
              </span>
              <span className="text-[11px] text-slate-400">台</span>
            </div>
            <span className="text-[10px] text-sky-300/90 mt-0.5 truncate">
              预估预算: ￥{stats.totalEstimatedBudget.toLocaleString()}
            </span>
          </div>

          <div className="bg-slate-900/80 p-2.5 sm:p-3 rounded-lg border border-indigo-900/50 flex flex-col justify-between min-w-0">
            <span className="text-slate-400 text-[11px] font-medium flex items-center gap-1 truncate">
              <BookOpen className="w-3.5 h-3.5 text-indigo-400 shrink-0" /> 标准目录字典规则
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-lg sm:text-xl font-bold text-white font-mono">
                {stats.totalCatalogCount}
              </span>
              <span className="text-[11px] text-slate-400">项</span>
            </div>
            <span className="text-[10px] text-slate-400 mt-0.5 truncate">
              强检 {stats.mandatoryCatalogCount} / 校准 {stats.periodicCatalogCount} 项
            </span>
          </div>
        </div>
      </div>

      {/* 3. 目录管理过滤栏与操作工具栏 */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
        <div className="flex flex-wrap items-center gap-2 flex-1 min-w-0">
          {/* 搜索框 */}
          <div className="relative flex-1 min-w-[180px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索目录名称、编号、关键词..."
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:ring-2 focus:ring-indigo-500 font-medium"
            />
          </div>

          {/* 筛选 Pills */}
          <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-xs shrink-0 overflow-x-auto">
            <button
              onClick={() => setFilterType('all')}
              className={`px-2.5 py-1 rounded-md font-bold transition cursor-pointer whitespace-nowrap ${
                filterType === 'all' ? 'bg-white text-indigo-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              全部 ({catalogue.length})
            </button>
            <button
              onClick={() => setFilterType('mandatory')}
              className={`px-2.5 py-1 rounded-md font-bold transition cursor-pointer flex items-center gap-1 whitespace-nowrap ${
                filterType === 'mandatory' ? 'bg-emerald-600 text-white shadow-2xs' : 'text-slate-600 hover:text-emerald-700'
              }`}
            >
              <ShieldCheck className="w-3 h-3 shrink-0" />
              <span>强检 (免费 {stats.mandatoryCatalogCount})</span>
            </button>
            <button
              onClick={() => setFilterType('periodic_calibration')}
              className={`px-2.5 py-1 rounded-md font-bold transition cursor-pointer flex items-center gap-1 whitespace-nowrap ${
                filterType === 'periodic_calibration' ? 'bg-sky-600 text-white shadow-2xs' : 'text-slate-600 hover:text-sky-700'
              }`}
            >
              <Scale className="w-3 h-3 shrink-0" />
              <span>校准 (自费 {stats.periodicCatalogCount})</span>
            </button>
          </div>
        </div>

        {/* 右侧动作按钮 */}
        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
          <button
            onClick={() => {
              if (window.confirm('确定将国家强检及校准目录重置为国家市场监督管理总局标准字典规范吗？')) {
                onResetCatalogueToDefault();
                showToast('已恢复国家法定强检标准目录字典');
              }
            }}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-semibold flex items-center gap-1 cursor-pointer transition whitespace-nowrap"
            title="恢复国家法定标准字典模板"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <span>恢复标准字典</span>
          </button>

          <button
            onClick={handleOpenAdd}
            className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 cursor-pointer transition whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5 shrink-0" />
            <span>新增条目</span>
          </button>
        </div>
      </div>

      {/* 4. 目录条目表格清单 */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden flex flex-col">
        {/* 表格顶部数据概览栏 */}
        <div className="px-4 py-2.5 bg-slate-50/90 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800 flex items-center gap-1.5">
              <Scale className="w-4 h-4 text-indigo-600" />
              <span>国家强检与校准目录清单</span>
            </span>
            <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-bold border border-indigo-200 text-[11px]">
              共 {filteredCatalogue.length} 项
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider">
                <th className="py-2.5 px-3 w-14 text-center">序号</th>
                <th className="py-2.5 px-3 w-24">目录代码</th>
                <th className="py-2.5 px-4 min-w-[200px]">器具名称 / 适用范围</th>
                <th className="py-2.5 px-3 w-36">管理模式 & 费用政策</th>
                <th className="py-2.5 px-3 w-24 text-center">检定周期</th>
                <th className="py-2.5 px-4 min-w-[200px]">自动分类匹配关键词</th>
                <th className="py-2.5 px-4 min-w-[220px]">法规与规程依据</th>
                <th className="py-2.5 px-3 w-20 text-center">状态</th>
                <th className="py-2.5 px-3 w-28 text-center">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800 font-medium">
              {paginatedCatalogue.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Scale className="w-8 h-8 text-slate-300" />
                      <p className="text-sm font-semibold">未找到匹配的国家强检或校准目录条目</p>
                      <p className="text-xs">请尝试调整搜索关键词或点击右上角「新增目录条目」</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedCatalogue.map((item, index) => {
                  const isMandatory = item.managementType === 'mandatory';
                  const globalIndex = (currentPage - 1) * pageSize + index + 1;
                  return (
                    <tr 
                      key={item.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        item.status === 'inactive' ? 'opacity-60 bg-slate-50/40' : ''
                      }`}
                    >
                      {/* 序号 */}
                      <td className="py-3 px-3 text-center text-slate-500 font-mono text-[11px]">
                        {globalIndex}
                      </td>

                      {/* 目录代码 */}
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded font-mono font-bold text-xs border ${
                          isMandatory 
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                            : 'bg-sky-50 text-sky-800 border-sky-200'
                        }`}>
                          {item.catalogueCode}
                        </span>
                      </td>

                      {/* 器具名称 / 适用说明 */}
                      <td className="py-3 px-4">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-bold text-slate-900 text-[13px] flex items-center gap-1.5">
                            {item.name}
                            {isMandatory && (
                              <span className="px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-900 text-[10px] font-bold">
                                国家法定强检
                              </span>
                            )}
                          </span>
                          <span className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                            {item.applicableScope || '暂无适用范围说明'}
                          </span>
                        </div>
                      </td>

                      {/* 管理模式 & 费用政策 */}
                      <td className="py-3 px-3">
                        <div className="flex flex-col gap-1">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold w-fit border ${
                            isMandatory 
                              ? 'bg-emerald-50 text-emerald-900 border-emerald-200' 
                              : 'bg-amber-50 text-amber-900 border-amber-200'
                          }`}>
                            {isMandatory ? <ShieldCheck className="w-3 h-3 text-emerald-600" /> : <Scale className="w-3 h-3 text-amber-600" />}
                            {isMandatory ? '国家法定强检' : '医院定期校准'}
                          </span>
                          <span className={`text-[10px] font-bold ${
                            isMandatory ? 'text-emerald-700' : 'text-amber-800'
                          }`}>
                            {isMandatory ? '🟢 国家免费 (免征强检费)' : '🟡 医院自费 (商业收费)'}
                          </span>
                        </div>
                      </td>

                      {/* 检定周期 */}
                      <td className="py-3 px-3 text-center">
                        <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-slate-100 text-slate-800 font-mono font-bold text-xs border border-slate-200">
                          <Clock className="w-3 h-3 text-slate-500" />
                          {item.verificationPeriodMonths}个月
                        </span>
                      </td>

                      {/* 自动匹配关键词 */}
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {item.matchKeywords.map((kw, i) => (
                            <span 
                              key={i} 
                              className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700 text-[10px] font-mono"
                            >
                              {kw}
                            </span>
                          ))}
                        </div>
                      </td>

                      {/* 法规与规程依据 */}
                      <td className="py-3 px-4">
                        <div className="text-[11px] text-slate-600 line-clamp-2" title={item.legalBasis}>
                          {item.legalBasis}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate mt-0.5" title={item.verificationBody}>
                          推荐机构: {item.verificationBody}
                        </div>
                      </td>

                      {/* 状态 */}
                      <td className="py-3 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(item)}
                          className={`px-2 py-0.5 rounded text-[11px] font-bold border transition cursor-pointer ${
                            item.status === 'active'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                              : 'bg-slate-100 text-slate-500 border-slate-300 hover:bg-slate-200'
                          }`}
                          title="点击切换启用/停用状态"
                        >
                          {item.status === 'active' ? '启用中' : '已停用'}
                        </button>
                      </td>

                      {/* 操作 */}
                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(item)}
                            className="p-1 rounded hover:bg-slate-100 text-blue-600 hover:text-blue-800 transition cursor-pointer"
                            title="编辑目录属性与规则"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteItem(item.id, item.name)}
                            className="p-1 rounded hover:bg-rose-50 text-rose-500 hover:text-rose-700 transition cursor-pointer"
                            title="删除目录项"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* 表格底部统一标准分页栏 */}
        <Pagination
          currentPage={currentPage}
          pageSize={pageSize}
          totalCount={filteredCatalogue.length}
          onPageChange={setCurrentPage}
          onPageSizeChange={(sz) => {
            setPageSize(sz);
            setCurrentPage(1);
          }}
        />
      </div>

      {/* 5. 新增/编辑目录模态弹窗 */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col border border-slate-200 overflow-hidden animate-scaleIn">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Scale className="w-5 h-5 text-indigo-400" />
                <h3 className="font-bold text-sm">
                  {editingItem ? '编辑国家计量强检/校准目录' : '新增国家计量强检/校准目录条目'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white text-lg font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    目录编号 / 代码 <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value)}
                    placeholder="例：QJ-13 或 JZ-11"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    管理分类与政策性质 <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formType}
                    onChange={(e) => {
                      const t = e.target.value as 'mandatory' | 'periodic_calibration';
                      setFormType(t);
                      if (t === 'mandatory') {
                        setFormLegalBasis('《计量法》第9条、国家市场监管总局2020年第42号公告、财税〔2017〕20号（国家免征强检费）');
                        setFormVerificationBody('法定计量检定机构 (通过e-CQS全国强检平台备案申请)');
                      } else {
                        setFormLegalBasis('JJF系列计量技术规范、医疗器械使用质量管理规范、临床质控要求');
                        setFormVerificationBody('具有CNAS/CMA资质的计量校准机构 / 原厂技术服务商');
                      }
                    }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                  >
                    <option value="mandatory">⚖️ 国家法定强制检定 (国家免费 / 免征检定费)</option>
                    <option value="periodic_calibration">📐 医院定期校准 (医院自费 / 商业收费检验)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  计量器具名称 <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="例：心电图机 (含工作站) / 医用微量注射泵"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-bold text-slate-900 text-sm focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    检定/校准周期 (月) <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formPeriod}
                    onChange={(e) => setFormPeriod(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                  >
                    <option value={6}>6个月 (半年周检，如血压计)</option>
                    <option value={12}>12个月 (1年周期，国家标准规程)</option>
                    <option value={24}>24个月 (2年周期)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    原政府定价 / 参考校准单价 (元/台次)
                  </label>
                  <input
                    type="number"
                    value={formFeeEst}
                    onChange={(e) => setFormFeeEst(Number(e.target.value))}
                    placeholder="用于测算国家政策减免效益或年预算"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  智能自动分类匹配关键词 (用逗号或空格分隔)
                </label>
                <input
                  type="text"
                  value={formKeywords}
                  onChange={(e) => setFormKeywords(e.target.value)}
                  placeholder="例：心电图、心电机、ECG、动态心电"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 font-mono focus:ring-2 focus:ring-indigo-500"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  系统在设备台账录入或一键智能对齐时，会匹配设备名称/型号中包含的关键词自动判定归属。
                </p>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">法规依据 / 检定规程</label>
                <input
                  type="text"
                  value={formLegalBasis}
                  onChange={(e) => setFormLegalBasis(e.target.value)}
                  placeholder="例：《计量法》第9条、JJG 639-2023、财税〔2017〕20号"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">推荐法定机构 / 申报渠道</label>
                <input
                  type="text"
                  value={formVerificationBody}
                  onChange={(e) => setFormVerificationBody(e.target.value)}
                  placeholder="例：法定计量检定机构 (通过e-CQS全国强检平台备案申请)"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">适用范围与主要技术参数说明</label>
                <textarea
                  rows={2}
                  value={formScope}
                  onChange={(e) => setFormScope(e.target.value)}
                  placeholder="详细描述该计量器具在临床中的适用范围与关键技术指标..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 font-medium transition cursor-pointer"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-bold shadow-sm transition cursor-pointer"
                >
                  保存目录配置
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

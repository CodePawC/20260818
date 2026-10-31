import React, { useState, useMemo } from 'react';
import { 
  ShieldCheck, 
  Award, 
  FileCheck2, 
  AlertCircle, 
  TrendingUp, 
  Printer, 
  RefreshCw, 
  Plus, 
  CheckCircle2, 
  Clock, 
  Search, 
  Filter, 
  ChevronRight, 
  FileText,
  ExternalLink,
  SlidersHorizontal,
  Check,
  AlertTriangle
} from 'lucide-react';
import { 
  AccreditationClause, 
  NationalHospitalKpi, 
  QualityCapaItem, 
  AccreditationLevel,
  CapaStatus
} from '../../types/qualityAccreditationTypes';
import { 
  INITIAL_ACCREDITATION_CLAUSES, 
  INITIAL_QUALITY_CAPAS, 
  calculateDynamicAccreditationStats 
} from '../../utils/qualityAccreditationData';
import { MedicalEquipment } from '../../types';
import { AccreditationReportPrintModal } from './AccreditationReportPrintModal';

interface AccreditationQualityViewProps {
  equipmentList: MedicalEquipment[];
  currentUser?: any;
}

export const AccreditationQualityView: React.FC<AccreditationQualityViewProps> = ({
  equipmentList,
  currentUser
}) => {
  const [clauses, setClauses] = useState<AccreditationClause[]>(() => {
    try {
      const saved = localStorage.getItem('med_accreditation_clauses');
      return saved ? JSON.parse(saved) : INITIAL_ACCREDITATION_CLAUSES;
    } catch {
      return INITIAL_ACCREDITATION_CLAUSES;
    }
  });

  const [capas, setCapas] = useState<QualityCapaItem[]>(() => {
    try {
      const saved = localStorage.getItem('med_quality_capas');
      return saved ? JSON.parse(saved) : INITIAL_QUALITY_CAPAS;
    } catch {
      return INITIAL_QUALITY_CAPAS;
    }
  });

  const [activeTab, setActiveTab] = useState<'clauses' | 'kpis' | 'capas'>('clauses');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanMessage, setScanMessage] = useState<string | null>(null);

  // 新建/整改抽屉或弹窗状态
  const [editingCapa, setEditingCapa] = useState<QualityCapaItem | null>(null);
  const [isNewCapaModalOpen, setIsNewCapaModalOpen] = useState(false);
  const [newCapaForm, setNewCapaForm] = useState({
    clauseNumber: '4.6.3.1',
    sourceTitle: '',
    problemDescription: '',
    correctiveActionPlan: '',
    responsibleEngineer: '李思齐',
    department: '医学工程科',
    deadlineDate: '2026-11-15',
    severity: 'medium' as const
  });

  // 动态计算指标与总结
  const { kpis, summary } = useMemo(() => {
    return calculateDynamicAccreditationStats(equipmentList, capas);
  }, [equipmentList, capas]);

  // 保存条款修改
  const handleUpdateCriterion = (clauseId: string, level: AccreditationLevel) => {
    const nextClauses = clauses.map(clause => {
      if (clause.id !== clauseId) return clause;
      const nextCriteria = clause.criteria.map(c => {
        if (c.level === level) {
          return { ...c, achieved: !c.achieved };
        }
        return c;
      });

      // 重新评估最高达成级别
      const hasC = nextCriteria.find(c => c.level === 'C')?.achieved;
      const hasB = nextCriteria.find(c => c.level === 'B')?.achieved;
      const hasA = nextCriteria.find(c => c.level === 'A')?.achieved;

      let newLevel: AccreditationLevel = 'D';
      let score = 50;
      if (hasC) { newLevel = 'C'; score = 75; }
      if (hasC && hasB) { newLevel = 'B'; score = 88; }
      if (hasC && hasB && hasA) { newLevel = 'A'; score = 96; }

      return {
        ...clause,
        criteria: nextCriteria,
        currentLevel: newLevel,
        selfScore: score,
        lastEvaluatedAt: new Date().toISOString().split('T')[0]
      };
    });

    setClauses(nextClauses);
    try {
      localStorage.setItem('med_accreditation_clauses', JSON.stringify(nextClauses));
    } catch {}
  };

  // 模拟全院跨模块质控扫描联动
  const handleRunSystemScan = () => {
    setIsScanning(true);
    setScanMessage('正在实时联审核验全院设备台账、强检计量有效期、急救库完好率及工单闭环...');
    setTimeout(() => {
      setIsScanning(false);
      setScanMessage('跨模块质控扫描完成：检测到全院在用设备完好率 97.4%，强检合格率 100%，无严重脱检违规；2项PM巡检预警已同步纳入CAPA整改工作台。');
      setTimeout(() => setScanMessage(null), 6000);
    }, 1200);
  };

  // 闭环销号 CAPA
  const handleCloseCapa = (capaId: string) => {
    const nextCapas = capas.map(c => {
      if (c.id === capaId) {
        return {
          ...c,
          status: 'closed' as CapaStatus,
          completionDate: new Date().toISOString().split('T')[0],
          verificationNotes: '质控专家现场复测符合三甲规范，准予销号结案。'
        };
      }
      return c;
    });
    setCapas(nextCapas);
    try {
      localStorage.setItem('med_quality_capas', JSON.stringify(nextCapas));
    } catch {}
  };

  // 新增 CAPA
  const handleCreateCapaSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCapaForm.sourceTitle || !newCapaForm.problemDescription) return;

    const newCapa: QualityCapaItem = {
      id: `CAPA-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      clauseNumber: newCapaForm.clauseNumber,
      clauseTitle: clauses.find(c => c.clauseNumber === newCapaForm.clauseNumber)?.title || '医疗装备管理标准',
      sourceType: 'expert_inspection',
      sourceTitle: newCapaForm.sourceTitle,
      problemDescription: newCapaForm.problemDescription,
      correctiveActionPlan: newCapaForm.correctiveActionPlan,
      responsibleEngineer: newCapaForm.responsibleEngineer,
      department: newCapaForm.department,
      deadlineDate: newCapaForm.deadlineDate,
      severity: newCapaForm.severity,
      status: 'under_rectification',
      createdAt: `${new Date().toLocaleDateString('zh-CN')} ${new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}`
    };

    const nextCapas = [newCapa, ...capas];
    setCapas(nextCapas);
    try {
      localStorage.setItem('med_quality_capas', JSON.stringify(nextCapas));
    } catch {}
    setIsNewCapaModalOpen(false);
    setNewCapaForm({
      clauseNumber: '4.6.3.1',
      sourceTitle: '',
      problemDescription: '',
      correctiveActionPlan: '',
      responsibleEngineer: '李思齐',
      department: '医学工程科',
      deadlineDate: '2026-11-15',
      severity: 'medium'
    });
  };

  // 过滤条款
  const filteredClauses = useMemo(() => {
    return clauses.filter(clause => {
      const matchSearch = clause.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        clause.clauseNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        clause.coreRequirement.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCategory = selectedCategory === 'all' || clause.category === selectedCategory;
      return matchSearch && matchCategory;
    });
  }, [clauses, searchQuery, selectedCategory]);

  return (
    <div className="space-y-6 pb-12">
      {/* 顶部标题栏与全局迎检操作 */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-600 text-white rounded-lg shadow-sm">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">三甲复审与公立医院绩效国考质控中心</h1>
            <span className="text-xs bg-blue-50 text-blue-700 font-semibold px-2 py-0.5 rounded border border-blue-200">
              第四篇 医疗装备管理对标
            </span>
          </div>
          <p className="text-xs text-slate-500">
            依托全院实时设备运转台账，贯彻落实国家公立医院绩效考核（国考）质控指标，实现三甲评审条款动态自评与 CAPA 整改闭环。
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleRunSystemScan}
            disabled={isScanning}
            className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg border border-slate-300 flex items-center gap-1.5 transition-colors shadow-sm disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin text-blue-600' : 'text-slate-500'}`} />
            {isScanning ? '跨模块质控扫描中...' : '跨模块联动自检'}
          </button>

          <button
            onClick={() => setIsNewCapaModalOpen(true)}
            className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            新增整改待办(CAPA)
          </button>

          <button
            onClick={() => setIsPrintModalOpen(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <Printer className="w-3.5 h-3.5" />
            一键导出自评底稿
          </button>
        </div>
      </div>

      {/* 实时质控扫描提示条 */}
      {scanMessage && (
        <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-2 text-xs text-blue-800 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
          <span>{scanMessage}</span>
        </div>
      )}

      {/* 国考核心指标与达标速览 KPI Strip */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-[11px] font-medium text-slate-500">全院设备完好率 (国考)</span>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-bold font-mono text-emerald-600">
              {kpis.find(k => k.code === 'KPI-EQUIP-01')?.currentValue}%
            </span>
            <span className="text-[10px] text-slate-400">基准 ≥95%</span>
          </div>
          <span className="text-[10px] text-emerald-700 font-medium block">
            ● 考核达标 (优秀)
          </span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-[11px] font-medium text-slate-500">法定强检受检率</span>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-bold font-mono text-emerald-600">100.0%</span>
            <span className="text-[10px] text-slate-400">法定刚性</span>
          </div>
          <span className="text-[10px] text-emerald-700 font-medium block">
            ● e-CQS 证书在期
          </span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-[11px] font-medium text-slate-500">急救生命支持完好率</span>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-bold font-mono text-emerald-600">100.0%</span>
            <span className="text-[10px] text-slate-400">底线要求</span>
          </div>
          <span className="text-[10px] text-emerald-700 font-medium block">
            ● 45台全时在架备用
          </span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-[11px] font-medium text-slate-500">大型设备机时达标率</span>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-bold font-mono text-blue-600">93.6%</span>
            <span className="text-[10px] text-slate-400">基准 ≥90%</span>
          </div>
          <span className="text-[10px] text-blue-700 font-medium block">
            ● 检查负荷饱和
          </span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-[11px] font-medium text-slate-500">三甲条款总体达标率</span>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-bold font-mono text-blue-600">{summary.overallComplianceRate}%</span>
            <span className="text-[10px] text-slate-400">核心100%</span>
          </div>
          <span className="text-[10px] text-blue-700 font-medium block">
            ● A级{summary.levelACount}项 / B级{summary.levelBCount}项
          </span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-[11px] font-medium text-slate-500">CAPA整改与销号</span>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-bold font-mono text-slate-800">
              {summary.closedCapas}/{summary.totalCapas}
            </span>
            <span className="text-[10px] text-amber-600">待办 {summary.openCapas} 项</span>
          </div>
          <span className="text-[10px] text-amber-700 font-medium block">
            ● 持续质量改进PDCA
          </span>
        </div>
      </div>

      {/* 模块主导航与搜索过滤 */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 px-5 pt-3 gap-3">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setActiveTab('clauses')}
              className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
                activeTab === 'clauses'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <FileCheck2 className="w-4 h-4" />
              三甲标准条款自评 (第四篇)
              <span className="bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded text-[10px] font-mono">
                {clauses.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('kpis')}
              className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
                activeTab === 'kpis'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Award className="w-4 h-4" />
              公立医院绩效国考KPI穿透
              <span className="bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded text-[10px] font-mono">
                {kpis.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('capas')}
              className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
                activeTab === 'capas'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <AlertCircle className="w-4 h-4" />
              CAPA整改待办与销号追踪
              <span className="bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded text-[10px] font-mono font-bold">
                {summary.openCapas}
              </span>
            </button>
          </div>

          {activeTab === 'clauses' && (
            <div className="flex items-center gap-2 pb-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="搜索条款编号或关键词..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 w-48 sm:w-60"
                />
              </div>

              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="py-1.5 px-2.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white text-slate-700"
              >
                <option value="all">全部分类章节</option>
                <option value="organization">组织与制度体系</option>
                <option value="procurement">准入与验收</option>
                <option value="maintenance">维护与强检</option>
                <option value="emergency">急救生命支持</option>
                <option value="adverse_event">不良事件监测</option>
                <option value="udi_consumable">专机专耗与UDI</option>
              </select>
            </div>
          )}
        </div>

        {/* 标签页内容 */}
        <div className="p-5">
          {/* TAB 1: 三甲条款自查 */}
          {activeTab === 'clauses' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-500 pb-1">
                <span>共查询到 {filteredClauses.length} 项评审条款，点击级别标准可进行现场达成自评核验</span>
                <span className="font-mono text-slate-400">自评规则：A/B/C 逐级递进达成</span>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {filteredClauses.map((clause) => (
                  <div key={clause.id} className="border border-slate-200 rounded-xl p-5 hover:border-slate-300 transition-all bg-white space-y-4">
                    {/* 条款头部 */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-2.5">
                        <span className="px-2.5 py-1 bg-blue-50 text-blue-700 font-mono font-bold text-xs rounded-md border border-blue-200">
                          {clause.clauseNumber}
                        </span>
                        {clause.mandatoryCore && (
                          <span className="text-[11px] font-bold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded">
                            ★ 核心条款
                          </span>
                        )}
                        <h3 className="text-sm font-bold text-slate-900">{clause.title}</h3>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs text-slate-500">自评分数:</span>
                          <span className="font-mono text-base font-bold text-slate-900">{clause.selfScore}</span>
                          <span className="text-[10px] text-slate-400">/100</span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <span className="text-xs text-slate-500">达成级别:</span>
                          <span className={`px-2.5 py-0.5 text-xs font-bold font-mono rounded ${
                            clause.currentLevel === 'A' 
                              ? 'bg-emerald-100 text-emerald-800' 
                              : clause.currentLevel === 'B'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}>
                            {clause.currentLevel} 级达标
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* 核心要求文字 */}
                    <p className="text-xs text-slate-700 leading-relaxed font-medium bg-slate-50 p-3 rounded-lg border border-slate-100">
                      <strong>【条款核心要点】</strong> {clause.coreRequirement}
                    </p>

                    {/* A/B/C 三级考核标准互动卡片 */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {clause.criteria.map((crit) => (
                        <div
                          key={crit.level}
                          className={`p-3 rounded-lg border text-xs space-y-2 transition-all ${
                            crit.achieved
                              ? 'border-emerald-200 bg-emerald-50/40 text-slate-800'
                              : 'border-slate-200 bg-slate-50/70 text-slate-600'
                          }`}
                        >
                          <div className="flex items-center justify-between font-bold">
                            <span className="font-mono text-slate-900">{crit.level} 级指标标准</span>
                            <button
                              onClick={() => handleUpdateCriterion(clause.id, crit.level)}
                              className={`px-2 py-0.5 rounded text-[11px] font-medium flex items-center gap-1 transition-colors ${
                                crit.achieved
                                  ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                                  : 'bg-white border border-slate-300 text-slate-600 hover:bg-slate-100'
                              }`}
                            >
                              {crit.achieved ? (
                                <>
                                  <Check className="w-3 h-3" /> 已达成
                                </>
                              ) : (
                                '标记达成'
                              )}
                            </button>
                          </div>
                          <p className="text-[11px] leading-relaxed text-slate-700">{crit.requirement}</p>
                          <div className="text-[10px] text-slate-400 font-mono pt-1 border-t border-slate-200/50">
                            查验: {crit.checkMethod}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* 关联系统模块与支撑佐证证据 */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100 gap-2">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-slate-400">系统联动:</span>
                        <span className="font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded text-[11px]">
                          {clause.linkedModule}
                        </span>
                        <span className="text-slate-300">|</span>
                        <span className="text-slate-400">佐证汇编:</span>
                        <span className="text-slate-700">{clause.evidenceDocuments.join('、')}</span>
                      </div>

                      <div className="text-[11px] font-mono text-slate-400 shrink-0">
                        自评专家: {clause.evaluatorName} · {clause.lastEvaluatedAt}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: 国考KPI穿透 */}
          {activeTab === 'kpis' && (
            <div className="space-y-4">
              <div className="text-xs text-slate-500 pb-1">
                国家三级公立医院绩效考核（国考）装备质控指引，系统自动抓取全院业务数据进行计算与阈值合规监测。
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {kpis.map((kpi) => (
                  <div key={kpi.id} className="border border-slate-200 rounded-xl p-5 bg-white space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                          {kpi.code}
                        </span>
                        <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                          {kpi.categoryLabel}
                        </span>
                      </div>
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                        ● 考核合格达标
                      </span>
                    </div>

                    <div>
                      <h4 className="text-sm font-bold text-slate-900">{kpi.name}</h4>
                      <p className="text-xs text-slate-500 mt-0.5">{kpi.dataFormula}</p>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-lg flex items-center justify-between">
                      <div>
                        <span className="text-[11px] text-slate-400 block">医院实测当前值</span>
                        <span className="text-2xl font-black font-mono text-slate-900">
                          {kpi.currentValue}{kpi.unit}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[11px] text-slate-400 block">考核基准要求</span>
                        <span className="text-xs font-mono font-bold text-slate-700">
                          {kpi.baselineRequirement}
                        </span>
                      </div>
                    </div>

                    <div className="text-xs text-slate-600 bg-blue-50/50 p-2.5 rounded border border-blue-100 flex items-start gap-1.5">
                      <TrendingUp className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                      <span>{kpi.actionPrompt}</span>
                    </div>

                    <div className="text-[11px] text-slate-400 font-mono border-t border-slate-100 pt-2 flex items-center justify-between">
                      <span>数据源: {kpi.relatedSource}</span>
                      <span className="text-slate-500">{kpi.trendRate}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: CAPA 整改待办管理 */}
          {activeTab === 'capas' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-500 pb-1">
                <span>
                  共 {capas.length} 项纠正预防整改工单，其中待办中 
                  <strong className="text-amber-600 ml-1 font-mono">{summary.openCapas}</strong> 项，
                  已销号 <strong className="text-emerald-600 ml-1 font-mono">{summary.closedCapas}</strong> 项
                </span>
                <span className="font-mono text-slate-400">落实责任工程师与质控复核双闭环</span>
              </div>

              <div className="space-y-3">
                {capas.map((capa) => (
                  <div key={capa.id} className="border border-slate-200 rounded-xl p-4 bg-white hover:border-slate-300 transition-all space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs bg-slate-100 text-slate-800 px-2 py-0.5 rounded">
                          {capa.id}
                        </span>
                        <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                          {capa.clauseNumber}
                        </span>
                        <span className={`text-[11px] px-2 py-0.5 rounded font-medium ${
                          capa.severity === 'high'
                            ? 'bg-red-50 text-red-700 border border-red-200'
                            : capa.severity === 'medium'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-slate-100 text-slate-700'
                        }`}>
                          {capa.severity === 'high' ? '严重不符合' : capa.severity === 'medium' ? '一般缺陷' : '建议改进'}
                        </span>
                        <h4 className="text-xs font-bold text-slate-900">{capa.sourceTitle}</h4>
                      </div>

                      <div className="flex items-center gap-2">
                        {capa.status === 'closed' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                            <CheckCircle2 className="w-3.5 h-3.5" /> 已复核销号
                          </span>
                        ) : (
                          <button
                            onClick={() => handleCloseCapa(capa.id)}
                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded-lg flex items-center gap-1 shadow-sm transition-colors"
                          >
                            <CheckCircle2 className="w-3 h-3" />
                            质控专家复核销号
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      <div className="p-2.5 bg-slate-50 rounded-lg space-y-1">
                        <span className="text-[11px] font-bold text-slate-700">【不符合项描述】</span>
                        <p className="text-slate-600 leading-relaxed text-[11px]">{capa.problemDescription}</p>
                      </div>

                      <div className="p-2.5 bg-blue-50/50 rounded-lg space-y-1 border border-blue-100">
                        <span className="text-[11px] font-bold text-blue-900">【纠正与预防措施 (CAPA)】</span>
                        <p className="text-blue-800 leading-relaxed text-[11px]">{capa.correctiveActionPlan}</p>
                      </div>
                    </div>

                    {capa.verificationNotes && (
                      <div className="text-xs bg-emerald-50 text-emerald-800 p-2.5 rounded-lg border border-emerald-200">
                        <strong>复核专家意见：</strong>{capa.verificationNotes}
                      </div>
                    )}

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-100 gap-1 font-mono">
                      <span>责任人: {capa.responsibleEngineer} ({capa.department}) · 整改期限: {capa.deadlineDate}</span>
                      <span>登记时间: {capa.createdAt}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 新增整改待办模态框 */}
      {isNewCapaModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">新建三甲质控整改待办工单 (CAPA)</h3>
              <button
                onClick={() => setIsNewCapaModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleCreateCapaSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 font-medium mb-1">关联三甲条款</label>
                <select
                  value={newCapaForm.clauseNumber}
                  onChange={(e) => setNewCapaForm({ ...newCapaForm, clauseNumber: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  {clauses.map(c => (
                    <option key={c.clauseNumber} value={c.clauseNumber}>
                      {c.clauseNumber} - {c.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">不符合项/预警来源标题</label>
                <input
                  type="text"
                  required
                  placeholder="如：超声探头维护记录不完整"
                  value={newCapaForm.sourceTitle}
                  onChange={(e) => setNewCapaForm({ ...newCapaForm, sourceTitle: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">现场查验问题描述</label>
                <textarea
                  required
                  rows={2}
                  placeholder="详细描述核查中发现的不符合项缺陷..."
                  value={newCapaForm.problemDescription}
                  onChange={(e) => setNewCapaForm({ ...newCapaForm, problemDescription: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">纠正与预防措施计划</label>
                <textarea
                  required
                  rows={2}
                  placeholder="明确具体的整改处置步骤、替代备机或流程防范机制..."
                  value={newCapaForm.correctiveActionPlan}
                  onChange={(e) => setNewCapaForm({ ...newCapaForm, correctiveActionPlan: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">责任工程师</label>
                  <input
                    type="text"
                    required
                    value={newCapaForm.responsibleEngineer}
                    onChange={(e) => setNewCapaForm({ ...newCapaForm, responsibleEngineer: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">整改截止日期</label>
                  <input
                    type="date"
                    required
                    value={newCapaForm.deadlineDate}
                    onChange={(e) => setNewCapaForm({ ...newCapaForm, deadlineDate: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsNewCapaModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm"
                >
                  保存并下发工单
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 迎检底稿与国考专报打印导出模态框 */}
      <AccreditationReportPrintModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        clauses={clauses}
        kpis={kpis}
        capas={capas}
        summary={summary}
      />
    </div>
  );
};

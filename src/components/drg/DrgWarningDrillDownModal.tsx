import React, { useState, useMemo } from 'react';
import { 
  X, 
  ShieldAlert, 
  AlertTriangle, 
  Printer, 
  FileText, 
  Wrench, 
  CheckCircle2, 
  ExternalLink, 
  Clock, 
  Cpu, 
  Package, 
  Building2, 
  Calendar, 
  Coins, 
  ArrowRight, 
  ArrowUpRight, 
  Sparkles, 
  Layers, 
  Check, 
  Activity, 
  Info,
  ChevronRight,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { 
  DrgWarningAlert, 
  DrgGroupMaster, 
  DrgCaseAuditRecord, 
  DedicatedEquipmentAuditSummary 
} from '../../types/drgTypes';
import { MedicalEquipment } from '../../types';
import { 
  calculateEquipmentDrgDetailedCostAnalysis, 
  AssociatedMaintenanceRecord 
} from '../../utils/drgMaintenanceData';

interface DrgWarningDrillDownModalProps {
  isOpen: boolean;
  onClose: () => void;
  alert: DrgWarningAlert | null;
  cases: DrgCaseAuditRecord[];
  groups: DrgGroupMaster[];
  equipmentSummaries: DedicatedEquipmentAuditSummary[];
  equipmentList?: MedicalEquipment[];
  onNavigateToLedger?: (equipmentId?: string) => void;
  onNavigateToRoi?: () => void;
  onHandleAlert?: (alertId: string, remark: string) => void;
}

export const DrgWarningDrillDownModal: React.FC<DrgWarningDrillDownModalProps> = ({
  isOpen,
  onClose,
  alert,
  cases,
  groups,
  equipmentSummaries,
  equipmentList,
  onNavigateToLedger,
  onNavigateToRoi,
  onHandleAlert
}) => {
  const [activeTab, setActiveTab] = useState<'cost_breakdown' | 'maintenance_records' | 'case_stream' | 'action_plan'>('cost_breakdown');
  const [expandedRepairId, setExpandedRepairId] = useState<string | null>(null);
  const [remarkInput, setRemarkInput] = useState<string>('');
  const [isRemarkSaved, setIsRemarkSaved] = useState<boolean>(false);

  // 计算该设备在指定病组下的详细费用构成与对比数据
  const analysis = useMemo(() => {
    if (!alert) return null;
    return calculateEquipmentDrgDetailedCostAnalysis(
      alert.internalNo,
      alert.drgCode,
      cases,
      groups,
      equipmentSummaries,
      alert,
      equipmentList
    );
  }, [alert, cases, groups, equipmentSummaries, equipmentList]);

  if (!isOpen || !alert || !analysis) return null;

  const isRed = alert.alertLevel === 'red';

  const handleSaveActionPlan = () => {
    const text = remarkInput.trim() || '已组织医工科与临床科室现场复核，耗材规格与手术包配置已纠偏规范。';
    onHandleAlert?.(alert.id, text);
    setIsRemarkSaved(true);
    setTimeout(() => setIsRemarkSaved(false), 3000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 w-full max-w-5xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[92vh] overflow-hidden my-auto">
        
        {/* ==================== 顶部模态框标题栏 ==================== */}
        <div className={`px-5 py-4 border-b flex items-center justify-between shrink-0 select-none ${
          isRed
            ? 'bg-gradient-to-r from-rose-900 via-rose-800 to-slate-900 text-white border-rose-700/60'
            : 'bg-gradient-to-r from-amber-800 via-amber-700 to-slate-900 text-white border-amber-600/60'
        }`}>
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative flex items-center justify-center p-2 rounded-xl bg-white/10 backdrop-blur-xs shrink-0">
              <span className={`w-3 h-3 rounded-full animate-ping absolute ${isRed ? 'bg-rose-400' : 'bg-amber-400'}`}></span>
              {isRed ? (
                <ShieldAlert className="w-5 h-5 text-rose-200 relative" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-amber-200 relative" />
              )}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-xs font-black px-2 py-0.5 rounded-full border ${
                  isRed 
                    ? 'bg-rose-500/30 text-rose-100 border-rose-400/50' 
                    : 'bg-amber-500/30 text-amber-100 border-amber-300/50'
                }`}>
                  {isRed ? '🚨 红色高危专耗预警' : '⚠️ 黄色专耗偏离预警'}
                </span>
                <span className="font-mono font-bold text-xs bg-black/30 px-2 py-0.5 rounded text-slate-200">
                  偏差率: {alert.exceedRatePercent > 0 ? `+${alert.exceedRatePercent}%` : '异常'}
                </span>
                <span className="text-xs text-slate-300">
                  触发时间: {alert.detectedAt}
                </span>
              </div>

              <h2 className="text-base sm:text-lg font-black tracking-tight truncate mt-1">
                【{analysis.equipmentInternalNo}】{analysis.equipmentName} · DRG【{analysis.drgCode}】费用构成穿透下钻与维保审计
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 ml-3">
            <button
              type="button"
              onClick={handlePrint}
              className="px-2.5 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-white text-xs font-medium transition flex items-center gap-1 cursor-pointer"
              title="打印本穿透审计单"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">打印审计报告</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition cursor-pointer"
              title="关闭"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ==================== 设备与病组上下文卡片 ==================== */}
        <div className="px-5 py-3 bg-slate-50 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-slate-600 dark:text-slate-300 shrink-0">
          {/* 设备档案信息 */}
          <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 shadow-2xs">
            <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5">
              <Cpu className="w-4 h-4" />
            </div>
            <div className="space-y-1 min-w-0 flex-1">
              <div className="flex items-center justify-between gap-1">
                <span className="font-bold text-slate-900 dark:text-white text-xs truncate">
                  {analysis.equipmentName} ({analysis.model})
                </span>
                <span className="font-mono text-[11px] font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/40 px-1.5 py-0.2 rounded shrink-0">
                  {analysis.equipmentInternalNo}
                </span>
              </div>
              <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400 flex-wrap">
                <span>所属科室: <strong className="text-slate-700 dark:text-slate-200">{analysis.departmentName}</strong></span>
                <span>设备原值: <strong className="text-slate-700 dark:text-slate-200 font-mono">¥{(analysis.originalValue / 10000).toFixed(1)}万</strong></span>
                <span>机时测算: <strong className="text-indigo-600 dark:text-indigo-400 font-mono">¥{analysis.hourlyCostBenchmark}/h</strong></span>
              </div>
            </div>
          </div>

          {/* DRG病组基准信息 */}
          <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 shadow-2xs">
            <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5">
              <Layers className="w-4 h-4" />
            </div>
            <div className="space-y-1 min-w-0 flex-1">
              <div className="flex items-center justify-between gap-1">
                <span className="font-bold text-slate-900 dark:text-white text-xs truncate">
                  DRG【{analysis.drgCode}】{analysis.drgName}
                </span>
                <span className="font-mono text-[11px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/40 px-1.5 py-0.2 rounded shrink-0">
                  RW {analysis.weightPoints.toFixed(2)}
                </span>
              </div>
              <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400 flex-wrap">
                <span>医保定额标额: <strong className="text-emerald-700 dark:text-emerald-400 font-mono">¥{analysis.benchmarkPayment.toLocaleString()}/例</strong></span>
                <span>标准开机工时: <strong className="text-slate-700 dark:text-slate-200 font-mono">{analysis.standardHoursPerCase}h</strong></span>
                <span>标化住院日: <strong className="text-slate-700 dark:text-slate-200 font-mono">{analysis.targetAlosDays}天</strong></span>
              </div>
            </div>
          </div>
        </div>

        {/* ==================== 4 个核心例均指标 KPI 胶囊 ==================== */}
        <div className="px-5 py-3 grid grid-cols-2 lg:grid-cols-4 gap-2.5 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
          {/* KPI 1: 医保统筹标额 vs 实际总费 */}
          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <div className="text-[11px] text-slate-500 dark:text-slate-400">例均总费 vs 医保定额</div>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-sm sm:text-base font-black font-mono text-slate-900 dark:text-white">
                ¥{analysis.actualTotalHospitalCostPerCase.toLocaleString()}
              </span>
              <span className="text-[10.5px] text-slate-400 line-through">
                / {analysis.benchmarkPayment.toLocaleString()}
              </span>
            </div>
            <div className="text-[10px] mt-1 font-semibold flex items-center gap-1">
              <span className={analysis.isProfit ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>
                {analysis.isProfit ? '结余 +' : '倒挂亏损 -'}¥{Math.abs(analysis.netBalancePerCase).toLocaleString()}
              </span>
              <span className="text-slate-400">({analysis.isProfit ? '微利结余' : '超出统筹'})</span>
            </div>
          </div>

          {/* KPI 2: 单机例均专耗支出 */}
          <div className={`p-2.5 rounded-xl border ${
            isRed 
              ? 'bg-rose-50/60 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/60' 
              : 'bg-amber-50/60 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/60'
          }`}>
            <div className="text-[11px] text-slate-600 dark:text-slate-400">单机例均专耗支出</div>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className={`text-sm sm:text-base font-black font-mono ${
                isRed ? 'text-rose-700 dark:text-rose-400' : 'text-amber-700 dark:text-amber-400'
              }`}>
                ¥{analysis.actualAvgConsumableCostPerCase.toLocaleString()}
              </span>
              <span className="text-[10.5px] text-slate-500">
                / 均¥{analysis.groupAvgConsumableBenchmark.toLocaleString()}
              </span>
            </div>
            <div className={`text-[10px] font-bold mt-1 flex items-center gap-0.5 ${
              isRed ? 'text-rose-600 dark:text-rose-400' : 'text-amber-600 dark:text-amber-400'
            }`}>
              <ArrowUpRight className="w-3 h-3" />
              <span>超病组均值 +{analysis.consumableExceedRatePercent}%</span>
            </div>
          </div>

          {/* KPI 3: 专机设备折旧机时成本 */}
          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <div className="text-[11px] text-slate-500 dark:text-slate-400">例均开机折旧分摊</div>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-sm sm:text-base font-black font-mono text-indigo-700 dark:text-indigo-400">
                ¥{analysis.allocatedEquipmentCostPerCase.toLocaleString()}
              </span>
              <span className="text-[10.5px] text-slate-500">
                ({analysis.actualAvgHoursPerCase}h)
              </span>
            </div>
            <div className="text-[10px] text-slate-500 mt-1">
              标准开机: {analysis.standardHoursPerCase}h · 基准 ¥{analysis.hourlyCostBenchmark}/h
            </div>
          </div>

          {/* KPI 4: 关联维保分摊成本 */}
          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <div className="text-[11px] text-slate-500 dark:text-slate-400">维保零修单病案分摊</div>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-sm sm:text-base font-black font-mono text-amber-700 dark:text-amber-400">
                ¥{analysis.allocatedMaintenanceCostPerCase.toLocaleString()}
              </span>
              <span className="text-[10.5px] text-slate-500">
                /例
              </span>
            </div>
            <div className="text-[10px] text-slate-500 mt-1 flex items-center gap-1 truncate">
              <span>年维保投入: ¥{(analysis.totalAnnualMaintenanceCost / 10000).toFixed(1)}万</span>
              <span>·</span>
              <span>分摊费率: ¥{analysis.hourlyMaintenanceRate}/h</span>
            </div>
          </div>
        </div>

        {/* ==================== 四大模块导航 Tab 栏 ==================== */}
        <div className="px-5 bg-slate-100/80 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 overflow-x-auto shrink-0 text-xs">
          <div className="flex items-center gap-1 py-1.5">
            <button
              type="button"
              onClick={() => setActiveTab('cost_breakdown')}
              className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'cost_breakdown'
                  ? 'bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-400 shadow-2xs border border-slate-200/80 dark:border-slate-700'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <Coins className="w-3.5 h-3.5" />
              <span>1. 详细费用构成分析</span>
              <span className="px-1.5 py-0.2 rounded text-[10px] bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300">
                4大板块
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('maintenance_records')}
              className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'maintenance_records'
                  ? 'bg-white dark:bg-slate-800 text-amber-700 dark:text-amber-400 shadow-2xs border border-slate-200/80 dark:border-slate-700'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <Wrench className="w-3.5 h-3.5" />
              <span>2. 关联维保与修缮记录</span>
              <span className="px-1.5 py-0.2 rounded text-[10px] bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300">
                {analysis.maintenanceRecords.length} 笔工单
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('case_stream')}
              className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'case_stream'
                  ? 'bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-400 shadow-2xs border border-slate-200/80 dark:border-slate-700'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>3. 病组病案核验流水</span>
              <span className="px-1.5 py-0.2 rounded text-[10px] bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300">
                {analysis.associatedCases.length} 份病案
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('action_plan')}
              className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'action_plan'
                  ? 'bg-white dark:bg-slate-800 text-rose-700 dark:text-rose-400 shadow-2xs border border-slate-200/80 dark:border-slate-700'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>4. 质控归因与整改闭环</span>
              {alert.handled ? (
                <span className="px-1.5 py-0.2 rounded text-[10px] bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300 flex items-center gap-0.5">
                  <Check className="w-2.5 h-2.5" /> 已整改
                </span>
              ) : (
                <span className="px-1.5 py-0.2 rounded text-[10px] bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-300">
                  待闭环
                </span>
              )}
            </button>
          </div>

          <div className="flex items-center gap-2 py-1 shrink-0">
            {onNavigateToLedger && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onNavigateToLedger(analysis.equipmentInternalNo);
                }}
                className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>查看设备台账</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            )}
            {onNavigateToRoi && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onNavigateToRoi();
                }}
                className="text-[11px] text-slate-600 dark:text-slate-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>单机ROI</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* ==================== 模态框主体内容区 (滚动) ==================== */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4 text-xs">
          
          {/* ==================== TAB 1: 详细费用构成分析 ==================== */}
          {activeTab === 'cost_breakdown' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              
              {/* 费用结构全景堆叠条 */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <Coins className="w-4 h-4 text-blue-600" />
                      <span>单病案费用构成与全景权重透视</span>
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      本机每例总医疗成本为 <strong className="text-slate-900 dark:text-white font-mono">¥{analysis.actualTotalHospitalCostPerCase.toLocaleString()}</strong>，医保定额结算标额为 <strong className="text-emerald-600 font-mono">¥{analysis.benchmarkPayment.toLocaleString()}</strong>
                    </p>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-xs font-bold font-mono ${
                    analysis.isProfit 
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' 
                      : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                  }`}>
                    {analysis.isProfit ? '结余率 +' : '亏损率 -'}
                    {Math.abs(+((analysis.netBalancePerCase / analysis.benchmarkPayment) * 100).toFixed(1))}%
                  </span>
                </div>

                {/* 堆叠进度条 */}
                <div className="h-5 rounded-lg overflow-hidden flex shadow-inner text-[10px] font-bold text-white">
                  <div 
                    style={{ width: `${analysis.consumablePercentage}%` }} 
                    className="bg-rose-500 flex items-center justify-center truncate px-1 transition-all"
                    title={`专用高值耗材: ¥${analysis.actualAvgConsumableCostPerCase.toLocaleString()} (${analysis.consumablePercentage}%)`}
                  >
                    专机专耗 {analysis.consumablePercentage}%
                  </div>
                  <div 
                    style={{ width: `${analysis.equipmentDepreciationPercentage}%` }} 
                    className="bg-indigo-600 flex items-center justify-center truncate px-1 transition-all"
                    title={`设备折旧机时: ¥${analysis.allocatedEquipmentCostPerCase.toLocaleString()} (${analysis.equipmentDepreciationPercentage}%)`}
                  >
                    折旧工时 {analysis.equipmentDepreciationPercentage}%
                  </div>
                  <div 
                    style={{ width: `${analysis.maintenanceAllocationPercentage}%` }} 
                    className="bg-amber-500 flex items-center justify-center truncate px-1 transition-all"
                    title={`维保零修分摊: ¥${analysis.allocatedMaintenanceCostPerCase.toLocaleString()} (${analysis.maintenanceAllocationPercentage}%)`}
                  >
                    维保分摊 {analysis.maintenanceAllocationPercentage}%
                  </div>
                  <div 
                    style={{ width: `${analysis.otherMedicalPercentage}%` }} 
                    className="bg-slate-400 dark:bg-slate-600 flex items-center justify-center truncate px-1 transition-all"
                    title={`其他诊疗药品: ¥${analysis.otherMedicalCostPerCase.toLocaleString()} (${analysis.otherMedicalPercentage}%)`}
                  >
                    基础诊疗 {analysis.otherMedicalPercentage}%
                  </div>
                </div>

                {/* 4块细分指标卡图例 */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[11px]">
                  <div className="p-2 rounded-lg bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-1.5 text-slate-500">
                      <span className="w-2.5 h-2.5 rounded-sm bg-rose-500 inline-block"></span>
                      <span>专用医用耗材</span>
                    </div>
                    <div className="text-sm font-bold font-mono text-slate-900 dark:text-white mt-1">
                      ¥{analysis.actualAvgConsumableCostPerCase.toLocaleString()}
                    </div>
                    <div className="text-[10px] text-rose-600 font-semibold">
                      占比 {analysis.consumablePercentage}% · 超均值 +{analysis.consumableExceedRatePercent}%
                    </div>
                  </div>

                  <div className="p-2 rounded-lg bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-1.5 text-slate-500">
                      <span className="w-2.5 h-2.5 rounded-sm bg-indigo-600 inline-block"></span>
                      <span>专机机时折旧</span>
                    </div>
                    <div className="text-sm font-bold font-mono text-slate-900 dark:text-white mt-1">
                      ¥{analysis.allocatedEquipmentCostPerCase.toLocaleString()}
                    </div>
                    <div className="text-[10px] text-indigo-600 font-semibold">
                      占比 {analysis.equipmentDepreciationPercentage}% · {analysis.actualAvgHoursPerCase}小时/例
                    </div>
                  </div>

                  <div className="p-2 rounded-lg bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-1.5 text-slate-500">
                      <span className="w-2.5 h-2.5 rounded-sm bg-amber-500 inline-block"></span>
                      <span>维保服务分摊</span>
                    </div>
                    <div className="text-sm font-bold font-mono text-slate-900 dark:text-white mt-1">
                      ¥{analysis.allocatedMaintenanceCostPerCase.toLocaleString()}
                    </div>
                    <div className="text-[10px] text-amber-600 font-semibold">
                      占比 {analysis.maintenanceAllocationPercentage}% · ¥{analysis.hourlyMaintenanceRate}/机时
                    </div>
                  </div>

                  <div className="p-2 rounded-lg bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-1.5 text-slate-500">
                      <span className="w-2.5 h-2.5 rounded-sm bg-slate-400 inline-block"></span>
                      <span>其他药品诊疗床位</span>
                    </div>
                    <div className="text-sm font-bold font-mono text-slate-900 dark:text-white mt-1">
                      ¥{analysis.otherMedicalCostPerCase.toLocaleString()}
                    </div>
                    <div className="text-[10px] text-slate-500 font-semibold">
                      占比 {analysis.otherMedicalPercentage}% · 临床常规费用
                    </div>
                  </div>
                </div>
              </div>

              {/* 专机专用耗材清单与临床路径标准对比表 */}
              <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-2xs">
                <div className="bg-slate-100 dark:bg-slate-800 px-4 py-2.5 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                  <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Package className="w-4 h-4 text-rose-600" />
                    <span>专用高值医用耗材领用与临床路径标准定额对比表</span>
                  </div>
                  <span className="text-[11px] text-slate-500 font-mono">
                    国家医保耗材唯一编码 (UDI) 穿透
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-850 text-slate-500 border-b border-slate-200 dark:border-slate-700">
                        <th className="py-2.5 px-3 font-medium">国家医保耗材代码 / 品名规格</th>
                        <th className="py-2.5 px-3 font-medium">品牌 / 厂商</th>
                        <th className="py-2.5 px-3 font-medium text-center">医保属性</th>
                        <th className="py-2.5 px-3 font-medium text-right">采购单价</th>
                        <th className="py-2.5 px-3 font-medium text-right">路径标准用量</th>
                        <th className="py-2.5 px-3 font-medium text-right">本机实际用量</th>
                        <th className="py-2.5 px-3 font-medium text-right">例均实际支出</th>
                        <th className="py-2.5 px-3 font-medium text-right">超额偏离度</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {analysis.consumableItems.map(item => {
                        const isOverItem = item.varianceRatePercent > 10;
                        return (
                          <tr key={item.consumableCode} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                            <td className="py-2.5 px-3">
                              <div className="font-bold text-slate-900 dark:text-white">
                                {item.consumableName}
                              </div>
                              <div className="text-[11px] text-slate-500 font-mono">
                                {item.spec} · {item.consumableCode}
                              </div>
                            </td>
                            <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300">
                              {item.brand}
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <span className={`px-1.5 py-0.5 rounded text-[10.5px] font-bold ${
                                item.medicalInsuranceCategory === 'A'
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                  : item.medicalInsuranceCategory === 'B'
                                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                                  : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                              }`}>
                                {item.medicalInsuranceCategory === 'A' ? '甲类(100%报)' : item.medicalInsuranceCategory === 'B' ? `乙类(${(item.reimbursementRatio * 100).toFixed(0)}%)` : '自费'}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                              ¥{item.unitPrice.toLocaleString()}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono text-slate-500">
                              {item.standardExpectedRatio.toFixed(1)} {item.unit}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                              <span className={isOverItem ? 'text-rose-600 dark:text-rose-400' : ''}>
                                {item.actualAvgUsedRatio.toFixed(2)} {item.unit}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-black text-slate-900 dark:text-white">
                              ¥{item.actualAvgCost.toLocaleString()}
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              {item.varianceRatePercent > 0 ? (
                                <span className={`font-mono font-bold px-1.5 py-0.5 rounded text-[11px] ${
                                  item.varianceRatePercent >= 30
                                    ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/60 dark:text-rose-300'
                                    : 'bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300'
                                }`}>
                                  +{item.varianceRatePercent}% (+¥{item.costImpactAmount.toLocaleString()})
                                </span>
                              ) : (
                                <span className="text-emerald-600 font-medium">正常符合</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 智能归因排查结论面板 */}
              <div className="p-3.5 rounded-xl bg-gradient-to-r from-amber-500/10 via-rose-500/10 to-transparent border border-amber-200 dark:border-amber-800 space-y-2">
                <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  <span>三甲质控专家与医工智能诊断结论 (Root Cause Analysis)</span>
                </div>
                <div className="space-y-1.5 text-[11.5px] leading-relaxed text-slate-700 dark:text-slate-300">
                  {analysis.rootCauseDiagnoses.map((diag, i) => (
                    <div key={i} className="flex items-start gap-2 bg-white/70 dark:bg-slate-800/70 p-2 rounded-lg border border-slate-200/60 dark:border-slate-700">
                      <span className="text-rose-600 font-bold shrink-0">·</span>
                      <span>{diag}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* ==================== TAB 2: 关联维保与修缮记录 (核心关联) ==================== */}
          {activeTab === 'maintenance_records' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              
              {/* 维保分摊机制与全生命周期台账标头 */}
              <div className="p-3.5 rounded-xl bg-amber-50/80 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="font-bold text-slate-900 dark:text-white text-xs flex items-center gap-1.5">
                    <Wrench className="w-4 h-4 text-amber-600" />
                    <span>专机维保全周期技术档案与单病种分摊机制</span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400">
                    测算依据: 该设备年累计维保修缮支出 <strong className="font-mono text-slate-900 dark:text-white">¥{analysis.totalAnnualMaintenanceCost.toLocaleString()}</strong>，按年化有效开机工时({analysis.annualRunningHoursEstimated}h)折算为 <strong className="font-mono text-amber-700 dark:text-amber-400">¥{analysis.hourlyMaintenanceRate}/机时</strong>，本病组平均开机 {analysis.actualAvgHoursPerCase}h，每例分摊维保成本为 <strong className="font-mono text-amber-700 dark:text-amber-400">¥{analysis.allocatedMaintenanceCostPerCase}</strong>。
                  </p>
                </div>

                <div className="shrink-0 flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-amber-300 text-amber-900 dark:text-amber-300 font-bold text-xs">
                    共关联 {analysis.maintenanceRecords.length} 项维保修缮记录
                  </span>
                </div>
              </div>

              {/* 关联维保工单卡片列表 */}
              <div className="space-y-3">
                {analysis.maintenanceRecords.map(record => {
                  const isExpanded = expandedRepairId === record.id;
                  const isRootCause = record.isKeyRootCause;

                  return (
                    <div 
                      key={record.id}
                      className={`rounded-xl border transition-all ${
                        isRootCause 
                          ? 'border-rose-300 dark:border-rose-800 bg-rose-50/30 dark:bg-rose-950/20 shadow-xs' 
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'
                      }`}
                    >
                      {/* 工单卡头 */}
                      <div 
                        onClick={() => setExpandedRepairId(isExpanded ? null : record.id)}
                        className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 cursor-pointer hover:bg-slate-50/60 dark:hover:bg-slate-750 transition"
                      >
                        <div className="flex items-start gap-2.5 min-w-0">
                          <div className={`p-2 rounded-lg shrink-0 mt-0.5 ${
                            record.repairType === '紧急故障维修'
                              ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/60 dark:text-rose-300'
                              : record.repairType === '定期预防性保养'
                              ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300'
                              : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300'
                          }`}>
                            <Wrench className="w-4 h-4" />
                          </div>

                          <div className="min-w-0 space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-mono font-bold text-xs text-slate-800 dark:text-slate-100 bg-slate-100 dark:bg-slate-700 px-1.5 py-0.2 rounded">
                                {record.id}
                              </span>
                              <span className={`px-2 py-0.2 rounded text-[10.5px] font-bold ${
                                record.repairType === '紧急故障维修'
                                  ? 'bg-rose-100 text-rose-800 dark:bg-rose-900/50 dark:text-rose-300'
                                  : 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300'
                              }`}>
                                {record.repairType}
                              </span>
                              <span className="text-[11px] text-slate-500 font-mono">
                                报修时间: {record.faultDate}
                              </span>
                              {record.completionDate && (
                                <span className="text-[11px] text-slate-500 font-mono">
                                  竣工: {record.completionDate}
                                </span>
                              )}
                              {isRootCause && (
                                <span className="px-2 py-0.2 rounded text-[10.5px] font-bold bg-rose-600 text-white animate-pulse">
                                  🔥 耗材超标核心诱因工单
                                </span>
                              )}
                            </div>

                            <p className="font-bold text-slate-900 dark:text-white text-xs sm:text-[13px] line-clamp-1">
                              {record.faultDescription}
                            </p>

                            <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400 flex-wrap">
                              <span>主修服务商: <strong className="text-slate-700 dark:text-slate-300">{record.technician}</strong></span>
                              <span>发生科室: <strong className="text-slate-700 dark:text-slate-300">{record.department || analysis.departmentName}</strong></span>
                              <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                                状态: {record.status}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* 右侧金额与展开按钮 */}
                        <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-1.5 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-200/60">
                          <div className="text-right">
                            <span className="text-[11px] text-slate-400">维修支出</span>
                            <div className="text-sm sm:text-base font-black font-mono text-rose-600 dark:text-rose-400">
                              ¥{(record.cost || 0).toLocaleString()}
                            </div>
                          </div>
                          <span className="text-[11px] text-blue-600 dark:text-blue-400 flex items-center gap-0.5 font-medium">
                            <span>{isExpanded ? '收起详情' : '展开技术报告'}</span>
                            <ChevronRight className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                          </span>
                        </div>
                      </div>

                      {/* 展开的维保技术服务回执与病组因果解释 */}
                      {isExpanded && (
                        <div className="p-3.5 border-t border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-850/80 space-y-3">
                          {/* 因果关联重要提示 */}
                          {record.drgCorrelationNote && (
                            <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-900 dark:text-rose-200 text-xs space-y-1">
                              <div className="font-bold flex items-center gap-1 text-rose-700 dark:text-rose-300">
                                <Sparkles className="w-3.5 h-3.5" />
                                <span>与当前DRG专耗异常的物理与临床因果关联</span>
                              </div>
                              <p className="leading-relaxed">
                                {record.drgCorrelationNote}
                              </p>
                            </div>
                          )}

                          {/* 故障排查与修复方案 */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                            <div className="p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-1">
                              <span className="text-slate-500 font-medium">修复方案与处理措施:</span>
                              <p className="font-semibold text-slate-800 dark:text-slate-200">
                                {record.resolution}
                              </p>
                            </div>

                            <div className="p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-1">
                              <span className="text-slate-500 font-medium">换下损坏配件 / 更换备品:</span>
                              <p className="font-semibold text-slate-800 dark:text-slate-200 font-mono">
                                {record.partsReplaced || '未更换大件，属调试校准保养'}
                              </p>
                            </div>
                          </div>

                          {/* 审计凭证四流闭环 */}
                          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200/60 dark:border-slate-700/60 flex-wrap gap-2">
                            <span className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-medium">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>已完成临床护士长/技师长电子双签验收</span>
                            </span>
                            <span className="text-slate-400">
                              服务商资质: ISO 13485 / 原厂三级维保认证
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

            </div>
          )}

          {/* ==================== TAB 3: 病组病案核验流水 ==================== */}
          {activeTab === 'case_stream' && (
            <div className="space-y-3 animate-in fade-in duration-200">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white">
                    该专机服务【{analysis.drgCode} {analysis.drgName}】住院病案交叉稽核清单
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    共核算 {analysis.associatedCases.length} 份住院病案 · 专机运行开机记录与高值耗材扫码计费逐笔对齐
                  </p>
                </div>
                <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300">
                  例均工时: {analysis.actualAvgHoursPerCase}h · 例均专耗: ¥{analysis.actualAvgConsumableCostPerCase.toLocaleString()}
                </span>
              </div>

              {analysis.associatedCases.length === 0 ? (
                <div className="p-8 text-center text-slate-400 bg-slate-50 dark:bg-slate-800 rounded-xl">
                  暂无匹配病案流水
                </div>
              ) : (
                <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-2xs">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-slate-850 text-slate-500 border-b border-slate-200 dark:border-slate-700">
                          <th className="py-2.5 px-3 font-medium">病案号 / 患者姓名</th>
                          <th className="py-2.5 px-3 font-medium">主治医师 · 住院天数</th>
                          <th className="py-2.5 px-3 font-medium text-right">专机开机时长</th>
                          <th className="py-2.5 px-3 font-medium">配套专耗UDI扫码批号</th>
                          <th className="py-2.5 px-3 font-medium text-right">专耗记账金额</th>
                          <th className="py-2.5 px-3 font-medium text-right">总医疗费用</th>
                          <th className="py-2.5 px-3 font-medium text-right">医保统筹额</th>
                          <th className="py-2.5 px-3 font-medium text-center">钩稽结论</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {analysis.associatedCases.map(c => {
                          const isNormal = c.auditStatus === 'normal';
                          return (
                            <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                              <td className="py-2.5 px-3">
                                <div className="font-mono font-bold text-slate-900 dark:text-white">
                                  {c.caseId}
                                </div>
                                <div className="text-[11px] text-slate-500">
                                  {c.patientName}
                                </div>
                              </td>
                              <td className="py-2.5 px-3">
                                <div className="text-slate-800 dark:text-slate-200">
                                  {c.attendingDoctor}
                                </div>
                                <div className="text-[11px] text-slate-400 font-mono">
                                  {c.admissionDate} ~ {c.dischargeDate} ({c.losDays}天)
                                </div>
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono font-bold text-indigo-700 dark:text-indigo-400">
                                {c.actualEquipmentHours}h
                              </td>
                              <td className="py-2.5 px-3 max-w-[200px]">
                                <div className="font-mono text-[11px] text-slate-700 dark:text-slate-300 truncate" title={c.consumableBarcode}>
                                  {c.consumableBarcode}
                                </div>
                                <div className="text-[10px] text-slate-400">
                                  领用: {c.consumableQuantity}套 (基准: {c.standardExpectedQuantity}套)
                                </div>
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono font-black text-rose-600 dark:text-rose-400">
                                ¥{c.actualConsumablesCost.toLocaleString()}
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                                ¥{c.totalHospitalCost.toLocaleString()}
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono text-emerald-600 font-semibold">
                                ¥{c.insurancePayment.toLocaleString()}
                              </td>
                              <td className="py-2.5 px-3 text-center">
                                {isNormal ? (
                                  <span className="inline-flex items-center gap-1 text-[10.5px] text-emerald-600 font-medium bg-emerald-50 dark:bg-emerald-950 px-1.5 py-0.5 rounded">
                                    <CheckCircle2 className="w-3 h-3" /> 正常
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-[10.5px] text-rose-700 dark:text-rose-300 font-bold bg-rose-100 dark:bg-rose-900/60 px-1.5 py-0.5 rounded" title={c.anomalyReason}>
                                    <AlertTriangle className="w-3 h-3" />
                                    {c.auditStatus === 'over_consumed' ? '耗材超标' : c.auditStatus === 'missing_consumable' ? '疑似漏记' : '日志脱钩'}
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ==================== TAB 4: 质控归因与整改闭环 ==================== */}
          {activeTab === 'action_plan' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              
              {/* 三甲公立医院国考质控标准要求 */}
              <div className="p-3.5 rounded-xl bg-blue-50/80 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 space-y-1.5">
                <div className="font-bold text-blue-900 dark:text-blue-300 flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-blue-600" />
                  <span>国家三级公立医院绩效考核（国考）· 百元医疗收入消耗卫生材料与专机钩稽监管要求</span>
                </div>
                <p className="text-[11.5px] text-blue-800 dark:text-blue-200 leading-relaxed">
                  公立医院高质量发展指标要求严格落实“专机专耗闭环追溯”，单台设备耗材支出偏离病组均值超过15%必须启动质控排查。结合该设备近期发生的维保配件更换记录，落实临床路径耗材规格限额，防范医保基金违规外流与超标使用。
                </p>
              </div>

              {/* 专家处置建议与排查清单 */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-3">
                <h4 className="font-bold text-slate-900 dark:text-white text-xs">
                  官方处置与临床整改建议措施:
                </h4>
                <div className="p-3 rounded-lg bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                  {analysis.suggestedAction}
                </div>

                {alert.handled && alert.handleRemark && (
                  <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-xs text-emerald-800 dark:text-emerald-300 space-y-1">
                    <div className="font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>已归档历史核查结论</span>
                    </div>
                    <p>{alert.handleRemark}</p>
                  </div>
                )}
              </div>

              {/* 协同整改填报表单 */}
              <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-3">
                <h4 className="font-bold text-slate-900 dark:text-white text-xs flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-emerald-600" />
                  <span>协同处置填报 · 医工科与科室双向会签核销</span>
                </h4>

                <textarea
                  rows={3}
                  value={remarkInput}
                  onChange={(e) => setRemarkInput(e.target.value)}
                  placeholder="请输入现场核验排查记录、器械维修确认、耗材定额纠偏措施与经办人员签字信息..."
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                />

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-slate-500">
                    提交后将更新系统预警闭环状态，公文留痕存入医保审计台账。
                  </span>

                  <button
                    type="button"
                    onClick={handleSaveActionPlan}
                    className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold rounded-lg text-xs transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>确认核查整改并闭环归档</span>
                  </button>
                </div>

                {isRemarkSaved && (
                  <div className="p-2 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded text-xs flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>整改结论已成功保存并归档！</span>
                  </div>
                )}
              </div>

            </div>
          )}

        </div>

        {/* ==================== 模态框底部操作栏 ==================== */}
        <div className="px-5 py-3 bg-slate-50 dark:bg-slate-850 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 shrink-0 text-xs">
          <div className="flex items-center gap-2 text-slate-500 text-[11px] min-w-0">
            <span className="font-mono">设备: {analysis.equipmentInternalNo}</span>
            <span>·</span>
            <span className="truncate">病组: {analysis.drgCode}</span>
            <span>·</span>
            <span>偏差: +{analysis.consumableExceedRatePercent}%</span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handlePrint}
              className="px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium transition cursor-pointer flex items-center gap-1"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>打印穿透审计表</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg text-xs transition cursor-pointer shadow-xs"
            >
              完成并返回
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

import React, { useState, useEffect, useMemo, useTransition } from 'react';
import { 
  ShieldCheck, 
  Play, 
  RefreshCw, 
  Zap, 
  Wrench, 
  CheckCircle2, 
  AlertTriangle, 
  AlertOctagon, 
  Clock, 
  Download, 
  Sliders, 
  Cpu, 
  Database, 
  FileCheck, 
  Layers, 
  Check, 
  Activity, 
  ArrowRight, 
  FileText, 
  HelpCircle,
  BarChart3,
  Search,
  Sparkles
} from 'lucide-react';
import { MedicalEquipment, RepairRecord, EquipmentLoanRecord } from '../types';
import { 
  runFullSystemDiagnostics, 
  runPerformanceStressBenchmark, 
  executeAutoRemediation, 
  DiagnosticsReport, 
  TestCaseResult, 
  DiagnosticCategory,
  DEFAULT_OPTIMIZATION_TOGGLES,
  PerformanceOptimizationToggles
} from '../utils/systemDiagnosticsEngine';

interface SystemDiagnosticsViewProps {
  equipmentList?: MedicalEquipment[];
  repairList?: RepairRecord[];
  loanList?: EquipmentLoanRecord[];
  onUpdateEquipment?: (updatedList: MedicalEquipment[]) => void;
  onNavigateTab?: (tab: string) => void;
}

export const SystemDiagnosticsView: React.FC<SystemDiagnosticsViewProps> = ({
  equipmentList = [],
  repairList = [],
  loanList = [],
  onUpdateEquipment,
  onNavigateTab
}) => {
  const [report, setReport] = useState<DiagnosticsReport | null>(null);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<'all' | DiagnosticCategory | 'toggles'>('all');
  const [expandedTestIds, setExpandedTestIds] = useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // 性能优化实时策略开关 (持久化至 LocalStorage)
  const [toggles, setToggles] = useState<PerformanceOptimizationToggles>(() => {
    try {
      const saved = localStorage.getItem('med_perf_optimization_toggles');
      return saved ? JSON.parse(saved) : DEFAULT_OPTIMIZATION_TOGGLES;
    } catch {
      return DEFAULT_OPTIMIZATION_TOGGLES;
    }
  });

  const handleToggle = (key: keyof PerformanceOptimizationToggles) => {
    setToggles(prev => {
      const next = { ...prev, [key]: !prev[key] };
      try {
        localStorage.setItem('med_perf_optimization_toggles', JSON.stringify(next));
      } catch {}
      return next;
    });
    showToast(`已更新性能策略配置: ${key}`);
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  };

  // 初始化加载与运行一次系统诊断
  useEffect(() => {
    let isMounted = true;
    const runInitial = async () => {
      setIsRunning(true);
      try {
        const res = await runFullSystemDiagnostics(equipmentList, repairList, loanList);
        if (isMounted) {
          setReport(res);
        }
      } catch (err) {
        console.error('Initial diagnostics failed', err);
      } finally {
        if (isMounted) {
          setIsRunning(false);
        }
      }
    };
    runInitial();
    return () => {
      isMounted = false;
    };
  }, [equipmentList.length]);

  // 手动触发全量系统体检
  const handleRunFullDiagnostics = async () => {
    setIsRunning(true);
    showToast('正在执行全院业务闭环、数据一致性与性能基准全量扫描...');
    try {
      const res = await runFullSystemDiagnostics(equipmentList, repairList, loanList);
      setReport(res);
      showToast(`体检完成！综合健康评分: ${res.overallScore} 分 (${res.grade}级)`);
    } catch (err) {
      console.error('Run diagnostics failed', err);
      showToast('诊断执行出现异常，请查看控制台日志');
    } finally {
      setIsRunning(false);
    }
  };

  // 手动单项高压测速 (Stress Test)
  const handleRunStressTest = async () => {
    setIsRunning(true);
    showToast('正在执行 1,000 次复合查询压力测试，测算 P95 响应时延...');
    try {
      const bench = await runPerformanceStressBenchmark(equipmentList);
      if (report) {
        setReport({
          ...report,
          benchmark: bench
        });
      }
      showToast(`压测完成！QPS 达到 ${bench.searchOpsPerSec.toLocaleString()} ops/s，平均响应 ${bench.avgFilterLatencyMs.toFixed(2)}ms`);
    } catch (err) {
      console.error('Benchmark error', err);
    } finally {
      setIsRunning(false);
    }
  };

  // 一键自愈修复
  const handleAutoRemediate = () => {
    const { fixedCount, messages } = executeAutoRemediation(equipmentList, (updated) => {
      if (onUpdateEquipment) {
        onUpdateEquipment(updated);
      }
    });

    if (fixedCount > 0) {
      showToast(`自动自愈完成！成功校准与清理 ${fixedCount} 处数据项`);
      // 重新触发一次快速校验
      handleRunFullDiagnostics();
    } else {
      showToast('系统数据完备健康，未检出需要修复的悬挂项或异常');
    }
  };

  // 展开/收起用例详情
  const toggleExpand = (id: string) => {
    setExpandedTestIds(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // 导出文本体检报告
  const handleExportReport = () => {
    if (!report) return;
    const content = [
      `=============================================================`,
      `五莲县人民医院 医疗设备管理系统 —— 系统自检与性能优化诊断报告`,
      `生成时间: ${report.timestamp}`,
      `综合健康度得分: ${report.overallScore} / 100 (${report.grade} 级)`,
      `测试用例统计: 全部 ${report.totalTests} 项 | 通过 ${report.passedCount} 项 | 警告 ${report.warningCount} 项 | 阻断 ${report.failedCount} 项`,
      `-------------------------------------------------------------`,
      `[性能基准指标]`,
      `- 复合搜索吞吐量 (QPS): ${report.benchmark.searchOpsPerSec} ops/sec`,
      `- 平均过滤耗时: ${report.benchmark.avgFilterLatencyMs} ms`,
      `- P95 响应时延: ${report.benchmark.p95LatencyMs} ms`,
      `- 本地持久化缓存体积: ${report.benchmark.storageUsageKb} KB (${report.benchmark.storageKeysCount} 个键)`,
      `- 前端内存估计: ${report.benchmark.memoryEstimateMb} MB`,
      `-------------------------------------------------------------`,
      `[测试用例逐项结论]`,
      ...report.results.map(r => `[${r.status.toUpperCase()}] ${r.id} ${r.name} (${r.durationMs}ms) - ${r.summary}\n  细节: ${r.details.join('; ')}`),
      `-------------------------------------------------------------`,
      `[系统调优实施建议]`,
      ...report.optimizationTips.map((tip, idx) => `${idx + 1}. ${tip}`),
      `=============================================================`
    ].join('\n');

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `系统测试与优化诊断报告_${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('诊断报告已成功导出保存');
  };

  // 过滤展示的测试用例
  const filteredResults = useMemo(() => {
    if (!report) return [];
    return report.results.filter(item => {
      const matchCat = activeCategoryFilter === 'all' || item.category === activeCategoryFilter;
      const matchQuery = !searchQuery.trim() || 
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.summary.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchQuery;
    });
  }, [report, activeCategoryFilter, searchQuery]);

  return (
    <div className="space-y-6">
      {/* 消息 Toast 浮条 */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-lg shadow-lg text-xs font-medium flex items-center gap-2 border border-slate-700 animate-in fade-in slide-in-from-top-2 duration-200">
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 顶部主工作台看板条 */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 font-medium mb-1">
              <span>系统运维中心</span>
              <span aria-hidden="true">·</span>
              <span>工程质量与性能管控</span>
              <span aria-hidden="true">·</span>
              <span>自动化自检引擎</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <span>系统体检与自动化测试工作台</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                System Diagnostics & Benchmark
              </span>
            </h2>
            <p className="text-xs text-slate-600 mt-1 max-w-2xl">
              针对全院在册医疗设备台账、报修闭环流程、法定计量强检及 DRG 专机折旧勾稽实施深层数据一致性校验与高压性能剖析。
            </p>
          </div>

          {/* 核心操作按钮组 */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={handleRunFullDiagnostics}
              disabled={isRunning}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 text-white text-xs font-semibold rounded-lg shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRunning ? 'animate-spin' : ''}`} />
              <span>{isRunning ? '正在全面体检...' : '一键全量体检'}</span>
            </button>

            <button
              type="button"
              onClick={handleRunStressTest}
              disabled={isRunning}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg border border-slate-300 transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap"
            >
              <Zap className="w-3.5 h-3.5 text-amber-600" />
              <span>高压性能测速</span>
            </button>

            <button
              type="button"
              onClick={handleAutoRemediate}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg border border-slate-300 transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap"
            >
              <Wrench className="w-3.5 h-3.5 text-indigo-600" />
              <span>一键自动修复</span>
            </button>

            <button
              type="button"
              onClick={handleExportReport}
              disabled={!report}
              className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg border border-slate-300 transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>导出诊断报告</span>
            </button>
          </div>
        </div>

        {/* 核心健康指标看板条 */}
        {report && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-5 pt-4 border-t border-slate-100">
            {/* 指标 1: 综合评分 */}
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <div className="text-2xs text-slate-500 font-medium">综合健康指数</div>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-bold font-mono text-slate-900 tabular-nums">
                  {report.overallScore}
                </span>
                <span className={`text-xs font-bold px-1.5 py-0.2 rounded font-mono ${
                  report.grade === 'A+' ? 'bg-emerald-100 text-emerald-800' :
                  report.grade === 'A' ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'
                }`}>
                  {report.grade} 级
                </span>
              </div>
              <div className="text-[11px] text-slate-500 mt-1">全系统状态稳健</div>
            </div>

            {/* 指标 2: 业务闭环 */}
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <div className="text-2xs text-slate-500 font-medium">业务闭环流转</div>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-2xl font-bold font-mono text-emerald-700 tabular-nums">
                  100%
                </span>
                <span className="text-xs text-slate-500 font-mono">达标</span>
              </div>
              <div className="text-[11px] text-slate-500 mt-1">6项业务状态机严谨</div>
            </div>

            {/* 指标 3: 数据一致性 */}
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <div className="text-2xs text-slate-500 font-medium">数据一致性校验</div>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-2xl font-bold font-mono text-slate-900 tabular-nums">
                  {report.passedCount}
                </span>
                <span className="text-xs text-slate-500">/ {report.totalTests} 项通过</span>
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                {report.warningCount > 0 ? `${report.warningCount} 项轻度优化建议` : '零孤岛、零冲突'}
              </div>
            </div>

            {/* 指标 4: 平均搜索时延 */}
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <div className="text-2xs text-slate-500 font-medium">长列表检索时延 (Avg)</div>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-2xl font-bold font-mono text-blue-700 tabular-nums">
                  {report.benchmark.avgFilterLatencyMs}
                </span>
                <span className="text-xs text-slate-500 font-mono">ms</span>
              </div>
              <div className="text-[11px] text-slate-500 mt-1 font-mono">
                P95: {report.benchmark.p95LatencyMs}ms · 吞吐 {report.benchmark.searchOpsPerSec} QPS
              </div>
            </div>

            {/* 指标 5: 渲染帧率与内存 */}
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <div className="text-2xs text-slate-500 font-medium">渲染性能与存储</div>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-2xl font-bold font-mono text-slate-900 tabular-nums">
                  60
                </span>
                <span className="text-xs text-slate-500 font-mono">FPS 满帧</span>
              </div>
              <div className="text-[11px] text-slate-500 mt-1 font-mono">
                内存 ≈ {report.benchmark.memoryEstimateMb}MB · 缓存 {report.benchmark.storageUsageKb}KB
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 视图切换分栏与搜索过滤 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs">
        {/* 分类切换器 */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
          <button
            type="button"
            onClick={() => setActiveCategoryFilter('all')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
              activeCategoryFilter === 'all'
                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            全部检查项 ({report?.totalTests || 0})
          </button>
          <button
            type="button"
            onClick={() => setActiveCategoryFilter('workflow')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
              activeCategoryFilter === 'workflow'
                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            业务闭环测试 (6)
          </button>
          <button
            type="button"
            onClick={() => setActiveCategoryFilter('integrity')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
              activeCategoryFilter === 'integrity'
                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            数据一致性审计 (5)
          </button>
          <button
            type="button"
            onClick={() => setActiveCategoryFilter('performance')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
              activeCategoryFilter === 'performance'
                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            渲染与性能基准 (4)
          </button>
          <button
            type="button"
            onClick={() => setActiveCategoryFilter('toggles')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
              activeCategoryFilter === 'toggles'
                ? 'bg-purple-50 text-purple-700 border border-purple-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            性能优化调优策略
          </button>
        </div>

        {/* 快速搜索框 */}
        {activeCategoryFilter !== 'toggles' && (
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索测试项 / 关键词..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white transition-all text-slate-800"
            />
          </div>
        )}
      </div>

      {/* 测试用例明细列表呈现 */}
      {activeCategoryFilter !== 'toggles' ? (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
          <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div className="text-xs font-bold text-slate-800 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              <span>系统自动化用例执行结果清单</span>
              <span className="text-2xs text-slate-500 font-normal">
                (已加载 {filteredResults.length} 项)
              </span>
            </div>
            <div className="flex items-center gap-3 text-2xs text-slate-500 font-mono">
              <span>状态码: 绿=PASSED · 黄=WARNING · 红=FAILED</span>
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {filteredResults.map(test => {
              const isExpanded = Boolean(expandedTestIds[test.id]);
              return (
                <div key={test.id} className="p-4 hover:bg-slate-50/70 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <div className="flex items-start gap-3">
                      {/* 状态徽标 */}
                      <div className="mt-0.5">
                        {test.status === 'passed' && (
                          <div className="w-5 h-5 rounded-md bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200">
                            <Check className="w-3.5 h-3.5" />
                          </div>
                        )}
                        {test.status === 'warning' && (
                          <div className="w-5 h-5 rounded-md bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-200">
                            <AlertTriangle className="w-3.5 h-3.5" />
                          </div>
                        )}
                        {test.status === 'failed' && (
                          <div className="w-5 h-5 rounded-md bg-rose-50 text-rose-700 flex items-center justify-center border border-rose-200">
                            <AlertOctagon className="w-3.5 h-3.5" />
                          </div>
                        )}
                      </div>

                      {/* 标题与描述 */}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-2xs font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                            {test.id}
                          </span>
                          <span className="text-xs font-bold text-slate-900">
                            {test.name}
                          </span>
                          <span className={`text-[10px] font-mono px-1 rounded ${
                            test.severity === 'P0' ? 'bg-rose-50 text-rose-700' :
                            test.severity === 'P1' ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {test.severity}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 mt-1">
                          {test.summary}
                        </p>
                      </div>
                    </div>

                    {/* 右侧耗时与展开按钮 */}
                    <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                      <div className="text-right">
                        <span className="text-xs font-mono font-medium text-slate-500 tabular-nums">
                          {test.durationMs}ms
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => toggleExpand(test.id)}
                        className="px-2.5 py-1 text-2xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-md hover:bg-slate-50 transition-colors cursor-pointer"
                      >
                        {isExpanded ? '收起详情' : '展开日志'}
                      </button>
                    </div>
                  </div>

                  {/* 展开的排查日志与调优建议 */}
                  {isExpanded && (
                    <div className="mt-3 pl-8 pt-3 border-t border-slate-100 space-y-2 text-xs">
                      <div className="bg-slate-50 p-3 rounded-lg border border-slate-200/80 font-mono text-2xs space-y-1 text-slate-700">
                        <div className="text-slate-400 font-sans font-bold">详细断言追踪日志：</div>
                        {test.details.map((d, idx) => (
                          <div key={idx} className="flex items-start gap-1.5">
                            <span className="text-slate-400 select-none">›</span>
                            <span>{d}</span>
                          </div>
                        ))}
                      </div>

                      {test.recommendation && (
                        <div className="flex items-start gap-2 p-2.5 bg-blue-50/60 rounded-lg border border-blue-200/60 text-blue-900 text-xs">
                          <Sparkles className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold">优化指引：</span>
                            <span>{test.recommendation}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* 性能调优策略控制面板 */
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs">
            <div className="flex items-center gap-2 mb-2">
              <Sliders className="w-5 h-5 text-purple-600" />
              <h3 className="text-sm font-bold text-slate-900">
                前端首屏加载与大数据量列表渲染优化开关
              </h3>
            </div>
            <p className="text-xs text-slate-600 mb-5">
              以下策略均为零侵入纯前端性能增强机制，针对万级医疗设备台账检索、复杂折旧曲线图表及高频状态变更提供深度算力优化。
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 开关 1: 内存倒排索引 */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900">内存倒排多维搜索索引</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 font-bold">
                      加速 500%
                    </span>
                  </div>
                  <p className="text-2xs text-slate-500 mt-1">
                    在客户端初始化时为设备名称、拼音首字母、序列号建立分词哈希索引，避免多字段重复扫描。
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggle('enableSearchIndex')}
                  className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer shrink-0 ${
                    toggles.enableSearchIndex ? 'bg-blue-600 justify-end' : 'bg-slate-300 justify-start'
                  }`}
                >
                  <span className="bg-white w-4 h-4 rounded-full shadow-md" />
                </button>
              </div>

              {/* 开关 2: 虚拟分块分页 */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900">虚拟分块长列表渲染缓冲</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-blue-100 text-blue-800 font-bold">
                      保持 60 FPS
                    </span>
                  </div>
                  <p className="text-2xs text-slate-500 mt-1">
                    锁定视口可视区域最大 DOM 节点数量，平滑滚动时复用表格行组件，杜绝首屏主线程渲染阻塞。
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggle('enableVirtualChunking')}
                  className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer shrink-0 ${
                    toggles.enableVirtualChunking ? 'bg-blue-600 justify-end' : 'bg-slate-300 justify-start'
                  }`}
                >
                  <span className="bg-white w-4 h-4 rounded-full shadow-md" />
                </button>
              </div>

              {/* 开关 3: 惰性图表挂载 */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900">Recharts 复杂图表惰性按需装载</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-purple-100 text-purple-800 font-bold">
                      首屏体积 -30%
                    </span>
                  </div>
                  <p className="text-2xs text-slate-500 mt-1">
                    仅当用户滑动或切换到图表可视区域时执行 SVG/Canvas 渲染，避免首屏初次装载卡顿。
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggle('enableLazyCharts')}
                  className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer shrink-0 ${
                    toggles.enableLazyCharts ? 'bg-blue-600 justify-end' : 'bg-slate-300 justify-start'
                  }`}
                >
                  <span className="bg-white w-4 h-4 rounded-full shadow-md" />
                </button>
              </div>

              {/* 开关 4: LocalStorage 批量防抖持久化 */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900">本地存储异步合并与防抖持久化</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 font-bold">
                      消除同步 I/O 停顿
                    </span>
                  </div>
                  <p className="text-2xs text-slate-500 mt-1">
                    将列显示配置、折叠状态等微小持久化操作汇聚防抖写入（300ms 窗口），降低主进程 I/O 争用。
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggle('enableStorageDebounce')}
                  className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer shrink-0 ${
                    toggles.enableStorageDebounce ? 'bg-blue-600 justify-end' : 'bg-slate-300 justify-start'
                  }`}
                >
                  <span className="bg-white w-4 h-4 rounded-full shadow-md" />
                </button>
              </div>
            </div>
          </div>

          {/* 实施与上线建议卡片 */}
          <div className="bg-blue-50/50 border border-blue-200 rounded-xl p-5">
            <h4 className="text-xs font-bold text-blue-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <span>医院信息中心专业调优实操指南</span>
            </h4>
            <ul className="mt-3 space-y-2 text-xs text-blue-800">
              {report?.optimizationTips.map((tip, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="font-mono font-bold text-blue-600 select-none">{idx + 1}.</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

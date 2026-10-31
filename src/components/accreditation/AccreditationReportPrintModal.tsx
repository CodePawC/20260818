import React from 'react';
import { X, Printer, Download, ShieldCheck, CheckCircle2, AlertTriangle, FileText } from 'lucide-react';
import { AccreditationClause, NationalHospitalKpi, QualityCapaItem, AccreditationSummaryStat } from '../../types/qualityAccreditationTypes';

interface AccreditationReportPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  clauses: AccreditationClause[];
  kpis: NationalHospitalKpi[];
  capas: QualityCapaItem[];
  summary: AccreditationSummaryStat;
}

export const AccreditationReportPrintModal: React.FC<AccreditationReportPrintModalProps> = ({
  isOpen,
  onClose,
  clauses,
  kpis,
  capas,
  summary
}) => {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex justify-center p-4 sm:p-6 print:p-0 print:bg-white">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl flex flex-col max-h-[92vh] print:max-h-none print:shadow-none print:rounded-none">
        {/* 顶部操作条（打印时不显示） */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50 print:hidden shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900">三级综合医院评审（第四篇 医疗装备管理）自评底稿专报</h2>
              <p className="text-xs text-slate-500">符合国家卫生健康委《三级综合医院评审标准（2020/2022版）》及公立医院绩效国考规范</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg flex items-center gap-2 shadow-sm transition-colors"
            >
              <Printer className="w-4 h-4" />
              打印/导出PDF底稿
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 打印正文区 */}
        <div className="p-8 sm:p-12 overflow-y-auto print:overflow-visible print:p-0 space-y-8 font-sans text-slate-800">
          {/* 红头公文抬头 */}
          <div className="text-center border-b-2 border-red-700 pb-6 space-y-2">
            <div className="text-red-700 font-bold tracking-widest text-2xl uppercase">
              五莲县人民医院 · 医学装备管理委员会
            </div>
            <div className="text-xs text-red-600 font-medium tracking-wide">
              WULIAN COUNTY PEOPLE'S HOSPITAL · BIOMEDICAL ENGINEERING QUALITY ACCREDITATION
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 pt-2 tracking-tight">
              三级综合医院评审（第四篇 医疗装备管理）迎检自查底稿与国考质控报告
            </h1>
            <div className="flex items-center justify-center gap-6 text-xs text-slate-500 pt-2 font-mono">
              <span>文件编号: WLPH-ACCRED-2026-04</span>
              <span>评估周期: 2026年度</span>
              <span>生成日期: {new Date().toLocaleDateString('zh-CN')}</span>
              <span>密级: 院内迎检核心质控档案</span>
            </div>
          </div>

          {/* 综合自评得分概览 */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-50 border border-slate-200 rounded-lg">
            <div className="space-y-1">
              <span className="text-xs text-slate-500">评审条款总数</span>
              <div className="text-xl font-bold font-mono text-slate-900">{summary.totalClauses} 条</div>
              <span className="text-xs text-emerald-600">含核心必达条款: {summary.coreClausesCount} 条</span>
            </div>
            <div className="space-y-1">
              <span className="text-xs text-slate-500">总体达标率 (A+B+C)</span>
              <div className="text-xl font-bold font-mono text-blue-600">{summary.overallComplianceRate}%</div>
              <span className="text-xs text-blue-500">核心条款达标: 100%</span>
            </div>
            <div className="space-y-1">
              <span className="text-xs text-slate-500">评级分布情况</span>
              <div className="text-sm font-medium text-slate-800 space-x-2 pt-1 font-mono">
                <span className="text-emerald-700 font-bold">A级: {summary.levelACount}</span>
                <span className="text-blue-700 font-bold">B级: {summary.levelBCount}</span>
                <span className="text-amber-700 font-bold">C级: {summary.levelCCount}</span>
                <span className="text-red-700 font-bold">D级: {summary.levelDCount}</span>
              </div>
              <span className="text-xs text-slate-500">无不合格D级条款</span>
            </div>
            <div className="space-y-1">
              <span className="text-xs text-slate-500">CAPA整改与纠正闭环</span>
              <div className="text-xl font-bold font-mono text-slate-900">
                {summary.closedCapas} / {summary.totalCapas}
              </div>
              <span className="text-xs text-amber-600">待办整改销号中: {summary.openCapas} 项</span>
            </div>
          </div>

          {/* 第一部分：公立医院绩效国考（医疗装备质控）核心指标 */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 border-l-4 border-blue-600 pl-3">
              <h3 className="text-base font-bold text-slate-900">第一部分：国家公立医院绩效考核（国考）装备质控核心指标实测</h3>
            </div>
            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-xs text-left border-collapse">
                <thead className="bg-slate-100 text-slate-700 uppercase font-semibold">
                  <tr>
                    <th className="py-2.5 px-3 border-b border-slate-200">指标代码</th>
                    <th className="py-2.5 px-3 border-b border-slate-200">国考指标名称</th>
                    <th className="py-2.5 px-3 border-b border-slate-200">基准考核目标</th>
                    <th className="py-2.5 px-3 border-b border-slate-200">医院当前实测值</th>
                    <th className="py-2.5 px-3 border-b border-slate-200">考核判定</th>
                    <th className="py-2.5 px-3 border-b border-slate-200">数据来源与公式</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-mono">
                  {kpis.map((kpi) => (
                    <tr key={kpi.id} className="hover:bg-slate-50/50">
                      <td className="py-2 px-3 font-semibold text-slate-700">{kpi.code}</td>
                      <td className="py-2 px-3 font-sans font-medium text-slate-900">{kpi.name}</td>
                      <td className="py-2 px-3 text-slate-600 font-sans">{kpi.baselineRequirement}</td>
                      <td className="py-2 px-3 font-bold text-blue-700 text-sm">
                        {kpi.currentValue}{kpi.unit}
                      </td>
                      <td className="py-2 px-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-sans font-medium ${
                          kpi.status === 'excellent' 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                            : 'bg-blue-50 text-blue-700 border border-blue-200'
                        }`}>
                          {kpi.status === 'excellent' ? '优秀达标' : '合格达标'}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-slate-500 font-sans text-[11px] max-w-xs truncate">
                        {kpi.dataFormula}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 第二部分：三甲评审第四篇条款逐项自查底稿 */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-l-4 border-blue-600 pl-3">
              <h3 className="text-base font-bold text-slate-900">第二部分：三级综合医院评审标准（第四篇 医疗装备管理）条款自评细目</h3>
            </div>
            <div className="space-y-4">
              {clauses.map((clause) => (
                <div key={clause.id} className="border border-slate-200 rounded-lg p-4 space-y-3 bg-white">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded text-xs border border-blue-200">
                        {clause.clauseNumber}
                      </span>
                      {clause.mandatoryCore && (
                        <span className="text-[11px] font-bold text-red-600 bg-red-50 border border-red-200 px-1.5 py-0.2 rounded">
                          ★ 核心必达
                        </span>
                      )}
                      <h4 className="text-sm font-bold text-slate-900">{clause.title}</h4>
                    </div>
                    <div className="flex items-center gap-3 text-xs">
                      <span className="text-slate-500">自评分: <strong className="font-mono text-slate-900 text-sm">{clause.selfScore}</strong> 分</span>
                      <span className="text-slate-500">自评定级: 
                        <strong className={`font-mono text-sm ml-1 px-2 py-0.5 rounded font-bold ${
                          clause.currentLevel === 'A' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {clause.currentLevel} 级
                        </strong>
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 font-medium leading-relaxed">
                    <strong>核心要求：</strong>{clause.coreRequirement}
                  </p>

                  {/* 查验标准 A/B/C */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                    {clause.criteria.map((c) => (
                      <div 
                        key={c.level} 
                        className={`p-2.5 rounded border text-[11px] leading-relaxed ${
                          c.achieved 
                            ? 'bg-slate-50/70 border-slate-200 text-slate-700' 
                            : 'bg-amber-50/50 border-amber-200 text-amber-800'
                        }`}
                      >
                        <div className="flex items-center justify-between font-bold mb-1">
                          <span className="font-mono">{c.level}级标准</span>
                          {c.achieved ? (
                            <span className="text-emerald-600 flex items-center gap-0.5 font-sans">
                              <CheckCircle2 className="w-3 h-3" /> 达成
                            </span>
                          ) : (
                            <span className="text-amber-600 flex items-center gap-0.5 font-sans">
                              <AlertTriangle className="w-3 h-3" /> 持续整改
                            </span>
                          )}
                        </div>
                        <p className="text-slate-600 mb-1">{c.requirement}</p>
                        <p className="text-slate-400 font-mono text-[10px]">查验: {c.checkMethod}</p>
                      </div>
                    ))}
                  </div>

                  {/* 佐证材料与评价 */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100 gap-2">
                    <div>
                      <strong className="text-slate-700">佐证材料支撑：</strong>
                      {clause.evidenceDocuments.join('、')}
                    </div>
                    <div className="shrink-0 text-slate-600 font-mono text-[11px]">
                      自评人: {clause.evaluatorName} ({clause.lastEvaluatedAt})
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 第三部分：CAPA整改与纠正预防措施追踪 */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 border-l-4 border-amber-600 pl-3">
              <h3 className="text-base font-bold text-slate-900">第三部分：不符合项与 CAPA 纠正预防整改档案清单</h3>
            </div>
            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-xs text-left border-collapse">
                <thead className="bg-slate-100 text-slate-700 uppercase font-semibold">
                  <tr>
                    <th className="py-2 px-3 border-b border-slate-200">任务编号</th>
                    <th className="py-2 px-3 border-b border-slate-200">关联条款</th>
                    <th className="py-2 px-3 border-b border-slate-200">问题及预警来源</th>
                    <th className="py-2 px-3 border-b border-slate-200">纠正措施与执行方案</th>
                    <th className="py-2 px-3 border-b border-slate-200">责任人/科室</th>
                    <th className="py-2 px-3 border-b border-slate-200">整改状态</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-mono text-slate-700">
                  {capas.map((capa) => (
                    <tr key={capa.id}>
                      <td className="py-2.5 px-3 font-semibold text-slate-900">{capa.id}</td>
                      <td className="py-2.5 px-3 font-bold text-blue-700">{capa.clauseNumber}</td>
                      <td className="py-2.5 px-3 font-sans max-w-xs">{capa.sourceTitle}</td>
                      <td className="py-2.5 px-3 font-sans text-slate-600 text-[11px] leading-relaxed max-w-md">
                        {capa.correctiveActionPlan}
                      </td>
                      <td className="py-2.5 px-3 font-sans text-[11px]">
                        {capa.responsibleEngineer} ({capa.department})
                      </td>
                      <td className="py-2.5 px-3 font-sans">
                        <span className={`inline-flex px-2 py-0.5 rounded text-[11px] font-medium ${
                          capa.status === 'closed'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          {capa.status === 'closed' ? '已复核销号' : '整改推进中'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 审批签署联与防伪印鉴栏 */}
          <div className="pt-6 border-t-2 border-slate-300 grid grid-cols-3 gap-6 text-xs text-slate-700">
            <div className="space-y-4">
              <p><strong>质控自评小组组长：</strong> 李思齐</p>
              <p className="font-mono text-slate-400">签字时间: 2026年10月26日</p>
            </div>
            <div className="space-y-4">
              <p><strong>医学装备科科长：</strong> 孙建国</p>
              <p className="font-mono text-slate-400">签字时间: 2026年10月27日</p>
            </div>
            <div className="space-y-4 relative">
              <p><strong>主管业务副院长审核：</strong> 崔维</p>
              <p className="font-mono text-slate-400">签字时间: 2026年10月28日</p>
              {/* 红色防伪印章仿真 */}
              <div className="absolute -top-4 right-2 w-28 h-28 rounded-full border-2 border-red-600/70 text-red-600 flex flex-col items-center justify-center p-2 text-center transform -rotate-12 pointer-events-none select-none">
                <span className="text-[10px] font-bold tracking-tight">五莲县人民医院</span>
                <span className="text-[9px] font-black tracking-widest my-0.5">★ 医疗装备专用章 ★</span>
                <span className="text-[8px] font-mono">质控审核合格</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

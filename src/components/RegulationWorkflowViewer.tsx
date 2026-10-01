import React, { useState } from 'react';
import { 
  GitCommit, 
  Clock, 
  ShieldCheck, 
  FileCheck, 
  Printer, 
  ArrowRight, 
  ChevronRight, 
  AlertTriangle, 
  FileText, 
  Building2, 
  Users, 
  Sparkles, 
  Download, 
  CheckCircle2, 
  ExternalLink,
  Layers,
  ArrowUpRight,
  HelpCircle,
  Eye,
  FileSpreadsheet
} from 'lucide-react';
import { 
  RegulationItem, 
  RegulationWorkflow, 
  WorkflowStep, 
  RegulationFormTemplate 
} from '../types/regulationTypes';
import { 
  getRegulationWorkflow, 
  getRegulationFormTemplates 
} from '../utils/regulationWorkflowPresets';
import { ActiveTab } from '../types';

interface RegulationWorkflowViewerProps {
  regulation: RegulationItem;
  onNavigateToTab?: (tab: ActiveTab) => void;
  showToast?: (message: string) => void;
}

export const RegulationWorkflowViewer: React.FC<RegulationWorkflowViewerProps> = ({
  regulation,
  onNavigateToTab,
  showToast
}) => {
  // 获取当前制度对应的标准 SOP 工作流
  const workflow = getRegulationWorkflow(regulation);
  const formTemplates = regulation.formTemplates || getRegulationFormTemplates(regulation.category);

  // 视图子模式: 'stepper' (图形流转图) | 'matrix' (责任矩阵详表) | 'forms' (配套表单库)
  const [subTab, setSubTab] = useState<'stepper' | 'matrix' | 'forms'>('stepper');

  // 当前高亮选中的流程节点 (用于侧边卡片高亮或聚焦)
  const [selectedStepNumber, setSelectedStepNumber] = useState<number>(1);

  // 角色过滤器
  const [roleFilter, setRoleFilter] = useState<string>('all');

  // 提取全部角色列表
  const uniqueRoles = Array.from(new Set(workflow.steps.map(s => s.role.split('/')[0].trim())));

  // 过滤后的步骤
  const displayedSteps = roleFilter === 'all' 
    ? workflow.steps 
    : workflow.steps.filter(s => s.role.includes(roleFilter));

  // 打印 SOP 流程图公文
  const handlePrintWorkflow = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      if (showToast) showToast('请允许浏览器弹出窗口以打印配套业务流程图');
      return;
    }

    const stepsHtml = workflow.steps.map(step => `
      <div style="margin-bottom: 20px; padding: 16px; border: 1px solid #ccc; border-radius: 8px; background: #fafafa;">
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #eee; padding-bottom: 8px; margin-bottom: 8px;">
          <strong style="font-size: 16px; color: #1e3a8a;">第 ${step.stepNumber} 环节：${step.title}</strong>
          <span style="font-size: 13px; background: #e0e7ff; color: #3730a3; padding: 3px 8px; border-radius: 4px;">责任人：${step.role}</span>
          ${step.slaTime ? `<span style="font-size: 13px; color: #b45309; font-weight: bold;">时限: ${step.slaTime}</span>` : ''}
        </div>
        <p style="font-size: 14px; color: #333; line-height: 1.6; margin: 8px 0;"><strong>【操作指引】</strong>${step.actionDescription}</p>
        ${step.deliverables ? `<p style="font-size: 13px; color: #047857; margin: 4px 0;"><strong>【产出凭据】</strong>${step.deliverables}</p>` : ''}
        ${step.riskControlPoint ? `<p style="font-size: 13px; color: #b91c1c; margin: 4px 0;"><strong>【质控红线】</strong>${step.riskControlPoint}</p>` : ''}
      </div>
    `).join('');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${workflow.workflowName} - 标准流程图</title>
          <style>
            body { font-family: "SimSun", "STSong", -apple-system, sans-serif; padding: 40px; color: #111; line-height: 1.6; }
            .header { text-align: center; border-bottom: 2px solid #1e3a8a; padding-bottom: 15px; margin-bottom: 20px; }
            .title { font-size: 24px; font-weight: bold; color: #1e3a8a; margin: 0 0 10px 0; }
            .meta { font-size: 13px; color: #666; display: flex; justify-content: space-between; margin-top: 10px; }
            .purpose { background: #f0fdf4; border-left: 4px solid #16a34a; padding: 12px; margin-bottom: 25px; font-size: 14px; }
            .footer { margin-top: 40px; border-top: 1px dashed #999; padding-top: 15px; font-size: 12px; display: flex; justify-content: space-between; color: #666; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1 class="title">五莲县人民医院 · 医学装备标准操作规程 (SOP) 流程图</h1>
            <p style="font-size: 18px; font-weight: bold; color: #333; margin: 5px 0;">《${workflow.workflowName}》</p>
            <div class="meta">
              <span>流程编码：${workflow.workflowCode}</span>
              <span>关联制度：${regulation.title}</span>
              <span>执行周期：${workflow.cycleTime}</span>
            </div>
          </div>
          <div class="purpose">
            <strong>【流程管控目标】</strong>${workflow.purpose}<br/>
            <strong>【触发启动条件】</strong>${workflow.triggerCondition}
          </div>
          <div class="content">
            ${stepsHtml}
          </div>
          ${workflow.emergencyException ? `
            <div style="background: #fffbeb; border: 1px solid #fde68a; padding: 12px; border-radius: 6px; margin-top: 20px; font-size: 13px; color: #92400e;">
              <strong>【绿色通道及例外条款】</strong>${workflow.emergencyException}
            </div>
          ` : ''}
          <div class="footer">
            <span>负责部门：五莲县人民医院 医学工程保障中心</span>
            <span>评审标准：符合三级综合医院评审标准 (2022版) 4.15 章节</span>
            <span>打印日期：${new Date().toLocaleDateString('zh-CN')}</span>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  // 模拟下载表单模版
  const handleDownloadTemplate = (template: RegulationFormTemplate) => {
    if (showToast) {
      showToast(`已开始下载标准表单模版: ${template.name}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* 顶部流程概览卡片 */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
        {/* 背景轻微装饰波纹 */}
        <div className="absolute right-0 top-0 bottom-0 w-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/15">
            <div className="flex items-center gap-2.5">
              <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-lg bg-blue-500/30 border border-blue-400/40 text-blue-200">
                {workflow.workflowCode}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                三甲评审闭环流转标准SOP
              </span>
              <span className="text-xs text-slate-300 hidden md:inline">
                共 <strong className="text-white font-bold">{workflow.steps.length}</strong> 个责任执行环节
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrintWorkflow}
                className="px-3 py-1.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-xs font-semibold text-white flex items-center gap-1.5 transition-colors shadow-2xs"
                title="打印本制度配套的 SOP 流程卡用于病区与机房张贴"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>打印SOP流程卡</span>
              </button>
            </div>
          </div>

          <div className="mt-4">
            <h2 className="text-lg sm:text-xl font-bold text-white tracking-wide flex items-center gap-2">
              <GitCommit className="w-5 h-5 text-blue-400" />
              <span>{workflow.workflowName}</span>
            </h2>
            <p className="text-xs text-blue-100/90 mt-1.5 leading-relaxed">
              <strong>【流程目标】</strong>{workflow.purpose}
            </p>
          </div>

          {/* 流转条件与时效指标 */}
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-white/10 text-xs">
            <div className="flex items-start gap-2 text-slate-300">
              <span className="font-semibold text-white shrink-0">启动触发条件：</span>
              <span>{workflow.triggerCondition}</span>
            </div>
            <div className="flex items-start gap-2 text-slate-300">
              <Clock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span className="font-semibold text-white shrink-0">基准流转时限：</span>
              <span className="text-amber-300 font-semibold">{workflow.cycleTime}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 流程模式与角色筛选切换栏 */}
      <div className="bg-white rounded-xl border border-slate-200 p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
        {/* 子视图切换 */}
        <div className="bg-slate-100 p-1 rounded-xl flex items-center border border-slate-200/80 text-xs overflow-x-auto max-w-full">
          <button
            type="button"
            onClick={() => setSubTab('stepper')}
            className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all ${
              subTab === 'stepper'
                ? 'bg-white text-blue-700 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <GitCommit className="w-3.5 h-3.5" />
            <span>可视流转图 (流程树)</span>
          </button>
          <button
            type="button"
            onClick={() => setSubTab('matrix')}
            className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all ${
              subTab === 'matrix'
                ? 'bg-white text-blue-700 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>岗位责任矩阵 (SOP详表)</span>
          </button>
          <button
            type="button"
            onClick={() => setSubTab('forms')}
            className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all ${
              subTab === 'forms'
                ? 'bg-white text-blue-700 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>配套留痕表单 ({formTemplates.length})</span>
          </button>
        </div>

        {/* 责任角色快速过滤 */}
        {subTab !== 'forms' && (
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500 font-medium shrink-0 flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-slate-400" />
              <span>责任岗位筛选:</span>
            </span>
            <select
              value={roleFilter}
              onChange={e => setRoleFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg font-medium text-slate-800 focus:ring-2 focus:ring-blue-500 text-xs"
            >
              <option value="all">全流程责任链 ({workflow.steps.length}个环节)</option>
              {uniqueRoles.map(role => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* ================= 模式 1: 交互式纵向/横向流程树 ================= */}
      {subTab === 'stepper' && (
        <div className="space-y-4">
          <div className="relative pl-6 sm:pl-8 space-y-6 before:content-[''] before:absolute before:left-3 sm:before:left-4 before:top-4 before:bottom-4 before:w-0.5 before:bg-gradient-to-b before:from-blue-600 before:via-indigo-500 before:to-emerald-500">
            {displayedSteps.map((step) => {
              const isSelected = selectedStepNumber === step.stepNumber;
              return (
                <div 
                  key={step.stepNumber}
                  onClick={() => setSelectedStepNumber(step.stepNumber)}
                  className={`relative bg-white rounded-2xl border transition-all p-5 shadow-2xs cursor-pointer ${
                    isSelected 
                      ? 'border-blue-500 ring-2 ring-blue-500/20 shadow-md' 
                      : 'border-slate-200 hover:border-blue-300 hover:shadow-xs'
                  }`}
                >
                  {/* 左侧节点圆形序号标 */}
                  <div className={`absolute -left-6 sm:-left-8 top-5 w-6 sm:w-8 h-6 sm:h-8 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm border-2 transition-transform ${
                    isSelected 
                      ? 'bg-blue-600 border-white text-white scale-110 shadow-sm' 
                      : 'bg-white border-blue-600 text-blue-700'
                  }`}>
                    {step.stepNumber}
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                          环节 0{step.stepNumber}
                        </span>
                        <h3 className="text-sm font-bold text-slate-900">
                          {step.title}
                        </h3>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-semibold px-2.5 py-0.5 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center gap-1">
                        <Users className="w-3 h-3 text-indigo-500" />
                        <span>责任岗位：{step.role}</span>
                      </span>
                      {step.slaTime && (
                        <span className="text-xs font-bold px-2.5 py-0.5 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-amber-600" />
                          <span>时限：{step.slaTime}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* 具体操作指引 */}
                  <div className="mt-3.5 text-xs text-slate-700 leading-relaxed bg-slate-50/70 p-3 rounded-xl border border-slate-100">
                    <p className="font-semibold text-slate-900 mb-1 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                      <span>标准作业规程指引 (SOP Action):</span>
                    </p>
                    <p>{step.actionDescription}</p>
                  </div>

                  {/* 产出凭证与合规红线 */}
                  <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    {step.deliverables && (
                      <div className="p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-xl text-emerald-900">
                        <div className="font-bold flex items-center gap-1.5 mb-1 text-emerald-800">
                          <FileCheck className="w-4 h-4 text-emerald-600" />
                          <span>产出交付物 / 留痕表单:</span>
                        </div>
                        <p className="text-[11px] text-emerald-700 leading-relaxed font-medium">
                          {step.deliverables}
                        </p>
                      </div>
                    )}

                    {step.riskControlPoint && (
                      <div className="p-3 bg-rose-50/70 border border-rose-200/80 rounded-xl text-rose-900">
                        <div className="font-bold flex items-center gap-1.5 mb-1 text-rose-800">
                          <AlertTriangle className="w-4 h-4 text-rose-600" />
                          <span>质控重点 / 合规红线:</span>
                        </div>
                        <p className="text-[11px] text-rose-700 leading-relaxed">
                          {step.riskControlPoint}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* 步骤关联的系统业务直通操作 */}
                  {step.systemAction && onNavigateToTab && (
                    <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[11px] text-slate-400 flex items-center gap-1">
                        <ArrowUpRight className="w-3 h-3 text-blue-500" />
                        <span>已对接系统业务功能模块，支持在线实时流转与协同闭环</span>
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onNavigateToTab(step.systemAction!.tab);
                        }}
                        className="px-3 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs"
                        title={step.systemAction.tooltip}
                      >
                        <span>{step.systemAction.label}</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* 绿色通道 / 应急例外提示 */}
          {workflow.emergencyException && (
            <div className="p-4 bg-amber-50/90 border border-amber-200 rounded-2xl flex items-start gap-3 text-xs text-amber-900">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-amber-950 mb-0.5">
                  绿色通道与特殊例外处置规程 (Emergency Exception)
                </h4>
                <p className="text-amber-800 leading-relaxed">
                  {workflow.emergencyException}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ================= 模式 2: 岗位责任矩阵 SOP 详表 ================= */}
      {subTab === 'matrix' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
          <div className="overflow-x-auto w-full">
            <table className="w-full min-w-[760px] text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
                <tr>
                  <th className="py-3 px-4 w-16 text-center">环节</th>
                  <th className="py-3 px-4 w-44">环节名称与目标</th>
                  <th className="py-3 px-4 w-40">主责岗位 / 协同主体</th>
                  <th className="py-3 px-4 w-28">标准时限 (SLA)</th>
                  <th className="py-3 px-4">标准操作细则与质控红线</th>
                  <th className="py-3 px-4 w-44">交付物与凭证</th>
                  <th className="py-3 px-4 w-28 text-center">系统直通</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {displayedSteps.map(step => (
                  <tr key={step.stepNumber} className="hover:bg-blue-50/40 transition-colors">
                    <td className="py-3 px-4 text-center font-bold font-mono text-blue-700">
                      0{step.stepNumber}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {step.title}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-semibold border border-indigo-200/80 inline-block text-[11px]">
                        {step.role}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-amber-800">
                      {step.slaTime || '按时序执行'}
                    </td>
                    <td className="py-3 px-4">
                      <p className="leading-relaxed">{step.actionDescription}</p>
                      {step.riskControlPoint && (
                        <p className="text-[11px] text-rose-600 mt-1 font-medium flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3 shrink-0" />
                          <span>红线: {step.riskControlPoint}</span>
                        </p>
                      )}
                    </td>
                    <td className="py-3 px-4 text-emerald-800 font-medium text-[11px]">
                      {step.deliverables || '—'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {step.systemAction && onNavigateToTab ? (
                        <button
                          type="button"
                          onClick={() => onNavigateToTab(step.systemAction!.tab)}
                          className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[11px] font-bold transition-colors shadow-2xs"
                        >
                          办理
                        </button>
                      ) : (
                        <span className="text-slate-400 text-[11px]">线下留痕</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= 模式 3: 配套执行表单库 ================= */}
      {subTab === 'forms' && (
        <div className="space-y-4">
          <div className="p-4 bg-emerald-50/80 border border-emerald-200 rounded-2xl flex items-center justify-between gap-3 text-xs text-emerald-950">
            <div className="flex items-center gap-2.5">
              <FileCheck className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <p className="font-bold">
                  三甲综合医院评审核心要求：制度与落地表单 100% 对应互证
                </p>
                <p className="text-emerald-800 text-[11px] mt-0.5">
                  所有业务环节均配备标准制式凭证，支持一键下载电子模版并在现场检查时即刻调取纸质归档联单
                </p>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-bold text-xs shrink-0 shadow-2xs">
              法定留痕档案
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {formTemplates.map((template) => (
              <div
                key={template.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs hover:border-emerald-300 hover:shadow-xs transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                      {template.formCode}
                    </span>
                    {template.isMandatoryForAccreditation && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                        三甲现场查验必查
                      </span>
                    )}
                  </div>

                  <h4 className="text-xs font-bold text-slate-900 leading-snug">
                    {template.name}
                  </h4>

                  <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">
                    {template.description}
                  </p>

                  <div className="mt-3 pt-2 border-t border-slate-100 text-[11px] text-slate-400">
                    <span>主填/归档部门：{template.department}</span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">
                    标准空白制式表单 (Word/Excel)
                  </span>
                  <button
                    type="button"
                    onClick={() => handleDownloadTemplate(template)}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 flex items-center gap-1.5 transition-colors shadow-2xs"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>下载模版</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 底部评审标准专业背书说明 */}
      <div className="p-4 bg-slate-50 border border-slate-200/90 rounded-2xl flex items-center justify-between gap-3 text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
          <span>
            本配套流程严格遵循<strong>《三级综合医院评审标准实施细则》</strong>第四章“医疗器械安全与临床质量”指标体系构建，形成<strong>“制度立规 - 流程导引 - 表单凭据 - 系统闭环”</strong>四维一体管理格局。
          </span>
        </div>
      </div>
    </div>
  );
};

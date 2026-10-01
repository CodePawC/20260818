import React, { useState } from 'react';
import { 
  X, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  ShieldCheck, 
  FileText, 
  UserCheck, 
  Printer, 
  RotateCcw, 
  ChevronRight, 
  ExternalLink,
  History,
  Building2,
  DollarSign,
  Activity,
  Send,
  Eye,
  Camera,
  Layers,
  Sparkles
} from 'lucide-react';
import { ClosedLoopRepairTask } from '../../types/closedLoopRepairTypes';
import { AuthUser } from '../../types';

interface TaskProgressDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: ClosedLoopRepairTask | null;
  currentUser: AuthUser | null;
  onOpenVerification?: (task: ClosedLoopRepairTask) => void;
  onOpenDraft?: (task: ClosedLoopRepairTask) => void;
  onOpenApproval?: (task: ClosedLoopRepairTask) => void;
  onOpenPrint?: (task: ClosedLoopRepairTask) => void;
  onOpenWorkflowWorkspace?: () => void;
}

export const TaskProgressDetailModal: React.FC<TaskProgressDetailModalProps> = ({
  isOpen,
  onClose,
  task,
  currentUser,
  onOpenVerification,
  onOpenDraft,
  onOpenApproval,
  onOpenPrint,
  onOpenWorkflowWorkspace
}) => {
  if (!isOpen || !task) return null;

  const [activeTab, setActiveTab] = useState<'progress' | 'technical' | 'approval' | 'timeline'>('progress');

  const app = task.factoryRepairApplication;
  const ver = task.onsiteVerification;

  const isReported = task.stage === 'reported';
  const isVerified = task.stage === 'verified';
  const isApproving = task.stage === 'return_drafted' || task.stage === 'dept_reviewed';
  const isApproved = task.stage === 'vp_approved' || app?.finalApprovalStatus === 'approved';

  // 节点完成状态判定
  const step1Done = true;
  const step2Done = Boolean(ver);
  const step3Done = Boolean(app);
  const step4Done = Boolean(app?.deptReviewStatus === 'agreed');
  const step5Done = isApproved;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 px-6 py-4 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center text-teal-300 shadow-inner">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2.5">
                <h3 className="text-base font-bold tracking-tight">维修闭环项目详情 & 全周期进度追踪</h3>
                <span className="font-mono text-xs px-2.5 py-0.5 rounded-full bg-white/10 text-slate-200 border border-white/20">
                  {task.taskNo}
                </span>
                <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                  isApproved
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
                    : isApproving
                    ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-400/30'
                    : isVerified
                    ? 'bg-teal-500/20 text-teal-300 border border-teal-400/30'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-400/30'
                }`}>
                  {task.status}
                </span>
              </div>
              <p className="text-xs text-slate-300/80 mt-0.5">
                标的设备：{task.equipmentName}（型号：{task.equipmentModel} | 资产编号：{task.assetNo} | 报修科室：{task.department}）
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Top Feature: 闭环流转全生命周期进度追踪可视化横幅 (Core requirement) */}
        <div className="bg-slate-900/5 px-6 py-4 border-b border-slate-200 shrink-0">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-teal-600" />
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                闭环流转全生命周期进度追踪
              </span>
            </div>
            <div className="text-[11px] text-slate-500">
              报修时间：{task.faultTime} • 最近动态：{task.updatedAt || task.faultTime}
            </div>
          </div>

          <div className="grid grid-cols-5 gap-2 relative">
            {/* Step 1 */}
            <div className="relative p-3 rounded-xl bg-white border border-emerald-200 shadow-xs">
              <div className="flex items-center space-x-2 mb-1.5">
                <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[11px] font-bold">
                  ✓
                </div>
                <span className="text-xs font-bold text-slate-800">1. 科室报修</span>
              </div>
              <div className="text-[11px] text-slate-600 truncate">
                {task.reporterName}（{task.department}）
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                {task.faultTime.slice(5, 16)}
              </div>
              <div className="mt-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded inline-block">
                报修已受理
              </div>
            </div>

            {/* Step 2 */}
            <div className={`relative p-3 rounded-xl bg-white border shadow-xs transition-all ${
              step2Done
                ? 'border-emerald-200'
                : 'border-amber-300 ring-2 ring-amber-400/20'
            }`}>
              <div className="flex items-center space-x-2 mb-1.5">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold ${
                  step2Done
                    ? 'bg-emerald-600 text-white'
                    : 'bg-amber-500 text-white ring-2 ring-amber-200 animate-pulse'
                }`}>
                  {step2Done ? '✓' : '2'}
                </div>
                <span className="text-xs font-bold text-slate-800">2. 现场核验</span>
              </div>
              <div className="text-[11px] text-slate-600 truncate">
                {ver ? `${ver.verifiedBy}（现场实测）` : '待工程师入室实测'}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                {ver ? ver.verifiedAt.slice(5, 16) : '待勘查'}
              </div>
              <div className={`mt-1 text-[10px] font-semibold px-1.5 py-0.5 rounded inline-block ${
                step2Done
                  ? 'text-teal-700 bg-teal-50'
                  : 'text-amber-700 bg-amber-50'
              }`}>
                {step2Done ? ver?.conclusionTitle || '需要返厂维修' : '待现场勘查'}
              </div>
            </div>

            {/* Step 3 */}
            <div className={`relative p-3 rounded-xl bg-white border shadow-xs transition-all ${
              step3Done
                ? 'border-emerald-200'
                : step2Done
                ? 'border-indigo-300 ring-2 ring-indigo-400/20'
                : 'border-slate-200 opacity-70'
            }`}>
              <div className="flex items-center space-x-2 mb-1.5">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold ${
                  step3Done
                    ? 'bg-emerald-600 text-white'
                    : step2Done
                    ? 'bg-indigo-600 text-white ring-2 ring-indigo-200 animate-pulse'
                    : 'bg-slate-200 text-slate-500'
                }`}>
                  {step3Done ? '✓' : '3'}
                </div>
                <span className="text-xs font-bold text-slate-800">3. 起草呈批</span>
              </div>
              <div className="text-[11px] text-slate-600 truncate">
                {app ? `单号 ${app.applicationId}` : '拟定返厂大修预算'}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                {app ? app.draftedAt.slice(5, 16) : '待起草'}
              </div>
              <div className={`mt-1 text-[10px] font-semibold px-1.5 py-0.5 rounded inline-block ${
                step3Done
                  ? 'text-indigo-700 bg-indigo-50'
                  : 'text-slate-500 bg-slate-100'
              }`}>
                {step3Done ? `预算 ¥${app?.estimatedBudget.toLocaleString()}` : '待生成公文'}
              </div>
            </div>

            {/* Step 4 */}
            <div className={`relative p-3 rounded-xl bg-white border shadow-xs transition-all ${
              step4Done
                ? 'border-emerald-200'
                : app?.finalApprovalStatus === 'pending_dept'
                ? 'border-purple-300 ring-2 ring-purple-400/20'
                : 'border-slate-200 opacity-70'
            }`}>
              <div className="flex items-center space-x-2 mb-1.5">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold ${
                  step4Done
                    ? 'bg-emerald-600 text-white'
                    : app?.finalApprovalStatus === 'pending_dept'
                    ? 'bg-purple-600 text-white ring-2 ring-purple-200 animate-pulse'
                    : 'bg-slate-200 text-slate-500'
                }`}>
                  {step4Done ? '✓' : '4'}
                </div>
                <span className="text-xs font-bold text-slate-800">4. 主管审核</span>
              </div>
              <div className="text-[11px] text-slate-600 truncate">
                {step4Done ? `${app?.deptReviewer || '崔伟'}（已签字）` : '医学设备科主管'}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                {app?.deptReviewedAt ? app.deptReviewedAt.slice(5, 16) : '待审查'}
              </div>
              <div className={`mt-1 text-[10px] font-semibold px-1.5 py-0.5 rounded inline-block ${
                step4Done
                  ? 'text-purple-700 bg-purple-50'
                  : 'text-slate-500 bg-slate-100'
              }`}>
                {step4Done ? '主管审核同意' : '待主管会签'}
              </div>
            </div>

            {/* Step 5 */}
            <div className={`relative p-3 rounded-xl bg-white border shadow-xs transition-all ${
              step5Done
                ? 'border-emerald-200 bg-emerald-50/20'
                : app?.finalApprovalStatus === 'pending_vp'
                ? 'border-red-300 ring-2 ring-red-400/20'
                : 'border-slate-200 opacity-70'
            }`}>
              <div className="flex items-center space-x-2 mb-1.5">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold ${
                  step5Done
                    ? 'bg-emerald-600 text-white'
                    : app?.finalApprovalStatus === 'pending_vp'
                    ? 'bg-red-600 text-white ring-2 ring-red-200 animate-pulse'
                    : 'bg-slate-200 text-slate-500'
                }`}>
                  {step5Done ? '✓' : '5'}
                </div>
                <span className="text-xs font-bold text-slate-800">5. 院长终审</span>
              </div>
              <div className="text-[11px] text-slate-600 truncate">
                {step5Done ? `${app?.vpApprover || '王建国'}（已批复）` : '分管副院长终审'}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                {app?.vpApprovedAt ? app.vpApprovedAt.slice(5, 16) : '待终审'}
              </div>
              <div className={`mt-1 text-[10px] font-semibold px-1.5 py-0.5 rounded inline-block ${
                step5Done
                  ? 'text-emerald-700 bg-emerald-50'
                  : 'text-slate-500 bg-slate-100'
              }`}>
                {step5Done ? '终审批准·生效' : '待院领导签批'}
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center space-x-1 px-6 pt-3 border-b border-slate-200 bg-white shrink-0">
          <button
            onClick={() => setActiveTab('progress')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all ${
              activeTab === 'progress'
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            资产基本档 & 报修信息
          </button>
          <button
            onClick={() => setActiveTab('technical')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center space-x-1.5 ${
              activeTab === 'technical'
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>设备科现场勘查核验</span>
            {ver && <span className="w-2 h-2 rounded-full bg-emerald-500" />}
          </button>
          <button
            onClick={() => setActiveTab('approval')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center space-x-1.5 ${
              activeTab === 'approval'
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>返厂呈批报告与会签</span>
            {app && <span className="w-2 h-2 rounded-full bg-indigo-500" />}
          </button>
          <button
            onClick={() => setActiveTab('timeline')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center space-x-1.5 ${
              activeTab === 'timeline'
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>全周期审计时间轴</span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {/* TAB 1: 资产基本档 & 报修信息 */}
          {activeTab === 'progress' && (
            <div className="space-y-5">
              {/* Asset Details */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <Building2 className="w-4 h-4 text-slate-600" />
                    <h4 className="text-xs font-bold text-slate-800">标的资产台账档案</h4>
                  </div>
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-200">
                    资产原值：¥{(task.purchasePrice || 168000).toLocaleString()} 元
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="bg-white p-3 rounded-lg border border-slate-200">
                    <span className="text-slate-400 block text-[10px]">设备资产名称</span>
                    <span className="font-bold text-slate-900 mt-0.5 block">{task.equipmentName}</span>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-slate-200">
                    <span className="text-slate-400 block text-[10px]">规格型号</span>
                    <span className="font-mono font-bold text-slate-800 mt-0.5 block">{task.equipmentModel}</span>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-slate-200">
                    <span className="text-slate-400 block text-[10px]">院内资产编号</span>
                    <span className="font-mono font-bold text-indigo-900 mt-0.5 block">{task.assetNo}</span>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-slate-200">
                    <span className="text-slate-400 block text-[10px]">出厂序列号(SN)</span>
                    <span className="font-mono font-bold text-slate-800 mt-0.5 block">{task.equipmentSn}</span>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-slate-200">
                    <span className="text-slate-400 block text-[10px]">使用归属科室</span>
                    <span className="font-bold text-blue-900 mt-0.5 block">{task.department}</span>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-slate-200">
                    <span className="text-slate-400 block text-[10px]">机房存放位置</span>
                    <span className="text-slate-700 mt-0.5 block">{task.equipmentLocation}</span>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-slate-200">
                    <span className="text-slate-400 block text-[10px]">投用服役日期</span>
                    <span className="text-slate-700 mt-0.5 block">{task.enableDate || '2023-04-20'}</span>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-slate-200">
                    <span className="text-slate-400 block text-[10px]">生产制造厂商</span>
                    <span className="text-slate-700 mt-0.5 block">{task.manufacturer || '德国狼牌 (Richard Wolf GmbH)'}</span>
                  </div>
                </div>
              </div>

              {/* Department Fault Report */}
              <div className="bg-rose-50/50 border border-rose-200 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    <h4 className="text-xs font-bold text-rose-950">麻醉手术科临床报修描述</h4>
                  </div>
                  <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                    task.urgency === 'critical' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {task.urgency === 'critical' ? '特急（影响手术排台）' : '高急'}
                  </span>
                </div>

                <div className="bg-white p-3.5 rounded-lg border border-rose-200/80 text-xs space-y-2">
                  <div className="flex items-center justify-between text-slate-500 pb-2 border-b border-slate-100">
                    <span>故障类型：<b className="text-slate-800">{task.faultType}</b></span>
                    <span>报修人：<b className="text-slate-800">{task.reporterName}（{task.reporterRole}）</b> • 电话：{task.reporterPhone}</span>
                  </div>
                  <p className="text-slate-700 leading-relaxed pt-1">
                    {task.faultDescription}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: 设备科现场勘查核验 */}
          {activeTab === 'technical' && (
            <div className="space-y-4">
              {ver ? (
                <div className="space-y-4">
                  <div className="p-4 bg-teal-50 border border-teal-200 rounded-xl flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-9 h-9 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center font-bold">
                        ✓
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-teal-950">
                          设备科工程师已完成现场技术勘查核验
                        </h4>
                        <p className="text-[11px] text-teal-800 mt-0.5">
                          核验人：{ver.verifiedBy}（{ver.verifierRole}） • 核验时间：{ver.verifiedAt}
                        </p>
                      </div>
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-teal-600 text-white shadow-xs">
                      判定结论：{ver.conclusionTitle}
                    </span>
                  </div>

                  {/* Real test parameters */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                      <span className="text-slate-400 block text-[10px]">光学同轴度/透光率实测</span>
                      <span className="font-bold text-slate-800 text-sm mt-1 block">
                        {ver.opticalTransmittance}
                      </span>
                      <span className="text-red-600 text-[10px] mt-1 block">断崖衰减（出厂基准95%）</span>
                    </div>

                    <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                      <span className="text-slate-400 block text-[10px]">0.05MPa负压水密封测漏</span>
                      <span className="font-bold text-slate-800 text-sm mt-1 block">
                        {ver.airtightnessLeakage}
                      </span>
                      <span className="text-amber-700 text-[10px] mt-1 block">封胶开裂，负压持续下降</span>
                    </div>

                    <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                      <span className="text-slate-400 block text-[10px]">透镜光学组显微检查</span>
                      <span className="font-bold text-slate-800 text-sm mt-1 block">
                        {ver.lensGroupCondition}
                      </span>
                      <span className="text-indigo-700 text-[10px] mt-1 block">柱镜开裂，需百级洁净室更换</span>
                    </div>
                  </div>

                  {/* Technical assessment */}
                  <div className="bg-white p-4 rounded-xl border border-slate-200 text-xs space-y-2">
                    <h5 className="font-bold text-slate-800">设备科专业技术勘查鉴定详述：</h5>
                    <p className="text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-200">
                      {ver.technicalAssessment}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center bg-slate-50 border border-slate-200 rounded-xl">
                  <UserCheck className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                  <h4 className="text-xs font-bold text-slate-700">当前尚未录入设备科现场技术勘查数据</h4>
                  <p className="text-[11px] text-slate-400 mt-1">
                    需要设备科工程师携带测漏仪和光学投影仪入室检测并录入实测参数。
                  </p>
                  {onOpenVerification && (
                    <button
                      onClick={() => {
                        onClose();
                        onOpenVerification(task);
                      }}
                      className="mt-4 px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-sm"
                    >
                      立即前往现场勘查与性能核验
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: 返厂呈批报告与会签 */}
          {activeTab === 'approval' && (
            <div className="space-y-4">
              {app ? (
                <div className="space-y-4">
                  {/* Application Summary */}
                  <div className="bg-indigo-50/60 border border-indigo-200 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-xs font-bold text-indigo-950">{app.title}</h4>
                      <span className="font-mono text-xs font-bold text-indigo-800 bg-white px-2 py-0.5 rounded border border-indigo-200">
                        {app.applicationId}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs mt-3">
                      <div className="bg-white p-2.5 rounded-lg border border-indigo-100">
                        <span className="text-slate-400 block text-[10px]">预估大修费用</span>
                        <span className="font-bold text-emerald-800 text-sm block">
                          ¥{app.estimatedBudget.toLocaleString()} 元
                        </span>
                        <span className="text-[10px] text-slate-500">仅占新机原值 {app.budgetRatioPercent}%</span>
                      </div>
                      <div className="bg-white p-2.5 rounded-lg border border-indigo-100">
                        <span className="text-slate-400 block text-[10px]">拟委托返厂厂家</span>
                        <span className="font-bold text-slate-800 block truncate">{app.targetVendor}</span>
                        <span className="text-[10px] text-blue-700">质保承诺：{app.warrantyMonths} 个月整机质保</span>
                      </div>
                      <div className="bg-white p-2.5 rounded-lg border border-indigo-100">
                        <span className="text-slate-400 block text-[10px]">公文起草人</span>
                        <span className="font-bold text-slate-800 block">{app.draftedBy}（{app.draftedRole}）</span>
                        <span className="text-[10px] text-slate-400">{app.draftedAt}</span>
                      </div>
                    </div>
                  </div>

                  {/* Signatures Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Node 1: 设备科主管审核 */}
                    <div className="border border-slate-200 rounded-xl p-4 bg-slate-50">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-indigo-900">医学设备科主管技术审核意见</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                          app.deptReviewStatus === 'agreed' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {app.deptReviewStatus === 'agreed' ? '已审核同意' : '待主管审核'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-700 leading-relaxed bg-white p-3 rounded-lg border border-slate-200 min-h-[64px]">
                        {app.deptReviewComment || '经现场实测技术勘查属实，院内无修复条件，预算合理，同意呈批。'}
                      </p>
                      <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2">
                        <span>审核人：<b className="text-slate-700">{app.deptReviewer || '崔伟 (科长)'}</b></span>
                        <span className="font-bold text-indigo-800">{app.deptSignature || '崔伟 (已签章)'}</span>
                      </div>
                    </div>

                    {/* Node 2: 分管副院长终审 */}
                    <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 relative overflow-hidden">
                      {isApproved && (
                        <div className="absolute right-2 bottom-2 w-16 h-16 rounded-full border border-red-500 text-red-600 flex flex-col items-center justify-center opacity-60 pointer-events-none rotate-[-12deg]">
                          <div className="text-[7px] font-bold">医院审批章</div>
                          <div className="text-[6px]">★</div>
                          <div className="text-[6px] font-bold">准予返厂</div>
                        </div>
                      )}
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-red-900">分管副院长终审批示意见</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                          isApproved ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {isApproved ? '已终审批准' : '待副院长审批'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-700 leading-relaxed bg-white p-3 rounded-lg border border-slate-200 min-h-[64px]">
                        {app.vpApprovalComment || '同意返厂大修。请医学设备科监督大修质量，确保落实12个月原厂质保。'}
                      </p>
                      <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2">
                        <span>分管院领导：<b className="text-slate-700">{app.vpApprover || '王建国 (业务副院长)'}</b></span>
                        <span className="font-bold text-red-800">{app.vpSignature || '王建国 (已签批)'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center bg-slate-50 border border-slate-200 rounded-xl">
                  <FileText className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                  <h4 className="text-xs font-bold text-slate-700">尚未起草《返厂大修呈批报告》</h4>
                  <p className="text-[11px] text-slate-400 mt-1">
                    完成现场技术勘查确认需要返厂后，可一键起草公文流转主管及分管院长审批。
                  </p>
                  {ver && onOpenDraft && (
                    <button
                      onClick={() => {
                        onClose();
                        onOpenDraft(task);
                      }}
                      className="mt-4 px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 shadow-sm"
                    >
                      🚀 立即起草返厂维修申请单
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: 全周期审计时间轴 */}
          {activeTab === 'timeline' && (
            <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
              {task.timeline.map((evt, idx) => (
                <div key={evt.id || idx} className="relative">
                  <div className="absolute -left-6 top-1 w-3.5 h-3.5 rounded-full bg-teal-600 ring-4 ring-white shadow-xs" />
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900">{evt.title}</span>
                      <span className="text-[10px] text-slate-400">{evt.time}</span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      经办人：{evt.actorName}（{evt.actorRole} • {evt.actorDept}）
                    </div>
                    <p className="text-xs text-slate-600 mt-1 bg-slate-50 p-2.5 rounded-lg border border-slate-200 leading-relaxed">
                      {evt.notes}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer Actions Bar */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-500">
            全流程合规审计留痕 • 医用装备内控闭环追踪
          </div>

          <div className="flex items-center space-x-2">
            {/* Contextual Action 1: 现场核验 */}
            {isReported && onOpenVerification && (
              <button
                onClick={() => {
                  onClose();
                  onOpenVerification(task);
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-sm flex items-center space-x-1.5"
              >
                <UserCheck className="w-4 h-4" />
                <span>进行现场技术核验</span>
              </button>
            )}

            {/* Contextual Action 2: 起草返厂呈批单 */}
            {isVerified && onOpenDraft && (
              <button
                onClick={() => {
                  onClose();
                  onOpenDraft(task);
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 shadow-sm flex items-center space-x-1.5"
              >
                <Send className="w-4 h-4" />
                <span>一键起草返厂呈批单</span>
              </button>
            )}

            {/* Contextual Action 3: 审批会签 */}
            {isApproving && onOpenApproval && (
              <button
                onClick={() => {
                  onClose();
                  onOpenApproval(task);
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm flex items-center space-x-1.5"
              >
                <FileText className="w-4 h-4" />
                <span>进入审批会签中心</span>
              </button>
            )}

            {/* Contextual Action 4: 打印红头文书 */}
            {isApproved && onOpenPrint && (
              <button
                onClick={() => {
                  onClose();
                  onOpenPrint(task);
                }}
                className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 flex items-center space-x-1.5"
              >
                <Printer className="w-4 h-4" />
                <span>打印红头呈批报告</span>
              </button>
            )}

            {/* Contextual Action 5: 协同履约工作台 */}
            {isApproved && onOpenWorkflowWorkspace && (
              <button
                onClick={() => {
                  onClose();
                  onOpenWorkflowWorkspace();
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm flex items-center space-x-1.5"
              >
                <RotateCcw className="w-4 h-4" />
                <span>进入十阶协同履约工作台</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100"
            >
              关闭
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

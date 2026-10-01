import React, { useState } from 'react';
import { 
  X, 
  CheckCircle2, 
  FileCheck, 
  ShieldCheck, 
  UserCheck, 
  Award, 
  Clock, 
  Building2, 
  DollarSign, 
  AlertTriangle,
  RotateCcw,
  Check,
  Printer,
  Sparkles
} from 'lucide-react';
import { ClosedLoopRepairTask } from '../../types/closedLoopRepairTypes';
import { AuthUser } from '../../types';

interface ApprovalWorkflowModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: ClosedLoopRepairTask;
  onApproveDept: (taskId: string, reviewerName: string, comment: string, signature: string) => void;
  onApproveVp: (taskId: string, approverName: string, comment: string, signature: string) => void;
  currentUser: AuthUser | null;
  onOpenPrint?: (task: ClosedLoopRepairTask) => void;
  onNavigateToFactoryWorkflow?: () => void;
}

export const ApprovalWorkflowModal: React.FC<ApprovalWorkflowModalProps> = ({
  isOpen,
  onClose,
  task,
  onApproveDept,
  onApproveVp,
  currentUser,
  onOpenPrint,
  onNavigateToFactoryWorkflow
}) => {
  if (!isOpen) return null;

  const app = task.factoryRepairApplication;
  if (!app) return null;

  const isPendingDept = app.finalApprovalStatus === 'pending_dept';
  const isPendingVp = app.finalApprovalStatus === 'pending_vp';
  const isFullyApproved = app.finalApprovalStatus === 'approved';

  // 节点 1: 设备科主管审核意见
  const [deptReviewer, setDeptReviewer] = useState(app.deptReviewer || '崔伟');
  const [deptRole, setDeptRole] = useState('医疗设备科科长 / 主管工程师');
  const [deptComment, setDeptComment] = useState(
    app.deptReviewComment || 
    '经现场精密勘查与测漏检测，该输尿管硬镜物镜封胶开裂进水、第2组柱镜碎裂，院内及本地第三方均无百级洁净无尘室与激光同轴重置仪器，确无修复条件。拟委托德国狼牌原厂大修，预算1.42万元（仅占原值8.4%），包含12个月原厂质保，论证充分，同意呈报分管副院长终审。'
  );
  const [deptSignature, setDeptSignature] = useState(app.deptSignature || '崔伟 (电子审核签章)');

  // 节点 2: 分管院长审批意见
  const [vpApprover, setVpApprover] = useState(app.vpApprover || '王建国');
  const [vpRole, setVpRole] = useState('业务副院长 / 医学装备管理委员会主任');
  const [vpComment, setVpComment] = useState(
    app.vpApprovalComment ||
    '同意返厂大修。请医学设备科严格监督大修质量，压缩返厂停机周期，确保落实12个月原厂全保并规范完成验收入库及全流程闭环归档。'
  );
  const [vpSignature, setVpSignature] = useState(app.vpSignature || '王建国 (院领导审批签章)');

  const handleDeptSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onApproveDept(task.id, deptReviewer, deptComment, deptSignature);
  };

  const handleVpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onApproveVp(task.id, vpApprover, vpComment, vpSignature);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-900 px-6 py-5 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20 shadow-inner">
              <FileCheck className="w-5 h-5 text-indigo-300" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-lg font-bold">返厂大修呈批单 · 多级流转审批会签中心</h3>
                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                  isFullyApproved
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
                    : isPendingVp
                    ? 'bg-red-500/20 text-red-300 border border-red-400/30'
                    : 'bg-indigo-500/20 text-indigo-300 border border-indigo-400/30'
                }`}>
                  {isFullyApproved ? '审批已通过 · 准予实施' : isPendingVp ? '待分管副院长审批' : '待设备科主管审核'}
                </span>
              </div>
              <p className="text-xs text-slate-300/80 mt-0.5">
                单号：{app.applicationId} • 关联资产：{task.equipmentName} ({task.assetNo})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[82vh] overflow-y-auto">
          {/* Summary Banner */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-bold text-slate-900">{app.title}</h4>
              <span className="px-2 py-0.5 rounded text-xs font-bold bg-emerald-100 text-emerald-800">
                预估预算：¥{app.estimatedBudget.toLocaleString()} (占原值 {app.budgetRatioPercent}%)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs mt-3">
              <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                <span className="text-slate-400 block text-[10px]">受损技术核验依据</span>
                <span className="font-semibold text-slate-700 block text-[11px] mt-0.5 line-clamp-2">
                  {task.onsiteVerification?.opticalTransmittance || '透光率41.5%，柱镜微裂，封胶开裂进水'}
                </span>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                <span className="text-slate-400 block text-[10px]">拟返厂厂家 & 承诺</span>
                <span className="font-semibold text-slate-700 block text-[11px] mt-0.5 truncate">
                  {app.targetVendor}
                </span>
                <span className="text-blue-600 text-[10px] block">提供 {app.warrantyMonths} 个月原厂整机质保</span>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                <span className="text-slate-400 block text-[10px]">起草人与科室</span>
                <span className="font-semibold text-slate-700 block text-[11px] mt-0.5">
                  {app.draftedBy} ({app.draftedRole})
                </span>
                <span className="text-slate-400 text-[10px] block">{app.draftedAt} 起草</span>
              </div>
            </div>
          </div>

          {/* Stepper View */}
          <div className="flex items-center justify-between px-4 py-3 bg-indigo-50/50 border border-indigo-100 rounded-xl">
            <div className="flex items-center space-x-3">
              <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold">
                ✓
              </div>
              <div>
                <div className="text-xs font-bold text-slate-800">1. 呈批单起草申报</div>
                <div className="text-[10px] text-slate-500">{app.draftedBy} • 已呈报</div>
              </div>
            </div>

            <div className={`h-0.5 flex-1 mx-4 ${app.deptReviewStatus === 'agreed' ? 'bg-emerald-500' : 'bg-slate-200'}`} />

            <div className="flex items-center space-x-3">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                app.deptReviewStatus === 'agreed'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-indigo-600 text-white ring-4 ring-indigo-200 animate-pulse'
              }`}>
                {app.deptReviewStatus === 'agreed' ? '✓' : '2'}
              </div>
              <div>
                <div className="text-xs font-bold text-slate-800">2. 设备科主管审核</div>
                <div className="text-[10px] text-slate-500">
                  {app.deptReviewStatus === 'agreed' ? '审核同意' : '待主管签批'}
                </div>
              </div>
            </div>

            <div className={`h-0.5 flex-1 mx-4 ${app.vpApprovalStatus === 'agreed' ? 'bg-emerald-500' : 'bg-slate-200'}`} />

            <div className="flex items-center space-x-3">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                app.vpApprovalStatus === 'agreed'
                  ? 'bg-emerald-600 text-white'
                  : isPendingVp
                  ? 'bg-red-600 text-white ring-4 ring-red-200 animate-pulse'
                  : 'bg-slate-200 text-slate-600'
              }`}>
                {app.vpApprovalStatus === 'agreed' ? '✓' : '3'}
              </div>
              <div>
                <div className="text-xs font-bold text-slate-800">3. 分管副院长终审</div>
                <div className="text-[10px] text-slate-500">
                  {app.vpApprovalStatus === 'agreed' ? '批准实施' : '待终审签批'}
                </div>
              </div>
            </div>
          </div>

          {/* Node 1: 设备科主管审核 (崔伟) */}
          <div className={`border rounded-xl p-5 transition-all ${
            isPendingDept
              ? 'border-indigo-400 bg-indigo-50/30 shadow-md ring-2 ring-indigo-500/10'
              : app.deptReviewStatus === 'agreed'
              ? 'border-emerald-200 bg-emerald-50/20'
              : 'border-slate-200 bg-slate-50'
          }`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs">
                  2
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">节点 2：医学设备科主管审核</h4>
                  <p className="text-[11px] text-slate-500">技术审查、维修论证真实性核验及预算控制</p>
                </div>
              </div>
              {app.deptReviewStatus === 'agreed' ? (
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 flex items-center space-x-1">
                  <Check className="w-3.5 h-3.5" />
                  <span>已审核同意 (崔伟)</span>
                </span>
              ) : (
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800 animate-pulse">
                  当前待审节点
                </span>
              )}
            </div>

            {isPendingDept ? (
              <form onSubmit={handleDeptSubmit} className="space-y-3 pt-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">审核人姓名</label>
                    <input
                      type="text"
                      value={deptReviewer}
                      onChange={e => setDeptReviewer(e.target.value)}
                      className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">审核人职务</label>
                    <input
                      type="text"
                      value={deptRole}
                      onChange={e => setDeptRole(e.target.value)}
                      className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    设备科主管技术审查与论证意见 *
                  </label>
                  <textarea
                    rows={3}
                    value={deptComment}
                    onChange={e => setDeptComment(e.target.value)}
                    className="w-full text-xs p-3 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed"
                    required
                  />
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-slate-500">电子签名：</span>
                    <input
                      type="text"
                      value={deptSignature}
                      onChange={e => setDeptSignature(e.target.value)}
                      className="text-xs font-bold text-indigo-900 bg-white border border-indigo-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md transition-all flex items-center space-x-1.5"
                  >
                    <Check className="w-4 h-4" />
                    <span>主管审核通过 · 流转分管院长</span>
                  </button>
                </div>
              </form>
            ) : (
              <div className="bg-white p-3.5 rounded-lg border border-slate-200 text-xs space-y-2">
                <div className="text-slate-700 leading-relaxed font-sans">{app.deptReviewComment}</div>
                <div className="flex items-center justify-between text-slate-400 text-[11px] pt-2 border-t border-slate-100">
                  <span>签署时间：{app.deptReviewedAt || '2026-09-23 10:20'}</span>
                  <span className="font-bold text-indigo-800">{app.deptSignature || '崔伟 (已签章)'}</span>
                </div>
              </div>
            )}
          </div>

          {/* Node 2: 分管副院长终审审批 (王建国) */}
          <div className={`border rounded-xl p-5 transition-all ${
            isPendingVp
              ? 'border-red-400 bg-red-50/30 shadow-md ring-2 ring-red-500/10'
              : app.vpApprovalStatus === 'agreed'
              ? 'border-emerald-200 bg-emerald-50/20'
              : 'border-slate-200 bg-slate-50/60 opacity-80'
          }`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-red-100 text-red-700 flex items-center justify-center font-bold text-xs">
                  3
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">节点 3：分管副院长终审签批</h4>
                  <p className="text-[11px] text-slate-500">业务副院长/医学装备管理委员会主任 终审批准</p>
                </div>
              </div>
              {app.vpApprovalStatus === 'agreed' ? (
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 flex items-center space-x-1">
                  <Check className="w-3.5 h-3.5" />
                  <span>分管院长已终审批准 (王建国)</span>
                </span>
              ) : isPendingVp ? (
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800 animate-pulse">
                  当前待审节点
                </span>
              ) : (
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-500">
                  等待前序主管审核
                </span>
              )}
            </div>

            {isPendingVp ? (
              <form onSubmit={handleVpSubmit} className="space-y-3 pt-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">审批领导姓名</label>
                    <input
                      type="text"
                      value={vpApprover}
                      onChange={e => setVpApprover(e.target.value)}
                      className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">领导职务</label>
                    <input
                      type="text"
                      value={vpRole}
                      onChange={e => setVpRole(e.target.value)}
                      className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    分管院长终审批示意见 *
                  </label>
                  <textarea
                    rows={3}
                    value={vpComment}
                    onChange={e => setVpComment(e.target.value)}
                    className="w-full text-xs p-3 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 leading-relaxed"
                    required
                  />
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-slate-500">院领导签章：</span>
                    <input
                      type="text"
                      value={vpSignature}
                      onChange={e => setVpSignature(e.target.value)}
                      className="text-xs font-bold text-red-900 bg-white border border-red-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-6 py-2 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-700 shadow-md transition-all flex items-center space-x-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>同意并签章批准返厂维修</span>
                  </button>
                </div>
              </form>
            ) : app.vpApprovalStatus === 'agreed' ? (
              <div className="bg-white p-3.5 rounded-lg border border-slate-200 text-xs space-y-2">
                <div className="text-slate-700 leading-relaxed font-sans">{app.vpApprovalComment}</div>
                <div className="flex items-center justify-between text-slate-400 text-[11px] pt-2 border-t border-slate-100">
                  <span>终审时间：{app.vpApprovedAt || '2026-09-23 11:30'}</span>
                  <span className="font-bold text-red-800">{app.vpSignature || '王建国 (已签章)'}</span>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-slate-100/70 rounded-lg text-xs text-slate-500 text-center">
                前序【医学设备科主管审核】通过后，即可在此节点进行分管副院长终审签批。
              </div>
            )}
          </div>

          {/* Success Banner when fully approved */}
          {isFullyApproved && (
            <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-xl flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                  ✓
                </div>
                <div>
                  <h4 className="text-xs font-bold text-emerald-950">
                    返厂大修呈批报告已完成多级会签并正式批准生效！
                  </h4>
                  <p className="text-[11px] text-emerald-800 mt-0.5">
                    设备科主管已审核签字，分管副院长已终审签批。可打印正式红头公文，或穿透至十阶闭环工作台发快递寄出。
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {onOpenPrint && (
                  <button
                    onClick={() => onOpenPrint(task)}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 flex items-center space-x-1"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>打印红头呈批单</span>
                  </button>
                )}
                {onNavigateToFactoryWorkflow && (
                  <button
                    onClick={onNavigateToFactoryWorkflow}
                    className="px-3.5 py-1.5 rounded-lg text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-xs flex items-center space-x-1"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>进入返厂大修协同履约</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            医院医学装备内控管理委员会 • 全流程防篡改审计电子留痕
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-bold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 transition-colors"
          >
            关闭窗口
          </button>
        </div>
      </div>
    </div>
  );
};

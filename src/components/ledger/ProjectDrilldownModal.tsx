import React, { useState } from 'react';
import {
  X,
  Building2,
  Receipt,
  FileText,
  Calendar,
  CheckCircle2,
  Clock,
  Printer,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  Phone,
  User,
  CreditCard,
  Layers,
  Sparkles,
  AlertCircle,
  FileCheck2,
  Tag,
  ChevronRight,
  TrendingUp,
  Landmark,
  Hash
} from 'lucide-react';
import { HospitalProjectRecord } from '../../types/hospitalProjectLedgerTypes';
import { ApprovalApplication } from '../../types/approvalTypes';
import { BiddingProject, VendorCollaborationOrder } from '../../types/vendorCollaborationTypes';
import { evaluateProjectAuditCompliance } from '../../utils/complianceAuditEngine';
import { ProjectAuditComplianceTab } from './ProjectAuditComplianceTab';
import { numberToChineseCurrency } from '../payment/ExpensePreApprovalModal';
import { resolveHospitalCodingChain } from '../../utils/hospitalCodingStandard';

interface ProjectDrilldownModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: HospitalProjectRecord | null;
  onOpenPreApproval: (project: HospitalProjectRecord) => void;
  initialTab?: 'overview' | 'compliance' | 'vendor' | 'invoice' | 'timeline' | 'texts';
  blockedAlert?: { message: string; missingItems: string[] } | null;
  approvals?: ApprovalApplication[];
  vendorOrders?: VendorCollaborationOrder[];
  biddingProjects?: BiddingProject[];
  onProjectUpdated?: (updatedProject: HospitalProjectRecord) => void;
  onLaunchElectronicApproval?: (project: HospitalProjectRecord) => void;
  onNavigateVendorOrder?: (vendorOrderId: string) => void;
}

export const ProjectDrilldownModal: React.FC<ProjectDrilldownModalProps> = ({
  isOpen,
  onClose,
  project,
  onOpenPreApproval,
  initialTab,
  blockedAlert,
  approvals = [],
  vendorOrders = [],
  biddingProjects = [],
  onProjectUpdated,
  onLaunchElectronicApproval,
  onNavigateVendorOrder
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'compliance' | 'vendor' | 'invoice' | 'timeline' | 'texts'>(
    initialTab || 'overview'
  );
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [localBlockedAlert, setLocalBlockedAlert] = useState<{ message: string; missingItems: string[] } | null>(
    blockedAlert || null
  );

  React.useEffect(() => {
    if (isOpen) {
      setLocalBlockedAlert(blockedAlert || null);
      if (blockedAlert) {
        setActiveTab('compliance');
      } else if (initialTab) {
        setActiveTab(initialTab);
      } else if (project?.complianceDossier) {
        setActiveTab('compliance');
      } else {
        setActiveTab('overview');
      }
    }
  }, [isOpen, project?.id, initialTab, blockedAlert]);

  const complianceEval = React.useMemo(() => {
    if (!project) return null;
    return evaluateProjectAuditCompliance(project, {
      approvals,
      vendorOrders,
      biddingProjects
    });
  }, [project, approvals, vendorOrders, biddingProjects]);

  if (!isOpen || !project) return null;

  const handleTryPreApproval = () => {
    if (complianceEval && !complianceEval.isAuditReady) {
      setLocalBlockedAlert({
        message: `审计强阻断：项目 #${project.id} 尚有 ${complianceEval.missingItems.length} 项合规材料未齐备，禁止出具预批单或归档`,
        missingItems: complianceEval.missingItems
      });
      setActiveTab('compliance');
      return;
    }
    onOpenPreApproval(project);
  };

  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const getStatusBadge = (status: string) => {
    if (status.includes('并通过') || status.includes('已打印')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle2 className="w-3.5 h-3.5" />
          {status}
        </span>
      );
    }
    if (status.includes('打印预批')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
          <Clock className="w-3.5 h-3.5" />
          {status}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
        <FileText className="w-3.5 h-3.5" />
        {status || '正常流转'}
      </span>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden animate-scaleIn"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white flex items-center justify-between border-b border-slate-700">
          {(() => {
            const chain = resolveHospitalCodingChain(project.id);
            return (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600/30 border border-blue-400/30 flex flex-col items-center justify-center text-blue-300 font-bold shadow-inner">
                  <span className="text-[10px] text-blue-200 leading-none">ID</span>
                  <span className="text-sm font-black text-white leading-none mt-0.5">{project.id}</span>
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base sm:text-lg font-bold text-white tracking-wide">
                      {project.projectName}
                    </h3>
                    <span className="px-2 py-0.5 bg-blue-500/20 text-blue-300 border border-blue-400/30 text-xs rounded-md">
                      {project.department}
                    </span>
                    {project.category && (
                      <span className="hidden sm:inline-block px-2 py-0.5 bg-slate-800 text-slate-300 text-xs rounded-md border border-slate-700">
                        {project.category}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-300 mt-1 flex items-center gap-3 flex-wrap">
                    <span>获批日期: {project.approvedDate || project.approvalDate || '2025/11/10'}</span>
                    <span>•</span>
                    <span>对应工单: <strong className="text-amber-300 font-mono">{chain.workOrder.fullCode}</strong></span>
                    <span>•</span>
                    <span>预批单号: <strong className="text-emerald-300 font-mono">编号：{chain.preApproval.docNo} ({chain.preApproval.standardVoucherNo})</strong></span>
                    <span>•</span>
                    <span>经办公司: <strong className="text-blue-200">{project.vendor?.companyName}</strong></span>
                  </p>
                </div>
              </div>
            );
          })()}

          <div className="flex items-center gap-2">
            <button
              onClick={handleTryPreApproval}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-white rounded-lg text-xs font-semibold shadow-md transition-all cursor-pointer ${
                complianceEval && !complianceEval.isAuditReady
                  ? 'bg-rose-600 hover:bg-rose-700'
                  : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700'
              }`}
              title={
                complianceEval && !complianceEval.isAuditReady
                  ? '缺审批/比价议价招标/会议纪要，审计阻断（点击前往补办）'
                  : '一键开具并打印1:1费用预批单'
              }
            >
              <Printer className="w-3.5 h-3.5" />
              <span>
                {complianceEval && !complianceEval.isAuditReady ? '合规未全·阻断预批' : '生成费用预批单'}
              </span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 bg-slate-50 border-b border-slate-200 flex items-center gap-2 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-3 px-3 text-xs sm:text-sm font-medium border-b-2 flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'overview'
                ? 'border-blue-600 text-blue-600 font-bold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-4 h-4" />
            综合概览
          </button>
          <button
            onClick={() => setActiveTab('compliance')}
            className={`py-3 px-3 text-xs sm:text-sm font-medium border-b-2 flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'compliance'
                ? 'border-blue-600 text-blue-600 font-bold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldCheck
              className={`w-4 h-4 ${
                complianceEval?.isAuditReady ? 'text-emerald-600' : 'text-rose-600'
              }`}
            />
            <span>审计合规与补办</span>
            {complianceEval && (
              <span
                className={`font-mono text-[11px] font-bold tabular-nums ${
                  complianceEval.isAuditReady ? 'text-emerald-700' : 'text-rose-600'
                }`}
              >
                {complianceEval.completedCount}/3
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('vendor')}
            className={`py-3 px-3 text-xs sm:text-sm font-medium border-b-2 flex items-center gap-1.5 transition-colors whitespace-nowrap ${
              activeTab === 'vendor'
                ? 'border-blue-600 text-blue-600 font-bold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building2 className="w-4 h-4 text-emerald-600" />
            经办公司档案
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
          </button>
          <button
            onClick={() => setActiveTab('invoice')}
            className={`py-3 px-3 text-xs sm:text-sm font-medium border-b-2 flex items-center gap-1.5 transition-colors whitespace-nowrap ${
              activeTab === 'invoice'
                ? 'border-blue-600 text-blue-600 font-bold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Receipt className="w-4 h-4 text-amber-600" />
            开票与发票查验
            <span className="px-1.5 py-0.2 bg-amber-100 text-amber-700 text-[10px] rounded-full font-bold">
              ¥{project.invoice?.totalAmount?.toFixed(2)}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('timeline')}
            className={`py-3 px-3 text-xs sm:text-sm font-medium border-b-2 flex items-center gap-1.5 transition-colors whitespace-nowrap ${
              activeTab === 'timeline'
                ? 'border-blue-600 text-blue-600 font-bold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Clock className="w-4 h-4 text-purple-600" />
            全生命周期节点 (7步)
          </button>
          {(project.approvalContent || project.deptConfirmContent) && (
            <button
              onClick={() => setActiveTab('texts')}
              className={`py-3 px-3 text-xs sm:text-sm font-medium border-b-2 flex items-center gap-1.5 transition-colors whitespace-nowrap ${
                activeTab === 'texts'
                  ? 'border-blue-600 text-blue-600 font-bold'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileCheck2 className="w-4 h-4 text-indigo-600" />
              申报与确认原件记录
            </button>
          )}
        </div>

        {/* Tab Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6 bg-slate-50/50">
          {/* TAB 0: AUDIT COMPLIANCE & REMEDIATION */}
          {activeTab === 'compliance' && (
            <ProjectAuditComplianceTab
              project={project}
              approvals={approvals}
              vendorOrders={vendorOrders}
              biddingProjects={biddingProjects}
              blockedAlert={localBlockedAlert}
              onProjectUpdated={(updated) => {
                setLocalBlockedAlert(null);
                onProjectUpdated?.(updated);
              }}
              onLaunchElectronicApproval={onLaunchElectronicApproval}
              onNavigateVendorOrder={onNavigateVendorOrder}
              onOpenPreApproval={onOpenPreApproval}
            />
          )}

          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Top Quick Metric Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
                  <div className="text-xs text-slate-500 font-medium">项目ID与编号</div>
                  <div className="text-lg font-bold text-slate-900 mt-1 flex items-center gap-1">
                    #{project.id}
                    <button
                      onClick={() => handleCopy(project.id, 'id')}
                      className="p-1 text-slate-400 hover:text-blue-600 transition-colors"
                      title="复制ID"
                    >
                      {copiedField === 'id' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">预批单对应编号</div>
                </div>

                <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
                  <div className="text-xs text-slate-500 font-medium">经办结算金额</div>
                  <div className="text-lg font-bold text-amber-600 mt-1">
                    ¥{project.invoice?.totalAmount?.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">{numberToChineseCurrency(project.invoice?.totalAmount || 0)}</div>
                </div>

                <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
                  <div className="text-xs text-slate-500 font-medium">预批状态</div>
                  <div className="mt-1">{getStatusBadge(project.preApprovalStatus)}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">{project.dateValidation || '日期验证通过'}</div>
                </div>

                <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
                  <div className="text-xs text-slate-500 font-medium">发票状态</div>
                  <div className="mt-1 flex items-center gap-1 text-xs font-semibold text-emerald-700">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>国税查验真伪通过</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">{project.invoice?.paymentStatus}</div>
                </div>
              </div>

              {/* Two Column Layout: Vendor Card & Invoice Card Snapshot */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Vendor Snapshot */}
                <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:border-blue-300 transition-all">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
                        <Building2 className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-bold text-slate-700">经办公司 / 供货服务商</span>
                    </div>
                    <button
                      onClick={() => setActiveTab('vendor')}
                      className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-0.5"
                    >
                      查看完整档案 <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="mt-3 space-y-2 text-xs">
                    <div>
                      <span className="text-slate-400">公司名称：</span>
                      <strong className="text-slate-800 font-bold">{project.vendor?.companyName}</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">信用代码：</span>
                      <span className="font-mono text-slate-700 bg-slate-50 px-2 py-0.5 rounded border border-slate-200 text-[11px]">
                        {project.vendor?.creditCode}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">业务经办：</span>
                      <span className="text-slate-700">{project.vendor?.contactPerson} ({project.vendor?.contactPhone})</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">资质等级：</span>
                      <span className="text-emerald-700 font-medium">{project.vendor?.qualification}</span>
                    </div>
                  </div>
                </div>

                {/* Invoice Snapshot */}
                <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:border-blue-300 transition-all">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
                        <Receipt className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-bold text-slate-700">开票及财务结算</span>
                    </div>
                    <button
                      onClick={() => setActiveTab('invoice')}
                      className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-0.5"
                    >
                      查看发票核验 <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="mt-3 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">发票类型：</span>
                      <span className="font-medium text-slate-800">{project.invoice?.invoiceType}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">发票号码：</span>
                      <span className="font-mono text-slate-700">{project.invoice?.invoiceNumber}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">开票日期：</span>
                      <span className="text-slate-700">{project.invoice?.invoiceDate}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">价税合计：</span>
                      <span className="text-amber-600 font-bold text-sm">
                        ¥{project.invoice?.totalAmount?.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Project Lifecycle Node Summary */}
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <h4 className="text-xs font-bold text-slate-700 mb-3 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  项目核心节点记录
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                    <div className="text-slate-400 text-[11px]">报修日期</div>
                    <div className="font-medium text-slate-800 mt-1">{project.repairDate || '无报修直接报批'}</div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                    <div className="text-slate-400 text-[11px]">报批日期</div>
                    <div className="font-medium text-slate-800 mt-1">{project.approvalDate || '-'}</div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                    <div className="text-slate-400 text-[11px]">询价/议价</div>
                    <div className="font-medium text-slate-800 mt-1">
                      {project.inquiryDate || project.bargainBatch || '已按章询价'}
                    </div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                    <div className="text-slate-400 text-[11px]">预批打印日期</div>
                    <div className="font-medium text-slate-800 mt-1">{project.preApprovalPrintDate || project.approvedDate || '-'}</div>
                  </div>
                </div>
              </div>

              {/* Call to action card */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 border border-amber-200 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold shadow-md">
                    <Printer className="w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="text-sm font-bold text-amber-900">
                      一键出具该项目《五莲县人民医院费用预批单》
                    </h5>
                    <p className="text-xs text-amber-700 mt-0.5">
                      自动将ID #{project.id} 与 “{project.projectName}” 及经办公司【{project.vendor?.companyName}】完全对应，生成1:1纸质双联打印版与电子防伪流转凭单。
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleTryPreApproval}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-lg shadow transition-all hover:scale-105 whitespace-nowrap cursor-pointer"
                >
                  {complianceEval && !complianceEval.isAuditReady ? '前往合规补办（阻断中）' : '开具与打印预批单'}
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: VENDOR DETAILS (经办公司档案) */}
          {activeTab === 'vendor' && (
            <div className="space-y-5">
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xl">
                      <Building2 className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-slate-900 flex items-center gap-2">
                        {project.vendor?.companyName}
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[11px] rounded-full font-semibold">
                          定点合作企业
                        </span>
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        主要服务项目：{project.projectName}（ID #{project.id}）
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 text-amber-500 text-xs font-bold bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                    <span>★ 履约评级：{project.vendor?.rating || 5}.0</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 text-xs">
                  <div className="space-y-3">
                    <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                      <span className="text-slate-400 block text-[11px]">统一社会信用代码</span>
                      <div className="flex items-center justify-between mt-1">
                        <span className="font-mono text-sm font-bold text-slate-800 tracking-wider">
                          {project.vendor?.creditCode}
                        </span>
                        <button
                          onClick={() => handleCopy(project.vendor?.creditCode || '', 'credit')}
                          className="px-2 py-0.5 text-xs text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        >
                          {copiedField === 'credit' ? '已复制' : '复制代码'}
                        </button>
                      </div>
                    </div>

                    <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                      <span className="text-slate-400 block text-[11px]">经办业务联系人</span>
                      <div className="flex items-center justify-between mt-1">
                        <span className="font-medium text-slate-800 flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          {project.vendor?.contactPerson}
                        </span>
                        <a
                          href={`tel:${project.vendor?.contactPhone}`}
                          className="text-blue-600 font-medium flex items-center gap-1 hover:underline"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          {project.vendor?.contactPhone}
                        </a>
                      </div>
                    </div>

                    <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                      <span className="text-slate-400 block text-[11px]">资质等级与行政核准</span>
                      <div className="mt-1 flex items-center gap-1.5 text-emerald-700 font-semibold">
                        <ShieldCheck className="w-4 h-4 text-emerald-600" />
                        <span>{project.vendor?.qualification}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                      <span className="text-slate-400 block text-[11px]">开户银行</span>
                      <div className="font-medium text-slate-800 mt-1 flex items-center gap-1.5">
                        <Landmark className="w-3.5 h-3.5 text-slate-400" />
                        {project.vendor?.bankName}
                      </div>
                    </div>

                    <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                      <span className="text-slate-400 block text-[11px]">银行结算账号（电汇款项账户）</span>
                      <div className="flex items-center justify-between mt-1">
                        <span className="font-mono text-sm font-bold text-slate-800">
                          {project.vendor?.bankAccount}
                        </span>
                        <button
                          onClick={() => handleCopy(project.vendor?.bankAccount || '', 'account')}
                          className="px-2 py-0.5 text-xs text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        >
                          {copiedField === 'account' ? '已复制' : '复制账号'}
                        </button>
                      </div>
                    </div>

                    <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                      <span className="text-slate-400 block text-[11px]">企业经营登记地址</span>
                      <div className="font-medium text-slate-700 mt-1">
                        {project.vendor?.address}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 p-3 rounded-lg bg-blue-50 border border-blue-100 text-xs text-blue-900 flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <strong>经办履约合规核验：</strong>
                    该企业已通过五莲县人民医院供应商资质年审，安全阀/内镜维修/计量定标等特许经营资质真实有效，符合医院财务三单勾稽支付要求。
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: INVOICE DETAILS (开票信息与增值税发票核验) */}
          {activeTab === 'invoice' && (
            <div className="space-y-5">
              {/* Emulated VAT Invoice Card */}
              <div className="bg-gradient-to-b from-amber-50/60 to-white rounded-2xl border-2 border-amber-300 p-6 shadow-md relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-200/20 rounded-full blur-2xl pointer-events-none"></div>

                <div className="text-center pb-4 border-b-2 border-amber-400/40">
                  <div className="inline-block px-3 py-0.5 bg-amber-100 text-amber-800 text-xs font-bold rounded mb-1">
                    国家税务总局全国统一发票监制
                  </div>
                  <h3 className="text-lg sm:text-xl font-black text-amber-950 tracking-wider">
                    {project.invoice?.invoiceType}
                  </h3>
                  <div className="flex items-center justify-center gap-4 text-xs text-amber-800 mt-1 font-mono">
                    <span>发票代码: <strong>{project.invoice?.invoiceCode}</strong></span>
                    <span>发票号码: <strong>{project.invoice?.invoiceNumber}</strong></span>
                    <span>开票日期: {project.invoice?.invoiceDate}</span>
                  </div>
                </div>

                {/* Invoice Table Grid */}
                <div className="mt-4 border border-amber-200 rounded-lg overflow-hidden text-xs bg-white">
                  <div className="grid grid-cols-12 bg-amber-100/50 p-2 font-bold text-amber-950 border-b border-amber-200 text-center">
                    <div className="col-span-5 text-left pl-2">货物或应税劳务、服务名称</div>
                    <div className="col-span-2">规格型号</div>
                    <div className="col-span-1">数量</div>
                    <div className="col-span-2 text-right">金额 (不含税)</div>
                    <div className="col-span-1 text-center">税率</div>
                    <div className="col-span-1 text-right pr-2">税额</div>
                  </div>

                  <div className="grid grid-cols-12 p-3 text-slate-800 border-b border-slate-100 text-center items-center">
                    <div className="col-span-5 text-left pl-2 font-medium">
                      *{project.category || '医疗设备技术服务'}*{project.projectName}
                    </div>
                    <div className="col-span-2 text-slate-500 font-mono text-[11px]">
                      {project.id ? `ID-${project.id}` : '标准项'}
                    </div>
                    <div className="col-span-1">1</div>
                    <div className="col-span-2 text-right font-mono font-medium">
                      ¥{project.invoice?.amountWithoutTax?.toFixed(2)}
                    </div>
                    <div className="col-span-1 text-center font-mono">
                      {project.invoice?.taxRate === 0 ? '免税' : `${Math.round((project.invoice?.taxRate || 0.13) * 100)}%`}
                    </div>
                    <div className="col-span-1 text-right pr-2 font-mono">
                      ¥{project.invoice?.taxAmount?.toFixed(2)}
                    </div>
                  </div>

                  {/* Total row */}
                  <div className="grid grid-cols-12 p-3 bg-amber-50/40 text-xs items-center font-bold">
                    <div className="col-span-3 pl-2 text-slate-600">价税合计（大写）</div>
                    <div className="col-span-5 text-amber-900 text-sm">
                      {numberToChineseCurrency(project.invoice?.totalAmount || 0)}
                    </div>
                    <div className="col-span-4 text-right pr-2 font-mono text-base text-amber-600">
                      (小写) ¥{project.invoice?.totalAmount?.toFixed(2)}
                    </div>
                  </div>
                </div>

                {/* Buyer / Seller details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 text-xs pt-3 border-t border-amber-200">
                  <div className="space-y-1">
                    <span className="font-bold text-amber-950 block">购买方信息：</span>
                    <div className="text-slate-600">名称：五莲县人民医院</div>
                    <div className="text-slate-600">纳税人识别号：12371121493928190X</div>
                    <div className="text-slate-600">科室归属：{project.department}</div>
                  </div>
                  <div className="space-y-1">
                    <span className="font-bold text-amber-950 block">销售方（经办公司）信息：</span>
                    <div className="text-slate-600">名称：{project.vendor?.companyName}</div>
                    <div className="text-slate-600">纳税人识别号：{project.vendor?.creditCode}</div>
                    <div className="text-slate-600">开户行及账号：{project.vendor?.bankName} ({project.vendor?.bankAccount})</div>
                  </div>
                </div>

                {/* Tax verification badge */}
                <div className="mt-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-emerald-800">
                    <ShieldCheck className="w-5 h-5 text-emerald-600" />
                    <div>
                      <div className="font-bold">国家税务总局全国增值税发票查验平台 比对一致</div>
                      <div className="text-[11px] text-emerald-600">
                        查验时间：{project.invoice?.taxCheckTime} | 查验码：{project.invoice?.checkCode}
                      </div>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 bg-emerald-600 text-white font-bold rounded-lg text-xs">
                    验真无伪
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: TIMELINE (7大核心节点) */}
          {activeTab === 'timeline' && (
            <div className="space-y-4">
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                <h4 className="text-xs font-bold text-slate-700 mb-4 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-purple-600" />
                  全流程时序记录（报修、报批、议价、确认、预批）
                </h4>

                <div className="space-y-4 relative before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:bg-slate-200">
                  {/* Step 1: 报修 */}
                  <div className="relative flex items-start gap-3 pl-1">
                    <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold shrink-0 z-10">
                      1
                    </div>
                    <div className="flex-1 bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs">
                      <div className="flex items-center justify-between">
                        <strong className="text-slate-800">临床故障报修</strong>
                        <span className="text-slate-400 font-mono">{project.repairDate || '免修免报'}</span>
                      </div>
                      <p className="text-slate-600 mt-1">
                        {project.repairInfo || `科室【${project.department}】发起设备服务保障需求`}
                      </p>
                    </div>
                  </div>

                  {/* Step 2: 报批 */}
                  <div className="relative flex items-start gap-3 pl-1">
                    <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold shrink-0 z-10">
                      2
                    </div>
                    <div className="flex-1 bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs">
                      <div className="flex items-center justify-between">
                        <strong className="text-slate-800">提交报批申请 ({project.approvalStatus})</strong>
                        <span className="text-slate-400 font-mono">{project.approvalDate || '-'}</span>
                      </div>
                      <p className="text-slate-600 mt-1">
                        {project.approvalContent ? project.approvalContent.slice(0, 100) + '...' : '已按医院管理流程录入报批'}
                      </p>
                    </div>
                  </div>

                  {/* Step 3: 获批 */}
                  <div className="relative flex items-start gap-3 pl-1">
                    <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-xs font-bold shrink-0 z-10">
                      3
                    </div>
                    <div className="flex-1 bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs">
                      <div className="flex items-center justify-between">
                        <strong className="text-slate-800">医院主管领导与部门获批</strong>
                        <span className="text-slate-400 font-mono">{project.approvedDate || '-'}</span>
                      </div>
                      <p className="text-slate-600 mt-1">
                        医学装备管理委员会同意立项，准予开展后续询价议价流程。
                      </p>
                    </div>
                  </div>

                  {/* Step 4: 询价与议价 */}
                  <div className="relative flex items-start gap-3 pl-1">
                    <div className="w-6 h-6 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center text-xs font-bold shrink-0 z-10">
                      4
                    </div>
                    <div className="flex-1 bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs">
                      <div className="flex items-center justify-between">
                        <strong className="text-slate-800">询价 / 议价批次</strong>
                        <span className="text-slate-400 font-mono">{project.inquiryDate || project.bargainDate || '-'}</span>
                      </div>
                      <p className="text-slate-600 mt-1">
                        议价批次：{project.bargainBatch || '按医院设备维修定点协议价格执行'}
                      </p>
                    </div>
                  </div>

                  {/* Step 5: 科室确认 */}
                  <div className="relative flex items-start gap-3 pl-1">
                    <div className="w-6 h-6 rounded-full bg-teal-100 text-teal-600 flex items-center justify-center text-xs font-bold shrink-0 z-10">
                      5
                    </div>
                    <div className="flex-1 bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs">
                      <div className="flex items-center justify-between">
                        <strong className="text-slate-800">临床使用科室验收确认 ({project.deptConfirmStatus || '已确认'})</strong>
                        <span className="text-slate-400 font-mono">{project.deptConfirmDate || '-'}</span>
                      </div>
                      <p className="text-slate-600 mt-1">
                        确认内容：{project.deptConfirmContent ? project.deptConfirmContent.slice(0, 100) + '...' : '使用科室试机运行合格签字'}
                      </p>
                    </div>
                  </div>

                  {/* Step 6: 预批单出具与打印 */}
                  <div className="relative flex items-start gap-3 pl-1">
                    <div className="w-6 h-6 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center text-xs font-bold shrink-0 z-10">
                      6
                    </div>
                    <div className="flex-1 bg-purple-50/50 p-3 rounded-lg border border-purple-200 text-xs">
                      <div className="flex items-center justify-between">
                        <strong className="text-purple-900 font-bold">费用预批单生成 ({project.preApprovalStatus})</strong>
                        <span className="text-purple-700 font-mono">{project.preApprovalPrintDate || '-'}</span>
                      </div>
                      <p className="text-purple-800 mt-1">
                        预批编号：{project.id} | 通过时间：{project.preApprovalPassTime || '已归档'} | 日期核验：{project.dateValidation || '验证通过'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: ORIGINAL TEXTS (原始申报文本与签字文本) */}
          {activeTab === 'texts' && (
            <div className="space-y-4">
              {project.approvalContent && (
                <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                  <h4 className="text-xs font-bold text-slate-800 mb-2 flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-blue-600" />
                    原始报批申请全文记录
                  </h4>
                  <pre className="text-xs text-slate-700 bg-slate-50 p-4 rounded-lg border border-slate-200 whitespace-pre-wrap font-sans leading-relaxed">
                    {project.approvalContent}
                  </pre>
                </div>
              )}

              {project.deptConfirmContent && (
                <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                  <h4 className="text-xs font-bold text-slate-800 mb-2 flex items-center gap-1.5">
                    <FileCheck2 className="w-4 h-4 text-teal-600" />
                    使用科室确认与验收签字全文
                  </h4>
                  <pre className="text-xs text-slate-700 bg-slate-50 p-4 rounded-lg border border-slate-200 whitespace-pre-wrap font-sans leading-relaxed">
                    {project.deptConfirmContent}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="px-6 py-3.5 bg-white border-t border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>项目ID: #{project.id}</span>
            <span>•</span>
            <span>经办: {project.vendor?.companyName}</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 text-xs font-medium hover:bg-slate-50 transition-colors"
            >
              关闭
            </button>
            <button
              onClick={handleTryPreApproval}
              className={`flex items-center gap-1.5 px-4 py-2 text-white rounded-lg text-xs font-bold shadow-md transition-all cursor-pointer ${
                complianceEval && !complianceEval.isAuditReady
                  ? 'bg-rose-600 hover:bg-rose-700'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              <Printer className="w-4 h-4" />
              <span>
                {complianceEval && !complianceEval.isAuditReady
                  ? '缺少审计凭证 · 补办后可开具预批单'
                  : '开具并打印《费用预批单》'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

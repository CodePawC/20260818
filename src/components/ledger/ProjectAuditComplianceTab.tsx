import React, { useState, useMemo, useEffect } from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  FileText,
  Upload,
  Plus,
  Trash2,
  Scale,
  Gavel,
  Send,
  ExternalLink,
  Check,
  Clock,
  Paperclip,
  Users,
  Building2,
  History,
  Coins
} from 'lucide-react';
import {
  ApprovalProof,
  BiddingRecordSummary,
  ComparisonQuoteRecord,
  HospitalProjectRecord,
  MeetingMinutesRecord,
  ProjectAuditComplianceDossier
} from '../../types/hospitalProjectLedgerTypes';
import { ApprovalApplication } from '../../types/approvalTypes';
import { BiddingProject, VendorCollaborationOrder } from '../../types/vendorCollaborationTypes';
import {
  evaluateProjectAuditCompliance,
  PROCUREMENT_MODE_META,
  resolveProcurementMode
} from '../../utils/complianceAuditEngine';

interface ProjectAuditComplianceTabProps {
  project: HospitalProjectRecord;
  approvals: ApprovalApplication[];
  vendorOrders: VendorCollaborationOrder[];
  biddingProjects: BiddingProject[];
  blockedAlert?: { message: string; missingItems: string[] } | null;
  onProjectUpdated: (updatedProject: HospitalProjectRecord) => void;
  onLaunchElectronicApproval?: (project: HospitalProjectRecord) => void;
  onNavigateVendorOrder?: (vendorOrderId: string) => void;
  onOpenPreApproval?: (project: HospitalProjectRecord) => void;
}

const MEETING_TYPE_LABELS: Record<MeetingMinutesRecord['meetingType'], string> = {
  dept_meeting: '科室专题会/维修论证会',
  joint_negotiation: '多科室联合议价会',
  equipment_committee: '医学装备管理委员会',
  bidding_evaluation: '公开/邀请招标评标会'
};

function readFileAsDataUrl(file: File): Promise<{ name: string; dataUrl: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve({ name: file.name, dataUrl: String(reader.result || '') });
    reader.onerror = () => reject(new Error('文件读取失败'));
    reader.readAsDataURL(file);
  });
}

export const ProjectAuditComplianceTab: React.FC<ProjectAuditComplianceTabProps> = ({
  project,
  approvals,
  vendorOrders,
  biddingProjects,
  blockedAlert,
  onProjectUpdated,
  onLaunchElectronicApproval,
  onNavigateVendorOrder,
  onOpenPreApproval
}) => {
  const evaluation = useMemo(
    () =>
      evaluateProjectAuditCompliance(project, {
        approvals,
        vendorOrders,
        biddingProjects
      }),
    [project, approvals, vendorOrders, biddingProjects]
  );

  const dossier: ProjectAuditComplianceDossier = useMemo(
    () =>
      project.complianceDossier || {
        hasCost: evaluation.hasCost,
        estimatedAmount: evaluation.effectiveAmount,
        approvedBudgetAmount: evaluation.effectiveAmount,
        requiredMode: evaluation.requiredMode,
        createdFromStage: 'legacy',
        approvalProof: { mode: 'none' },
        comparisonQuotes: [],
        meetingMinutes: [],
        auditTrail: []
      },
    [project.complianceDossier, evaluation]
  );

  // Saving & feedback state
  const [savingAction, setSavingAction] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Budget adjuster
  const [budgetInput, setBudgetInput] = useState<string>(String(evaluation.effectiveAmount || 0));

  // Pillar 1: Paper scan state
  const [selectedApprovalId, setSelectedApprovalId] = useState<string>(
    dossier.approvalProof?.electronicApprovalId || ''
  );
  const [paperDocNo, setPaperDocNo] = useState<string>(dossier.approvalProof?.paperDocNo || '');
  const [paperApprover, setPaperApprover] = useState<string>(dossier.approvalProof?.paperApprover || '');
  const [paperApprovedDate, setPaperApprovedDate] = useState<string>(
    dossier.approvalProof?.paperApprovedDate || new Date().toISOString().slice(0, 10)
  );
  const [paperAttachmentName, setPaperAttachmentName] = useState<string>(
    dossier.approvalProof?.paperAttachmentName || ''
  );
  const [paperAttachmentDataUrl, setPaperAttachmentDataUrl] = useState<string>(
    dossier.approvalProof?.paperAttachmentDataUrl || ''
  );
  const [paperRemarks, setPaperRemarks] = useState<string>(dossier.approvalProof?.paperRemarks || '');

  // Pillar 2A: <=5k comparison quote form
  const [quoteVendor, setQuoteVendor] = useState('');
  const [quoteContact, setQuoteContact] = useState('');
  const [quotePhone, setQuotePhone] = useState('');
  const [quoteAmount, setQuoteAmount] = useState('');
  const [quoteWarranty, setQuoteWarranty] = useState('12');
  const [quoteAttachmentName, setQuoteAttachmentName] = useState('');

  // Pillar 2B: 5k-50k negotiation form
  const [negBatch, setNegBatch] = useState<string>(
    dossier.negotiationBatch || `NEG-${new Date().getFullYear()}-${project.id.slice(-4)}`
  );
  const [negDate, setNegDate] = useState<string>(
    dossier.negotiationDate || new Date().toISOString().slice(0, 10)
  );
  const [negFinalPrice, setNegFinalPrice] = useState<string>(
    dossier.negotiationFinalPrice
      ? String(dossier.negotiationFinalPrice)
      : String(evaluation.effectiveAmount || '')
  );

  // Pillar 2C: >50k bidding form
  const [bidMethod, setBidMethod] = useState<BiddingRecordSummary['biddingMethod']>(
    dossier.biddingRecord?.biddingMethod || 'open_tender'
  );
  const [bidTitle, setBidTitle] = useState<string>(
    dossier.biddingRecord?.biddingTitle || `${project.projectName}公开招标采购`
  );
  const [bidNo, setBidNo] = useState<string>(dossier.biddingRecord?.biddingNo || '');
  const [bidOpenDate, setBidOpenDate] = useState<string>(
    dossier.biddingRecord?.bidOpenDate || new Date().toISOString().slice(0, 10)
  );
  const [bidderCount, setBidderCount] = useState<string>(String(dossier.biddingRecord?.bidderCount || 3));
  const [winningVendor, setWinningVendor] = useState<string>(dossier.biddingRecord?.winningVendor || '');
  const [winningAmount, setWinningAmount] = useState<string>(
    dossier.biddingRecord?.winningAmount
      ? String(dossier.biddingRecord.winningAmount)
      : String(evaluation.effectiveAmount || '')
  );
  const [winnerNoticeNo, setWinnerNoticeNo] = useState<string>(dossier.biddingRecord?.winnerNoticeNo || '');
  const [bidAttachmentName, setBidAttachmentName] = useState<string>(
    dossier.biddingRecord?.attachmentName || ''
  );
  const [bidAttachmentDataUrl, setBidAttachmentDataUrl] = useState<string>(
    dossier.biddingRecord?.attachmentDataUrl || ''
  );

  // Pillar 3: Meeting minutes form
  const [minType, setMinType] = useState<MeetingMinutesRecord['meetingType']>(
    evaluation.requiredMode === 'bidding'
      ? 'equipment_committee'
      : evaluation.requiredMode === 'negotiation'
      ? 'joint_negotiation'
      : 'dept_meeting'
  );
  const [minTitle, setMinTitle] = useState<string>(
    `${project.projectName}专题审议会议纪要`
  );
  const [minDate, setMinDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [minDocNo, setMinDocNo] = useState<string>(
    `HYJY-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`
  );
  const [minHost, setMinHost] = useState<string>('张明理（分管副院长）/ 张主任（医学工程科）');
  const [minAttendees, setMinAttendees] = useState<string>('医学工程科、使用临床科室、财务科、审计监察室');
  const [minSummary, setMinSummary] = useState<string>('');
  const [minAttachmentName, setMinAttachmentName] = useState<string>('');
  const [minAttachmentDataUrl, setMinAttachmentDataUrl] = useState<string>('');

  useEffect(() => {
    setBudgetInput(String(evaluation.effectiveAmount || 0));
    setSelectedApprovalId(project.complianceDossier?.approvalProof?.electronicApprovalId || '');
    setPaperDocNo(project.complianceDossier?.approvalProof?.paperDocNo || '');
    setPaperApprover(project.complianceDossier?.approvalProof?.paperApprover || '');
    setPaperApprovedDate(
      project.complianceDossier?.approvalProof?.paperApprovedDate || new Date().toISOString().slice(0, 10)
    );
    setPaperAttachmentName(project.complianceDossier?.approvalProof?.paperAttachmentName || '');
    setPaperAttachmentDataUrl(project.complianceDossier?.approvalProof?.paperAttachmentDataUrl || '');
    setPaperRemarks(project.complianceDossier?.approvalProof?.paperRemarks || '');
    if (project.complianceDossier?.negotiationFinalPrice) {
      setNegFinalPrice(String(project.complianceDossier.negotiationFinalPrice));
    }
    if (project.complianceDossier?.biddingRecord) {
      setBidNo(project.complianceDossier.biddingRecord.biddingNo || '');
      setWinningVendor(project.complianceDossier.biddingRecord.winningVendor || '');
      if (project.complianceDossier.biddingRecord.winningAmount) {
        setWinningAmount(String(project.complianceDossier.biddingRecord.winningAmount));
      }
      setWinnerNoticeNo(project.complianceDossier.biddingRecord.winnerNoticeNo || '');
      setBidAttachmentName(project.complianceDossier.biddingRecord.attachmentName || '');
    }
  }, [project.id, project.complianceDossier]);

  const linkedVendorOrder = useMemo(
    () =>
      vendorOrders.find(
        v =>
          (dossier.linkedVendorOrderId && v.id === dossier.linkedVendorOrderId) ||
          (dossier.sourceVendorOrderId && v.id === dossier.sourceVendorOrderId) ||
          (dossier.sourceWorkOrderId && v.workOrderId === dossier.sourceWorkOrderId)
      ) || null,
    [vendorOrders, dossier]
  );

  const linkedBiddingProject = useMemo(
    () =>
      biddingProjects.find(
        b =>
          (dossier.biddingRecord?.linkedBiddingId && b.id === dossier.biddingRecord.linkedBiddingId) ||
          (dossier.biddingRecord?.biddingNo && b.id === dossier.biddingRecord.biddingNo)
      ) || null,
    [biddingProjects, dossier.biddingRecord]
  );

  const persistCompliancePatch = async (payload: {
    compliancePatch?: Partial<ProjectAuditComplianceDossier>;
    approvedBudgetAmount?: number;
    vendorPatch?: Record<string, any>;
    invoicePatch?: Record<string, any>;
    actionLabel: string;
    actionDetail: string;
  }) => {
    setSavingAction(payload.actionLabel);
    setFeedback(null);
    try {
      const resp = await fetch(`/api/project-ledger/${encodeURIComponent(project.id)}/compliance`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const json = await resp.json().catch(() => ({}));
      if (!resp.ok || !json.success || !json.data) {
        setFeedback({ type: 'error', text: json.error || '保存失败，请检查权限或字段完整性' });
        return null;
      }
      onProjectUpdated(json.data);
      window.dispatchEvent(new CustomEvent('medtech:project-ledger-updated', { detail: { project: json.data } }));
      window.dispatchEvent(new CustomEvent('work_orders_updated'));
      setFeedback({ type: 'success', text: `已保存「${payload.actionLabel}」，审计核验进度已更新` });
      return json.data as HospitalProjectRecord;
    } catch {
      setFeedback({ type: 'error', text: '网络请求失败，请确认服务连接正常' });
      return null;
    } finally {
      setSavingAction(null);
    }
  };

  // Handlers
  const handleSaveBudget = async () => {
    const amt = Number(budgetInput || 0);
    if (!Number.isFinite(amt) || amt < 0) return;
    await persistCompliancePatch({
      approvedBudgetAmount: amt,
      compliancePatch: {
        hasCost: amt > 0,
        estimatedAmount: amt,
        approvedBudgetAmount: amt,
        requiredMode: resolveProcurementMode(amt > 0, amt)
      },
      actionLabel: '核定项目预算金额',
      actionDetail: `核定项目金额为 ¥${amt.toLocaleString()}，适用采购治理等级自动判定为「${PROCUREMENT_MODE_META[resolveProcurementMode(amt > 0, amt)].label}」`
    });
  };

  const handleBindElectronicApproval = async (appId: string) => {
    setSelectedApprovalId(appId);
    const found = approvals.find(a => a.id === appId);
    if (!found) return;
    const hasPaper = Boolean(dossier.approvalProof?.paperDocNo);
    const nextProof: ApprovalProof = {
      ...dossier.approvalProof,
      mode: hasPaper ? 'both' : 'electronic',
      electronicApprovalId: found.id,
      electronicApprovalTitle: found.title,
      electronicStatus: found.status
    };
    await persistCompliancePatch({
      compliancePatch: { approvalProof: nextProof },
      actionLabel: '关联电子审批单',
      actionDetail: `绑定电子审批单 ${found.id}（${found.title} · 状态：${found.status}）`
    });
  };

  const handleSavePaperProof = async () => {
    if (!paperDocNo.trim() || !paperApprover.trim()) {
      setFeedback({ type: 'error', text: '请填写纸质审批单号及签批人姓名' });
      return;
    }
    if (!paperAttachmentName.trim() && !paperAttachmentDataUrl) {
      setFeedback({ type: 'error', text: '请上传盖章签字后的纸质申请单扫描件或照片作为审计底稿' });
      return;
    }
    const hasElec = Boolean(dossier.approvalProof?.electronicApprovalId);
    const nextProof: ApprovalProof = {
      ...dossier.approvalProof,
      mode: hasElec ? 'both' : 'paper_scan',
      paperDocNo: paperDocNo.trim(),
      paperApprover: paperApprover.trim(),
      paperApprovedDate: paperApprovedDate || new Date().toISOString().slice(0, 10),
      paperAttachmentName: paperAttachmentName.trim(),
      paperAttachmentDataUrl: paperAttachmentDataUrl || undefined,
      paperRemarks: paperRemarks.trim() || undefined,
      verified: true
    };
    await persistCompliancePatch({
      compliancePatch: { approvalProof: nextProof },
      actionLabel: '上传盖章纸质申请单扫描件',
      actionDetail: `归档纸质审批单 ${nextProof.paperDocNo}（签批人：${nextProof.paperApprover}，附件：${nextProof.paperAttachmentName}）`
    });
  };

  const handleAddComparisonQuote = async () => {
    const amt = Number(quoteAmount || 0);
    if (!quoteVendor.trim() || amt <= 0) {
      setFeedback({ type: 'error', text: '请输入比价供应商全称及有效报价金额' });
      return;
    }
    const currentQuotes = dossier.comparisonQuotes || [];
    const newQuote: ComparisonQuoteRecord = {
      id: `CMP-${Date.now().toString().slice(-6)}`,
      vendorName: quoteVendor.trim(),
      contactPerson: quoteContact.trim() || undefined,
      contactPhone: quotePhone.trim() || undefined,
      quoteAmount: amt,
      warrantyMonths: Number(quoteWarranty || 12),
      isSelected: currentQuotes.length === 0,
      attachmentName: quoteAttachmentName.trim() || `${quoteVendor.trim()}_报价单.pdf`,
      quotedAt: new Date().toISOString().slice(0, 10)
    };
    const nextQuotes = [...currentQuotes, newQuote];
    await persistCompliancePatch({
      compliancePatch: { comparisonQuotes: nextQuotes },
      actionLabel: '录入比价供应商报价',
      actionDetail: `录入【${newQuote.vendorName}】报价 ¥${amt.toLocaleString()}（累计 ${nextQuotes.length} 家比价）`
    });
    setQuoteVendor('');
    setQuoteContact('');
    setQuotePhone('');
    setQuoteAmount('');
    setQuoteAttachmentName('');
  };

  const handleSelectComparisonWinner = async (quoteId: string) => {
    const nextQuotes = (dossier.comparisonQuotes || []).map(q => ({
      ...q,
      isSelected: q.id === quoteId
    }));
    const winner = nextQuotes.find(q => q.id === quoteId);
    if (!winner) return;
    await persistCompliancePatch({
      approvedBudgetAmount: winner.quoteAmount,
      compliancePatch: {
        comparisonQuotes: nextQuotes,
        approvedBudgetAmount: winner.quoteAmount
      },
      vendorPatch: {
        companyName: winner.vendorName,
        contactPerson: winner.contactPerson || project.vendor?.contactPerson,
        contactPhone: winner.contactPhone || project.vendor?.contactPhone
      },
      invoicePatch: {
        totalAmount: winner.quoteAmount
      },
      actionLabel: '比价定标选定中选供应商',
      actionDetail: `从 ${nextQuotes.length} 家比价方中选定【${winner.vendorName}】，核定成交价 ¥${winner.quoteAmount.toLocaleString()}`
    });
  };

  const handleRemoveComparisonQuote = async (quoteId: string) => {
    const nextQuotes = (dossier.comparisonQuotes || []).filter(q => q.id !== quoteId);
    await persistCompliancePatch({
      compliancePatch: { comparisonQuotes: nextQuotes },
      actionLabel: '移除比价记录',
      actionDetail: `调整比价清单，剩余 ${nextQuotes.length} 家报价`
    });
  };

  const handleSaveManualNegotiation = async () => {
    const finalAmt = Number(negFinalPrice || 0);
    if (finalAmt <= 0) {
      setFeedback({ type: 'error', text: '请填写多科室联合议价后的最终审定成交金额' });
      return;
    }
    await persistCompliancePatch({
      approvedBudgetAmount: finalAmt,
      compliancePatch: {
        negotiationCompleted: true,
        negotiationFinalPrice: finalAmt,
        negotiationDate: negDate,
        negotiationBatch: negBatch.trim() || `NEG-${project.id}`,
        approvedBudgetAmount: finalAmt
      },
      invoicePatch: { totalAmount: finalAmt },
      actionLabel: '完成多科室联合议价定标',
      actionDetail: `批次 ${negBatch} 多科室联合议价定标成交价 ¥${finalAmt.toLocaleString()}`
    });
  };

  const handleLaunchBidding = async () => {
    setSavingAction('发起招标立项');
    setFeedback(null);
    try {
      const budget = Number(budgetInput || evaluation.effectiveAmount || 60000);
      const resp = await fetch(`/api/project-ledger/${encodeURIComponent(project.id)}/bidding-launch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          biddingTitle: bidTitle.trim() || `${project.projectName}公开招标`,
          biddingMethod: bidMethod,
          maxBudget: budget
        })
      });
      const json = await resp.json().catch(() => ({}));
      if (!resp.ok || !json.success || !json.project) {
        setFeedback({ type: 'error', text: json.error || '发起招标立项失败' });
        return;
      }
      onProjectUpdated(json.project);
      window.dispatchEvent(new CustomEvent('medtech:project-ledger-updated', { detail: { project: json.project } }));
      setFeedback({
        type: 'success',
        text: `已成功发布招标项目 ${json.biddingProject?.id} 至供应商公开竞价中心！`
      });
    } catch {
      setFeedback({ type: 'error', text: '发起招标立项请求失败，请检查网络' });
    } finally {
      setSavingAction(null);
    }
  };

  const handleSaveBiddingAward = async () => {
    const winAmt = Number(winningAmount || 0);
    if (!bidNo.trim() || !winningVendor.trim() || winAmt <= 0 || (!winnerNoticeNo.trim() && !bidAttachmentName.trim())) {
      setFeedback({
        type: 'error',
        text: '请完整填写招标编号、中标供应商、中标成交金额及中标通知书编号或扫描件'
      });
      return;
    }
    const nextBidding: BiddingRecordSummary = {
      linkedBiddingId: dossier.biddingRecord?.linkedBiddingId || linkedBiddingProject?.id,
      biddingNo: bidNo.trim(),
      biddingTitle: bidTitle.trim() || `${project.projectName}招标采购`,
      biddingMethod: bidMethod,
      bidOpenDate: bidOpenDate || new Date().toISOString().slice(0, 10),
      bidderCount: Number(bidderCount || 3),
      winningVendor: winningVendor.trim(),
      winningAmount: winAmt,
      winnerNoticeNo: winnerNoticeNo.trim() || undefined,
      attachmentName: bidAttachmentName.trim() || undefined,
      attachmentDataUrl: bidAttachmentDataUrl || undefined,
      status: 'awarded'
    };
    await persistCompliancePatch({
      approvedBudgetAmount: winAmt,
      compliancePatch: {
        biddingRecord: nextBidding,
        approvedBudgetAmount: winAmt
      },
      vendorPatch: { companyName: nextBidding.winningVendor },
      invoicePatch: { totalAmount: winAmt },
      actionLabel: '归档开标结果与中标通知书',
      actionDetail: `标号 ${nextBidding.biddingNo} 已定标【${nextBidding.winningVendor}】¥${winAmt.toLocaleString()}`
    });
  };

  const handleAddMeetingMinute = async () => {
    if (!minTitle.trim() || !minDate.trim() || !minSummary.trim() || (!minDocNo.trim() && !minAttachmentName.trim())) {
      setFeedback({
        type: 'error',
        text: '请填写会议纪要标题、日期、纪要文号（或上传扫描件）及核心决议摘要'
      });
      return;
    }
    const newMin: MeetingMinutesRecord = {
      id: `MIN-${Date.now().toString().slice(-6)}`,
      meetingType: minType,
      title: minTitle.trim(),
      meetingDate: minDate,
      docNo: minDocNo.trim(),
      hostName: minHost.trim() || '医学工程科',
      attendees: minAttendees.trim() || '装备委员会成员',
      resolutionSummary: minSummary.trim(),
      attachmentName: minAttachmentName.trim() || undefined,
      attachmentDataUrl: minAttachmentDataUrl || undefined,
      uploadedBy: '医工管理部门',
      uploadedAt: new Date().toISOString().replace('T', ' ').slice(0, 16)
    };
    const nextMinutes = [newMin, ...(dossier.meetingMinutes || [])];
    await persistCompliancePatch({
      compliancePatch: { meetingMinutes: nextMinutes },
      actionLabel: '归档会议纪要决议',
      actionDetail: `已上传《${newMin.title}》（${newMin.docNo || newMin.attachmentName} · ${newMin.meetingDate}）`
    });
    setMinSummary('');
    setMinAttachmentName('');
    setMinAttachmentDataUrl('');
  };

  const handleDeleteMeetingMinute = async (minId: string) => {
    const nextMinutes = (dossier.meetingMinutes || []).filter(m => m.id !== minId);
    await persistCompliancePatch({
      compliancePatch: { meetingMinutes: nextMinutes },
      actionLabel: '删除会议纪要记录',
      actionDetail: `移除一份会议纪要（剩余 ${nextMinutes.length} 份）`
    });
  };

  const auditTrail = dossier.auditTrail || [];

  return (
    <div className="space-y-5 text-xs">
      {/* 1. 审计合规门禁总览状态卡 (无 border-l-4，单层平铺 1px 细边框) */}
      <div
        className={`rounded-xl border p-4 space-y-3 ${
          evaluation.isAuditReady
            ? 'bg-emerald-50/60 border-emerald-200'
            : 'bg-rose-50/60 border-rose-200'
        }`}
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              {evaluation.isAuditReady ? (
                <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
              )}
              <h4 className={`text-sm font-bold ${evaluation.isAuditReady ? 'text-emerald-950' : 'text-rose-950'}`}>
                {evaluation.isAuditReady
                  ? '审计三支柱材料已全部齐备 · 准予出具预批单与财务归档'
                  : '审计强阻断拦截中 · 缺关键合规凭证禁止归档或核销付款'}
              </h4>
            </div>
            <p className={`text-xs ${evaluation.isAuditReady ? 'text-emerald-800' : 'text-rose-800'}`}>
              完成进度：<strong className="font-mono tabular-nums">{evaluation.completedCount} / 3</strong> 项 ·
              适用等级：<strong>{evaluation.requiredModeMeta.label}</strong>
              {dossier.sourceWorkOrderId && (
                <span className="ml-2 font-mono">· 关联工单 {dossier.sourceWorkOrderId}</span>
              )}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {evaluation.isAuditReady && onOpenPreApproval && (
              <button
                type="button"
                onClick={() => onOpenPreApproval(project)}
                className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-bold flex items-center gap-1.5 cursor-pointer transition"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>合规放行 · 生成费用预批单</span>
              </button>
            )}
          </div>
        </div>

        {(blockedAlert?.missingItems?.length || (!evaluation.isAuditReady && evaluation.missingItems.length > 0)) && (
          <div className="bg-white/90 border border-rose-200 rounded-lg p-3 space-y-1">
            <div className="font-bold text-rose-800">
              {blockedAlert?.message || '以下合规材料缺失，系统依据三甲内控与审计要求执行强阻断：'}
            </div>
            <ul className="list-disc pl-5 space-y-0.5 text-rose-700">
              {(blockedAlert?.missingItems?.length ? blockedAlert.missingItems : evaluation.missingItems).map(
                (item, i) => (
                  <li key={i}>{item}</li>
                )
              )}
            </ul>
          </div>
        )}

        {/* 三支柱快速核对条 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
          {[evaluation.pillarApproval, evaluation.pillarPricing, evaluation.pillarMinutes].map((p, idx) => (
            <div
              key={idx}
              className={`p-2.5 rounded-lg border bg-white flex items-start gap-2 ${
                p.passed ? 'border-emerald-200' : 'border-rose-200'
              }`}
            >
              {p.passed ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <Clock className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              )}
              <div className="min-w-0">
                <div className="font-bold text-slate-900 flex items-center gap-1.5 flex-wrap">
                  <span>{idx + 1}. {p.label}</span>
                  {p.modeLabel && (
                    <span className={`text-[10px] font-semibold ${p.passed ? 'text-emerald-700' : 'text-rose-600'}`}>
                      ({p.modeLabel})
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-slate-600 mt-0.5 leading-snug">{p.detail}</div>
              </div>
            </div>
          ))}
        </div>

        {/* 预算与分级基准核定栏 */}
        <div className="bg-white border border-slate-200 rounded-lg p-2.5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <Coins className="w-4 h-4 text-amber-600 shrink-0" />
            <span className="font-semibold text-slate-700">项目核定预算/预估总额 (元)：</span>
            <input
              type="number"
              min={0}
              value={budgetInput}
              onChange={e => setBudgetInput(e.target.value)}
              className="w-28 px-2 py-1 border border-slate-300 rounded font-mono font-bold text-slate-900 tabular-nums"
            />
            <button
              type="button"
              onClick={handleSaveBudget}
              disabled={Boolean(savingAction)}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-900 text-white rounded font-semibold cursor-pointer"
            >
              核定金额并重算红线
            </button>
          </div>
          <div className="text-[11px] text-slate-500 tabular-nums">
            红线规则：≤¥5,000 比价 · ¥5,000–¥50,000 议价 · &gt;¥50,000 招标
          </div>
        </div>
      </div>

      {feedback && (
        <div
          className={`p-3 rounded-lg border text-xs font-semibold flex items-center justify-between ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <span>{feedback.text}</span>
          <button type="button" onClick={() => setFeedback(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
            关闭
          </button>
        </div>
      )}

      {/* 2. 第一支柱：立项审批凭证（电子审批流与纸质扫描件双轨互认） */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-600" />
            <h5 className="text-sm font-bold text-slate-900">支柱一：立项申请与审批凭证（电子审批 / 纸质盖章扫描件双轨互认）</h5>
          </div>
          <span
            className={`text-[11px] font-bold ${
              evaluation.pillarApproval.passed ? 'text-emerald-700' : 'text-rose-600'
            }`}
          >
            {evaluation.pillarApproval.passed ? '已核验通过' : '待补办（满足任意一轨即通过）'}
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* 轨道 A：发起/关联电子审批流 */}
          <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/50 space-y-3">
            <div className="flex items-center justify-between">
              <strong className="text-slate-900">轨道 A：院内电子审批流（自动联锁终审结果）</strong>
              {dossier.approvalProof?.electronicApprovalId && (
                <span className="font-mono text-[11px] text-blue-700 font-bold">
                  {dossier.approvalProof.electronicApprovalId}
                </span>
              )}
            </div>

            {dossier.approvalProof?.electronicApprovalId ? (
              <div className="p-2.5 bg-white rounded border border-slate-200 space-y-1 text-[11px]">
                <div className="font-bold text-slate-800">
                  {dossier.approvalProof.electronicApprovalTitle || '已绑定电子审批单'}
                </div>
                <div className="text-slate-600">
                  当前状态：
                  <strong
                    className={
                      dossier.approvalProof.electronicStatus === 'approved' ||
                      dossier.approvalProof.electronicStatus === 'archived'
                        ? 'text-emerald-700'
                        : 'text-amber-700'
                    }
                  >
                    {dossier.approvalProof.electronicStatus || '审批流转中'}
                  </strong>
                </div>
              </div>
            ) : (
              <p className="text-[11px] text-slate-500">
                尚未关联电子审批单。您可以一键带入本设备与预算发起电子审批，审批中心终审通过后自动解锁本项目。
              </p>
            )}

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <select
                  value={selectedApprovalId}
                  onChange={e => handleBindElectronicApproval(e.target.value)}
                  className="flex-1 bg-white border border-slate-300 rounded-md px-2.5 py-1.5 text-xs text-slate-800"
                >
                  <option value="">-- 选择已有电子审批单进行绑定 --</option>
                  {approvals.map(app => (
                    <option key={app.id} value={app.id}>
                      [{app.id}] {app.title} ({app.status === 'approved' ? '已终审通过' : app.currentApprovalNode})
                    </option>
                  ))}
                </select>
              </div>

              {onLaunchElectronicApproval && (
                <button
                  type="button"
                  onClick={() => onLaunchElectronicApproval(project)}
                  className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold flex items-center justify-center gap-1.5 cursor-pointer transition"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>一键发起电子立项审批流（自动关联 #{project.id}）</span>
                </button>
              )}
            </div>
          </div>

          {/* 轨道 B：补传盖章签字纸质申请单扫描件 */}
          <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/50 space-y-2.5">
            <div className="flex items-center justify-between">
              <strong className="text-slate-900">轨道 B：补传盖章签字纸质申请单扫描件</strong>
              {dossier.approvalProof?.paperDocNo && (
                <span className="font-mono text-[11px] text-emerald-700 font-bold">
                  已归档 {dossier.approvalProof.paperDocNo}
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div>
                <label className="block text-[11px] text-slate-600 mb-0.5">纸质申请/请示单号 *</label>
                <input
                  type="text"
                  value={paperDocNo}
                  onChange={e => setPaperDocNo(e.target.value)}
                  placeholder="如 WLRY-2026-089"
                  className="w-full bg-white border border-slate-300 rounded px-2 py-1.5 font-mono"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-600 mb-0.5">最终签批领导/主任 *</label>
                <input
                  type="text"
                  value={paperApprover}
                  onChange={e => setPaperApprover(e.target.value)}
                  placeholder="如 张明理副院长"
                  className="w-full bg-white border border-slate-300 rounded px-2 py-1.5"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-600 mb-0.5">纸质获批日期</label>
                <input
                  type="date"
                  value={paperApprovedDate}
                  onChange={e => setPaperApprovedDate(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded px-2 py-1.5 font-mono"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-300 rounded-md cursor-pointer font-semibold text-slate-700">
                <Upload className="w-3.5 h-3.5 text-blue-600" />
                <span>{paperAttachmentName ? '更换扫描件' : '选择盖章申请单扫描件/PDF'}</span>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  className="hidden"
                  onChange={async e => {
                    const f = e.target.files?.[0];
                    if (!f) return;
                    const { name, dataUrl } = await readFileAsDataUrl(f);
                    setPaperAttachmentName(name);
                    setPaperAttachmentDataUrl(dataUrl);
                  }}
                />
              </label>
              <input
                type="text"
                value={paperAttachmentName}
                onChange={e => setPaperAttachmentName(e.target.value)}
                placeholder="或输入归档扫描文件名 (如 院长签批维修申请单.pdf)"
                className="flex-1 min-w-[180px] bg-white border border-slate-300 rounded px-2.5 py-1.5 text-xs"
              />
            </div>

            <div className="flex items-center justify-between gap-2 pt-1">
              <input
                type="text"
                value={paperRemarks}
                onChange={e => setPaperRemarks(e.target.value)}
                placeholder="纸质审批备注（如急修事后补办请示说明）"
                className="flex-1 bg-white border border-slate-300 rounded px-2.5 py-1.5 text-xs"
              />
              <button
                type="button"
                disabled={Boolean(savingAction)}
                onClick={handleSavePaperProof}
                className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold cursor-pointer shrink-0"
              >
                保存纸质扫描凭证
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 3. 第二支柱：5千元/5万元价格分级合规治理 */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Scale className="w-4 h-4 text-amber-600" />
            <h5 className="text-sm font-bold text-slate-900">
              支柱二：价格合规治理 — {evaluation.requiredModeMeta.label}
            </h5>
          </div>
          <span
            className={`text-[11px] font-bold ${
              evaluation.pillarPricing.passed ? 'text-emerald-700' : 'text-rose-600'
            }`}
          >
            {evaluation.pillarPricing.passed ? '价格合规已定标' : evaluation.requiredModeMeta.requiredAction}
          </span>
        </div>

        {evaluation.requiredMode === 'exempt' && (
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-600">
            当前核定金额为 ¥0（无费用产生），豁免比价/议价/招标。若现场实际产生费用，请在上方核定预算金额，系统将自动按 5千/5万红线切换。
          </div>
        )}

        {/* 模式 1：5千元及以下 -> 多方比价（≥3家报价并选定中选方） */}
        {evaluation.requiredMode === 'price_comparison' && (
          <div className="space-y-3">
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                  <tr>
                    <th className="p-2.5">比价供应商名称</th>
                    <th className="p-2.5">联系人/电话</th>
                    <th className="p-2.5 text-right">报价金额</th>
                    <th className="p-2.5 text-center">质保期</th>
                    <th className="p-2.5">报价附件</th>
                    <th className="p-2.5 text-center">定标状态 / 操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(dossier.comparisonQuotes || []).length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-5 text-center text-slate-400">
                        暂无多方比价记录。依据内控规范，5千元及以下收费项目须登记至少 3 家单位比价报价并明确中选供应商。
                      </td>
                    </tr>
                  ) : (
                    (dossier.comparisonQuotes || []).map(q => (
                      <tr key={q.id} className={q.isSelected ? 'bg-emerald-50/40' : 'bg-white'}>
                        <td className="p-2.5 font-semibold text-slate-900">{q.vendorName}</td>
                        <td className="p-2.5 text-slate-600">
                          {q.contactPerson || '—'} {q.contactPhone ? `(${q.contactPhone})` : ''}
                        </td>
                        <td className="p-2.5 text-right font-mono font-bold text-amber-700 tabular-nums">
                          ¥{Number(q.quoteAmount || 0).toLocaleString()}
                        </td>
                        <td className="p-2.5 text-center font-mono">{q.warrantyMonths || 12} 月</td>
                        <td className="p-2.5 text-slate-600">{q.attachmentName || '书面报价单'}</td>
                        <td className="p-2.5 text-center">
                          <div className="flex items-center justify-center gap-2">
                            {q.isSelected ? (
                              <span className="inline-flex items-center gap-1 text-emerald-700 font-bold">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                已中选定标
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleSelectComparisonWinner(q.id)}
                                className="px-2 py-0.5 bg-white hover:bg-blue-50 text-blue-700 border border-blue-200 rounded font-semibold cursor-pointer"
                              >
                                选定中标
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleRemoveComparisonQuote(q.id)}
                              className="text-slate-400 hover:text-rose-600 cursor-pointer p-1"
                              title="删除"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* 新增比价报价表单 */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
              <div className="font-bold text-slate-800 flex items-center justify-between">
                <span>新增比价单位报价（当前 {(dossier.comparisonQuotes || []).length} / 3 家）</span>
                <span className="text-[11px] font-normal text-slate-500">需 ≥ 3 家比价且选定最低/合理价中标</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-6 gap-2">
                <input
                  type="text"
                  placeholder="供应商公司全称 *"
                  value={quoteVendor}
                  onChange={e => setQuoteVendor(e.target.value)}
                  className="sm:col-span-2 bg-white border border-slate-300 rounded px-2 py-1.5"
                />
                <input
                  type="number"
                  min={1}
                  placeholder="报价金额(元) *"
                  value={quoteAmount}
                  onChange={e => setQuoteAmount(e.target.value)}
                  className="bg-white border border-slate-300 rounded px-2 py-1.5 font-mono"
                />
                <input
                  type="text"
                  placeholder="联系人"
                  value={quoteContact}
                  onChange={e => setQuoteContact(e.target.value)}
                  className="bg-white border border-slate-300 rounded px-2 py-1.5"
                />
                <input
                  type="text"
                  placeholder="联系电话"
                  value={quotePhone}
                  onChange={e => setQuotePhone(e.target.value)}
                  className="bg-white border border-slate-300 rounded px-2 py-1.5 font-mono"
                />
                <button
                  type="button"
                  onClick={handleAddComparisonQuote}
                  disabled={Boolean(savingAction)}
                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded font-bold flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>录入报价</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 模式 2：5千至5万元 -> 多科室联合议价 */}
        {evaluation.requiredMode === 'negotiation' && (
          <div className="space-y-3">
            {linkedVendorOrder && (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="font-bold text-slate-900 flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-amber-600" />
                    <span>关联外协协同议价单：{linkedVendorOrder.id}（{linkedVendorOrder.vendorName}）</span>
                  </div>
                  <div className="text-[11px] text-slate-600 tabular-nums">
                    当前状态：{linkedVendorOrder.status} · 初始报价 ¥{Number(linkedVendorOrder.quoteGrandTotal || 0).toLocaleString()} ·
                    审定价 ¥{Number(linkedVendorOrder.finalNegotiatedPrice || linkedVendorOrder.quoteGrandTotal || 0).toLocaleString()} ·
                    多科室会签意见 {linkedVendorOrder.multiDeptOpinions?.length || 0} 条
                  </div>
                </div>
                {onNavigateVendorOrder && (
                  <button
                    type="button"
                    onClick={() => onNavigateVendorOrder(linkedVendorOrder.id)}
                    className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>前往外协协同完成议价定标</span>
                  </button>
                )}
              </div>
            )}

            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg space-y-2.5">
              <div className="font-bold text-slate-800">
                多科室联合议价会签与最终定标录入（医工/临床/财务联合议价确认）
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-[11px] text-slate-600 mb-0.5">联合议价批次号</label>
                  <input
                    type="text"
                    value={negBatch}
                    onChange={e => setNegBatch(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-600 mb-0.5">联合议价日期</label>
                  <input
                    type="date"
                    value={negDate}
                    onChange={e => setNegDate(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-600 mb-0.5">最终审定成交价 (元) *</label>
                  <input
                    type="number"
                    min={1}
                    value={negFinalPrice}
                    onChange={e => setNegFinalPrice(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 font-mono font-bold text-slate-900"
                  />
                </div>
              </div>
              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-slate-500">
                  {dossier.negotiationCompleted
                    ? `已完成议价定标（成交价 ¥${Number(dossier.negotiationFinalPrice || 0).toLocaleString()}）`
                    : '提交定标价格后即通过第二支柱多科室议价校验'}
                </span>
                <button
                  type="button"
                  disabled={Boolean(savingAction)}
                  onClick={handleSaveManualNegotiation}
                  className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold cursor-pointer"
                >
                  确认多科室议价定标成交
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 模式 3：5万元以上 -> 公开/邀请招标 */}
        {evaluation.requiredMode === 'bidding' && (
          <div className="space-y-3">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex flex-wrap items-center justify-between gap-3">
              <div className="space-y-0.5">
                <div className="font-bold text-slate-900 flex items-center gap-2">
                  <Gavel className="w-4 h-4 text-blue-700" />
                  <span>
                    {linkedBiddingProject
                      ? `已同步发布至招标中心：${linkedBiddingProject.id}（当前标段状态：${linkedBiddingProject.status}）`
                      : '金额超过 ¥50,000，须发起公开或邀请招标程序并完成开标定标'}
                  </span>
                </div>
                <div className="text-[11px] text-slate-600">
                  {linkedBiddingProject
                    ? `最高限价 ¥${linkedBiddingProject.maxBudget.toLocaleString()} · 收到投标 ${linkedBiddingProject.bidsCount} 份`
                    : '点击右侧按钮可一键将该项目同步至【供应商公开竞价与招标中心】'}
                </div>
              </div>
              {!linkedBiddingProject && (
                <button
                  type="button"
                  disabled={Boolean(savingAction)}
                  onClick={handleLaunchBidding}
                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Gavel className="w-3.5 h-3.5" />
                  <span>发起招标立项（同步供应商招标中心）</span>
                </button>
              )}
            </div>

            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg space-y-2.5">
              <div className="font-bold text-slate-800">开标评标与中标通知书归档</div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-[11px] text-slate-600 mb-0.5">招标方式</label>
                  <select
                    value={bidMethod}
                    onChange={e => setBidMethod(e.target.value as any)}
                    className="w-full bg-white border border-slate-300 rounded px-2 py-1.5"
                  >
                    <option value="open_tender">公开招标</option>
                    <option value="invited_tender">院内邀请招标</option>
                    <option value="competitive_negotiation">竞争性磋商</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] text-slate-600 mb-0.5">招标项目编号 *</label>
                  <input
                    type="text"
                    value={bidNo}
                    onChange={e => setBidNo(e.target.value)}
                    placeholder="如 BID-2026-8801"
                    className="w-full bg-white border border-slate-300 rounded px-2 py-1.5 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-600 mb-0.5">开标评标日期</label>
                  <input
                    type="date"
                    value={bidOpenDate}
                    onChange={e => setBidOpenDate(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded px-2 py-1.5 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-600 mb-0.5">中标供应商全称 *</label>
                  <input
                    type="text"
                    value={winningVendor}
                    onChange={e => setWinningVendor(e.target.value)}
                    placeholder="中标企业名称"
                    className="w-full bg-white border border-slate-300 rounded px-2 py-1.5"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-600 mb-0.5">中标成交金额(元) *</label>
                  <input
                    type="number"
                    min={1}
                    value={winningAmount}
                    onChange={e => setWinningAmount(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded px-2 py-1.5 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-600 mb-0.5">中标通知书编号 *</label>
                  <input
                    type="text"
                    value={winnerNoticeNo}
                    onChange={e => setWinnerNoticeNo(e.target.value)}
                    placeholder="如 ZB-TZ-2026-019"
                    className="w-full bg-white border border-slate-300 rounded px-2 py-1.5 font-mono"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <div className="flex items-center gap-2 flex-1">
                  <label className="inline-flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-300 rounded cursor-pointer font-semibold">
                    <Upload className="w-3.5 h-3.5 text-blue-600" />
                    <span>上传中标通知书</span>
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      className="hidden"
                      onChange={async e => {
                        const f = e.target.files?.[0];
                        if (!f) return;
                        const { name, dataUrl } = await readFileAsDataUrl(f);
                        setBidAttachmentName(name);
                        setBidAttachmentDataUrl(dataUrl);
                      }}
                    />
                  </label>
                  <input
                    type="text"
                    value={bidAttachmentName}
                    onChange={e => setBidAttachmentName(e.target.value)}
                    placeholder="中标通知书扫描文件名（或填上栏通知书号）"
                    className="flex-1 bg-white border border-slate-300 rounded px-2 py-1 text-xs"
                  />
                </div>
                <button
                  type="button"
                  disabled={Boolean(savingAction)}
                  onClick={handleSaveBiddingAward}
                  className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold cursor-pointer"
                >
                  保存定标与中标通知凭证
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 4. 第三支柱：会议纪要与集体决策留痕 */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-indigo-600" />
            <h5 className="text-sm font-bold text-slate-900">支柱三：会议纪要与集体研究决策留痕</h5>
          </div>
          <span
            className={`text-[11px] font-bold ${
              evaluation.pillarMinutes.passed ? 'text-emerald-700' : 'text-rose-600'
            }`}
          >
            {evaluation.pillarMinutes.passed
              ? `已归档 ${(dossier.meetingMinutes || []).length} 份纪要`
              : '缺失会议纪要（必须上传或录入决议）'}
          </span>
        </div>

        {(dossier.meetingMinutes || []).length > 0 && (
          <div className="space-y-2">
            {(dossier.meetingMinutes || []).map(m => (
              <div key={m.id} className="p-3 rounded-lg border border-slate-200 bg-slate-50/60 space-y-1.5">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">{m.title}</span>
                    <span className="text-[11px] text-indigo-700 font-semibold">
                      · {MEETING_TYPE_LABELS[m.meetingType] || '专题会议'}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-slate-500 font-mono">
                    <span>文号: {m.docNo || '扫描件存档'}</span>
                    <span>{m.meetingDate}</span>
                    <button
                      type="button"
                      onClick={() => handleDeleteMeetingMinute(m.id)}
                      className="text-slate-400 hover:text-rose-600 cursor-pointer"
                      title="删除该纪要"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <div className="text-[11px] text-slate-600">
                  主持：{m.hostName} · 参会人员/部门：{m.attendees}
                </div>
                <div className="bg-white border border-slate-200 rounded p-2 text-slate-800 leading-relaxed">
                  {m.resolutionSummary}
                </div>
                {m.attachmentName && (
                  <div className="flex items-center gap-1.5 text-[11px] text-blue-700 font-medium">
                    <Paperclip className="w-3.5 h-3.5" />
                    <span>签字纪要原件扫描：{m.attachmentName}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* 新增会议纪要表单 */}
        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg space-y-2.5">
          <div className="font-bold text-slate-800">上传 / 补录会议纪要</div>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
            <div>
              <label className="block text-[11px] text-slate-600 mb-0.5">会议类型</label>
              <select
                value={minType}
                onChange={e => setMinType(e.target.value as any)}
                className="w-full bg-white border border-slate-300 rounded px-2 py-1.5"
              >
                <option value="dept_meeting">科室专题会/维修论证会</option>
                <option value="joint_negotiation">多科室联合议价会</option>
                <option value="equipment_committee">医学装备管理委员会</option>
                <option value="bidding_evaluation">招标评标委员会</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-[11px] text-slate-600 mb-0.5">会议纪要标题 *</label>
              <input
                type="text"
                value={minTitle}
                onChange={e => setMinTitle(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded px-2 py-1.5"
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-600 mb-0.5">会议日期 *</label>
              <input
                type="date"
                value={minDate}
                onChange={e => setMinDate(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded px-2 py-1.5 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div>
              <label className="block text-[11px] text-slate-600 mb-0.5">纪要文号（或传扫描件）*</label>
              <input
                type="text"
                value={minDocNo}
                onChange={e => setMinDocNo(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded px-2 py-1.5 font-mono"
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-600 mb-0.5">主持人 / 召集人</label>
              <input
                type="text"
                value={minHost}
                onChange={e => setMinHost(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded px-2 py-1.5"
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-600 mb-0.5">参会科室 / 人员</label>
              <input
                type="text"
                value={minAttendees}
                onChange={e => setMinAttendees(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded px-2 py-1.5"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] text-slate-600 mb-0.5">会议核心决议摘要 *</label>
            <textarea
              rows={2}
              value={minSummary}
              onChange={e => setMinSummary(e.target.value)}
              placeholder="如：经医学装备管理委员会暨多科室联合会议研究，同意对本项目按既定比价/议价/招标结果实施并列支维保费用，准予按规范归档结算..."
              className="w-full bg-white border border-slate-300 rounded p-2"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 flex-1">
              <label className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-white hover:bg-slate-100 border border-slate-300 rounded cursor-pointer font-semibold">
                <Upload className="w-3.5 h-3.5 text-indigo-600" />
                <span>上传会议纪要签字扫描件</span>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  className="hidden"
                  onChange={async e => {
                    const f = e.target.files?.[0];
                    if (!f) return;
                    const { name, dataUrl } = await readFileAsDataUrl(f);
                    setMinAttachmentName(name);
                    setMinAttachmentDataUrl(dataUrl);
                  }}
                />
              </label>
              <input
                type="text"
                value={minAttachmentName}
                onChange={e => setMinAttachmentName(e.target.value)}
                placeholder="签字会议纪要附件名称"
                className="flex-1 bg-white border border-slate-300 rounded px-2.5 py-1.5 text-xs"
              />
            </div>
            <button
              type="button"
              disabled={Boolean(savingAction)}
              onClick={handleAddMeetingMinute}
              className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold flex items-center gap-1 cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>提交并归档会议纪要</span>
            </button>
          </div>
        </div>
      </div>

      {/* 5. 不可篡改审计追踪轨迹 */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-2.5">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2 font-bold text-slate-900">
            <History className="w-4 h-4 text-slate-600" />
            <span>全流程不可篡改审计留痕记录 ({auditTrail.length}条)</span>
          </div>
          <span className="text-[11px] text-slate-400">记录自动建项、补办上传、门禁拦截及核验放行全轨迹</span>
        </div>

        {auditTrail.length === 0 ? (
          <div className="text-slate-400 py-2">暂无审计操作流水</div>
        ) : (
          <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
            {auditTrail.map(entry => (
              <div
                key={entry.id}
                className={`p-2 rounded-lg border text-[11px] ${
                  entry.blockedReason
                    ? 'bg-rose-50/70 border-rose-200 text-rose-900'
                    : 'bg-slate-50/70 border-slate-200 text-slate-700'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-slate-900">
                    {entry.action} · {entry.operatorName}
                    {entry.operatorRole ? ` (${entry.operatorRole})` : ''}
                  </span>
                  <span className="font-mono text-slate-400 tabular-nums">{entry.timestamp}</span>
                </div>
                <div className="mt-0.5">{entry.detail}</div>
                {entry.blockedReason && (
                  <div className="mt-0.5 font-semibold text-rose-700">阻断原因：{entry.blockedReason}</div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

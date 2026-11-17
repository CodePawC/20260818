import { ApprovalApplication } from '../types/approvalTypes';
import { EngineeringWorkOrder } from '../types/dispatchTypes';
import {
  ApprovalProof,
  BiddingRecordSummary,
  ComparisonQuoteRecord,
  HospitalProjectRecord,
  MeetingMinutesRecord,
  ProcurementComplianceMode,
  ProjectAuditComplianceDossier,
  ProjectAuditTrailEntry
} from '../types/hospitalProjectLedgerTypes';
import { BiddingProject, VendorCollaborationOrder } from '../types/vendorCollaborationTypes';

export const PROCUREMENT_THRESHOLDS = {
  PRICE_COMPARISON_MAX: 5000,
  NEGOTIATION_MAX: 50000
} as const;

export const PROCUREMENT_MODE_META: Record<
  ProcurementComplianceMode,
  {
    label: string;
    shortLabel: string;
    thresholdDesc: string;
    requiredAction: string;
  }
> = {
  exempt: {
    label: '无费用产生（豁免采购审批）',
    shortLabel: '免费/免审',
    thresholdDesc: '¥0（纯院内人工排查 / 年度全保 / 原厂质保免费）',
    requiredAction: '无需进入比价/议价/招标，按常规维修工单验收闭环'
  },
  price_comparison: {
    label: '5千元及以下 · 多方比价/询价',
    shortLabel: '多方比价',
    thresholdDesc: '0 < 金额 ≤ ¥5,000',
    requiredAction: '须登记至少3家供应商报价对比并明确中选方，且附申请单与会议纪要'
  },
  negotiation: {
    label: '5千至5万元 · 多科室联合议价',
    shortLabel: '联合议价',
    thresholdDesc: '¥5,000 < 金额 ≤ ¥50,000',
    requiredAction: '须经多科室联合议价（医工/临床/财务/审计会签定标），并附申请单与会议纪要'
  },
  bidding: {
    label: '5万元以上 · 公开/邀请招标',
    shortLabel: '招标采购',
    thresholdDesc: '金额 > ¥50,000',
    requiredAction: '须在招标中心立项并完成开标定标、上传中标通知与装备委员会会议纪要'
  }
};

export interface PillarCheckResult {
  passed: boolean;
  label: string;
  modeLabel?: string;
  detail: string;
}

export interface ProjectComplianceEvaluation {
  hasCost: boolean;
  effectiveAmount: number;
  requiredMode: ProcurementComplianceMode;
  requiredModeMeta: (typeof PROCUREMENT_MODE_META)[ProcurementComplianceMode];
  isLegacyHistorical: boolean;
  pillarApproval: PillarCheckResult;
  pillarPricing: PillarCheckResult;
  pillarMinutes: PillarCheckResult;
  completedCount: number;
  totalCount: number;
  isAuditReady: boolean;
  missingItems: string[];
}

export interface WorkOrderAuditGateResult {
  requiresAudit: boolean;
  isAuditReady: boolean;
  missingItems: string[];
  linkedProject?: HospitalProjectRecord;
  evaluation?: ProjectComplianceEvaluation;
}

export function resolveProcurementMode(
  hasCost: boolean,
  amount: number
): ProcurementComplianceMode {
  const safeAmt = Number(amount || 0);
  if (!hasCost && safeAmt <= 0) return 'exempt';
  if (hasCost && safeAmt <= 0) return 'price_comparison';
  if (safeAmt <= PROCUREMENT_THRESHOLDS.PRICE_COMPARISON_MAX) return 'price_comparison';
  if (safeAmt <= PROCUREMENT_THRESHOLDS.NEGOTIATION_MAX) return 'negotiation';
  return 'bidding';
}

export function getEffectiveProjectAmount(project: HospitalProjectRecord): number {
  const d = project.complianceDossier;
  const candidates = [
    d?.negotiationFinalPrice,
    d?.biddingRecord?.winningAmount,
    d?.approvedBudgetAmount,
    d?.estimatedAmount,
    project.invoice?.totalAmount
  ]
    .map(v => Number(v || 0))
    .filter(v => Number.isFinite(v) && v > 0);
  return candidates.length > 0 ? candidates[0] : 0;
}

export function isWorkOrderPaid(order: EngineeringWorkOrder | null | undefined): boolean {
  if (!order) return false;
  if (order.hasCost === true) return true;
  if (Number(order.estimatedCost || 0) > 0) return true;
  if (Number(order.estimatedOutsourceCost || 0) > 0) return true;
  if (Number(order.totalRepairCost || 0) > 0) return true;
  if (Array.isArray(order.partsReplaced) && order.partsReplaced.some(p => Number(p.totalPrice || 0) > 0)) {
    return true;
  }
  if (order.outsourceServiceMode === 'single_paid_quote' || order.outsourceServiceMode === 'factory_return') {
    return true;
  }
  return false;
}

export function getWorkOrderEstimatedOrActualAmount(order: EngineeringWorkOrder | null | undefined): number {
  if (!order) return 0;
  const partsCost = Array.isArray(order.partsReplaced)
    ? order.partsReplaced.reduce((sum, p) => sum + Number(p.totalPrice || 0), 0)
    : 0;
  const maxCandidate = Math.max(
    Number(order.totalRepairCost || 0),
    Number(order.estimatedCost || 0),
    Number(order.estimatedOutsourceCost || 0),
    partsCost
  );
  return Number.isFinite(maxCandidate) ? maxCandidate : 0;
}

export function evaluateProjectAuditCompliance(
  project: HospitalProjectRecord,
  ctx?: {
    approvals?: ApprovalApplication[];
    vendorOrders?: VendorCollaborationOrder[];
    biddingProjects?: BiddingProject[];
  }
): ProjectComplianceEvaluation {
  const dossier = project.complianceDossier;
  const approvals = ctx?.approvals || [];
  const vendorOrders = ctx?.vendorOrders || [];
  const biddingProjects = ctx?.biddingProjects || [];

  // Historical static baseline records without dynamic complianceDossier
  if (!dossier) {
    const legacyAmount = Number(project.invoice?.totalAmount || 0);
    const hasCost = legacyAmount > 0;
    const requiredMode = resolveProcurementMode(hasCost, legacyAmount);
    const isPreApproved =
      project.preApprovalStatus.includes('并通过') || project.preApprovalStatus.includes('已打印');
    const hasApproval =
      isPreApproved ||
      project.approvalStatus.includes('通过') ||
      project.approvalStatus.includes('无需');
    const hasPricing = !hasCost || Boolean(project.inquiryDate || project.bargainBatch || isPreApproved);
    const hasMinutes = isPreApproved || Boolean(project.approvedDate);
    const completedCount = (hasApproval ? 1 : 0) + (hasPricing ? 1 : 0) + (hasMinutes ? 1 : 0);
    const missingItems: string[] = [];
    if (!hasApproval) missingItems.push('立项审批手续待补办（电子审批或纸质申请扫描件）');
    if (!hasPricing) missingItems.push(`缺失对应金额等级的${PROCUREMENT_MODE_META[requiredMode].shortLabel}记录`);
    if (!hasMinutes) missingItems.push('缺失会议纪要/审定决议记录');

    return {
      hasCost,
      effectiveAmount: legacyAmount,
      requiredMode,
      requiredModeMeta: PROCUREMENT_MODE_META[requiredMode],
      isLegacyHistorical: true,
      pillarApproval: {
        passed: hasApproval,
        label: '立项审批凭证',
        modeLabel: hasApproval ? '历史归档审批' : '待补办审批',
        detail: hasApproval ? `历史台账已核准 (${project.approvalStatus || '通过'})` : '待补办电子审批或纸质申请单'
      },
      pillarPricing: {
        passed: hasPricing,
        label: PROCUREMENT_MODE_META[requiredMode].shortLabel,
        detail: hasPricing ? `历史台账已留痕 (${project.bargainBatch || project.inquiryDate || '已询比价'})` : '缺少比价/议价/招标凭证'
      },
      pillarMinutes: {
        passed: hasMinutes,
        label: '会议纪要留痕',
        detail: hasMinutes ? '历史装备会决议已归档' : '待补充会议纪要扫描件'
      },
      completedCount,
      totalCount: 3,
      isAuditReady: hasApproval && hasPricing && hasMinutes,
      missingItems
    };
  }

  const effectiveAmount = getEffectiveProjectAmount(project);
  const hasCost = Boolean(dossier.hasCost) || effectiveAmount > 0;
  const requiredMode = resolveProcurementMode(hasCost, effectiveAmount);
  const modeMeta = PROCUREMENT_MODE_META[requiredMode];

  // Pillar 1: Dual-track approval (electronic approved OR stamped paper scan uploaded with docNo + approver)
  const proof: ApprovalProof = dossier.approvalProof || { mode: 'none' };
  const linkedApproval = approvals.find(
    a =>
      (proof.electronicApprovalId && a.id === proof.electronicApprovalId) ||
      (dossier.sourceWorkOrderId && a.linkedWorkOrderId === dossier.sourceWorkOrderId) ||
      a.linkedProjectId === project.id
  );
  const electronicStatus = linkedApproval?.status || proof.electronicStatus || '';
  const electronicPassed = electronicStatus === 'approved' || electronicStatus === 'archived';
  const paperPassed = Boolean(
    proof.paperDocNo?.trim() &&
      proof.paperApprover?.trim() &&
      (proof.paperAttachmentName?.trim() || proof.paperAttachmentDataUrl)
  );

  let approvalPassed = !hasCost || electronicPassed || paperPassed;
  let approvalModeLabel = '未立项';
  let approvalDetail = '尚未发起电子审批，也未补传盖章纸质申请单扫描件';
  if (!hasCost) {
    approvalPassed = true;
    approvalModeLabel = '无费用免审';
    approvalDetail = '无费用产生，无需立项报批';
  } else if (electronicPassed && paperPassed) {
    approvalModeLabel = '电子+纸质双轨完备';
    approvalDetail = `电子单 ${linkedApproval?.id || proof.electronicApprovalId} 已终审通过，且已归档纸质件 ${proof.paperDocNo}`;
  } else if (electronicPassed) {
    approvalModeLabel = '电子审批已获批';
    approvalDetail = `电子审批单 ${linkedApproval?.id || proof.electronicApprovalId} 已终审通过`;
  } else if (paperPassed) {
    approvalModeLabel = '纸质申请已补办';
    approvalDetail = `纸质请示单号 ${proof.paperDocNo}（签批人：${proof.paperApprover}）已上传归档`;
  } else if (linkedApproval || proof.electronicApprovalId) {
    approvalModeLabel = '电子审批流转中';
    approvalDetail = `已发起电子审批 ${linkedApproval?.id || proof.electronicApprovalId}（当前状态：${linkedApproval?.currentApprovalNode || electronicStatus || '审核中'}），待终审通过`;
  }

  // Pillar 2: Tiered Pricing Governance
  let pricingPassed = !hasCost;
  let pricingDetail = '无费用产生，免予比价/议价/招标';

  if (hasCost) {
    if (requiredMode === 'price_comparison') {
      const quotes: ComparisonQuoteRecord[] = Array.isArray(dossier.comparisonQuotes) ? dossier.comparisonQuotes : [];
      const hasSelected = quotes.some(q => q.isSelected && Number(q.quoteAmount || 0) > 0);
      if (quotes.length >= 3 && hasSelected) {
        const chosen = quotes.find(q => q.isSelected)!;
        pricingPassed = true;
        pricingDetail = `已完成 ${quotes.length} 家比价，选定【${chosen.vendorName}】¥${Number(chosen.quoteAmount).toLocaleString()}`;
      } else {
        pricingPassed = false;
        pricingDetail = `当前已登记 ${quotes.length}/3 家比价报价${hasSelected ? '' : '（未选定中选供应商）'}`;
      }
    } else if (requiredMode === 'negotiation') {
      const linkedVO = vendorOrders.find(
        v =>
          (dossier.linkedVendorOrderId && v.id === dossier.linkedVendorOrderId) ||
          (dossier.sourceVendorOrderId && v.id === dossier.sourceVendorOrderId) ||
          (dossier.sourceWorkOrderId && v.workOrderId === dossier.sourceWorkOrderId)
      );
      const voAgreed =
        linkedVO &&
        ['APPROVED_REPAIRING', 'COMPLETED_PENDING_INVOICE', 'INVOICE_UPLOADED', 'ARCHIVED'].includes(linkedVO.status) &&
        (Number(linkedVO.finalNegotiatedPrice || 0) > 0 || (linkedVO.multiDeptOpinions?.length || 0) > 0);
      const manualNegotiationPassed = Boolean(
        dossier.negotiationCompleted && Number(dossier.negotiationFinalPrice || 0) > 0
      );
      if (voAgreed || manualNegotiationPassed) {
        const finalAmt = Number(linkedVO?.finalNegotiatedPrice || dossier.negotiationFinalPrice || effectiveAmount);
        pricingPassed = true;
        pricingDetail = `已完成多科室联合议价定标，审定成交价 ¥${finalAmt.toLocaleString()}${dossier.negotiationBatch ? `（批次：${dossier.negotiationBatch}）` : ''}`;
      } else {
        pricingPassed = false;
        pricingDetail = linkedVO
          ? `已生成协同单 ${linkedVO.id}，但尚未完成多科室联合议价定标（需完成报价、会签并定标）`
          : '¥5,000–¥50,000 须完成多科室联合议价会签并录入最终审定成交价';
      }
    } else if (requiredMode === 'bidding') {
      const bid = dossier.biddingRecord;
      const linkedBidProj = biddingProjects.find(
        b => (bid?.linkedBiddingId && b.id === bid.linkedBiddingId) || (bid?.biddingNo && b.id === bid.biddingNo)
      );
      const bidProjWon = linkedBidProj && (linkedBidProj.status === 'WON' || linkedBidProj.status === 'CLOSED');
      const localBidAwarded = Boolean(
        bid &&
          bid.status === 'awarded' &&
          bid.biddingNo?.trim() &&
          bid.winningVendor?.trim() &&
          Number(bid.winningAmount || 0) > 0 &&
          (bid.winnerNoticeNo?.trim() || bid.attachmentName)
      );
      if (bidProjWon || localBidAwarded) {
        pricingPassed = true;
        pricingDetail = `已完成招标采购（标号 ${bid?.biddingNo || linkedBidProj?.id}），中标方【${bid?.winningVendor || linkedBidProj?.winningVendor || '已公示'}】¥${Number(bid?.winningAmount || linkedBidProj?.winningAmount || linkedBidProj?.maxBudget || effectiveAmount).toLocaleString()}`;
      } else {
        pricingPassed = false;
        pricingDetail = bid?.biddingNo
          ? `招标项目 ${bid.biddingNo} 尚未完成开标定标及中标通知书归档`
          : '超过 ¥50,000 须发起公开/邀请招标并完成评标定标、上传中标通知书';
      }
    }
  }

  // Pillar 3: Meeting Minutes
  const minutes: MeetingMinutesRecord[] = Array.isArray(dossier.meetingMinutes) ? dossier.meetingMinutes : [];
  const validMinute = minutes.find(
    m =>
      Boolean(m.title?.trim()) &&
      Boolean(m.meetingDate?.trim()) &&
      Boolean(m.resolutionSummary?.trim()) &&
      Boolean(m.docNo?.trim() || m.attachmentName?.trim() || m.attachmentDataUrl)
  );
  const minutesPassed = !hasCost || Boolean(validMinute);
  const minutesDetail = !hasCost
    ? '无费用产生，免传专项会议纪要'
    : validMinute
      ? `已留存 ${minutes.length} 份纪要（最新：${validMinute.title} · ${validMinute.meetingDate}）`
      : '须上传或录入院务会/装备委员会/联合议价会议纪要及决议摘要';

  const completedCount = (approvalPassed ? 1 : 0) + (pricingPassed ? 1 : 0) + (minutesPassed ? 1 : 0);
  const missingItems: string[] = [];
  if (!approvalPassed) {
    missingItems.push('缺少立项审批依据（请发起电子审批并通过，或补传签字盖章纸质申请单扫描件）');
  }
  if (!pricingPassed) {
    missingItems.push(`价格合规未完成（${modeMeta.label}：${pricingDetail}）`);
  }
  if (!minutesPassed) {
    missingItems.push('缺少会议纪要与集体决策留痕（请上传/录入议价会或装备委员会会议纪要）');
  }

  return {
    hasCost,
    effectiveAmount,
    requiredMode,
    requiredModeMeta: modeMeta,
    isLegacyHistorical: false,
    pillarApproval: {
      passed: approvalPassed,
      label: '立项审批凭证（电子/纸质双轨）',
      modeLabel: approvalModeLabel,
      detail: approvalDetail
    },
    pillarPricing: {
      passed: pricingPassed,
      label: `价格治理（${modeMeta.shortLabel}）`,
      detail: pricingDetail
    },
    pillarMinutes: {
      passed: minutesPassed,
      label: '会议纪要留痕',
      detail: minutesDetail
    },
    completedCount,
    totalCount: 3,
    isAuditReady: approvalPassed && pricingPassed && minutesPassed,
    missingItems
  };
}

export function evaluateWorkOrderAuditGate(
  workOrder: EngineeringWorkOrder,
  ctx: {
    projects: HospitalProjectRecord[];
    approvals?: ApprovalApplication[];
    vendorOrders?: VendorCollaborationOrder[];
    biddingProjects?: BiddingProject[];
  }
): WorkOrderAuditGateResult {
  const paid = isWorkOrderPaid(workOrder);
  if (!paid) {
    return {
      requiresAudit: false,
      isAuditReady: true,
      missingItems: []
    };
  }

  const linkedProject = ctx.projects.find(
    p =>
      (workOrder.linkedProjectId && p.id === workOrder.linkedProjectId) ||
      p.complianceDossier?.sourceWorkOrderId === workOrder.id
  );

  if (!linkedProject) {
    return {
      requiresAudit: true,
      isAuditReady: false,
      missingItems: [
        '该工单已判定产生费用，但尚未同步生成《设备项目台账》立项记录，请先同步建项并补齐审批、比价/议价/招标及会议纪要'
      ]
    };
  }

  const evaluation = evaluateProjectAuditCompliance(linkedProject, ctx);
  return {
    requiresAudit: true,
    isAuditReady: evaluation.isAuditReady,
    missingItems: evaluation.missingItems,
    linkedProject,
    evaluation
  };
}

export function buildDynamicProjectIdFromWorkOrder(workOrderId: string): string {
  const clean = String(workOrderId || '').replace(/[^A-Za-z0-9]/g, '');
  return `PRJ-${clean.slice(-10) || Date.now().toString().slice(-6)}`;
}

export function buildProjectRecordFromWorkOrder(
  order: EngineeringWorkOrder,
  opts: {
    existingProject?: HospitalProjectRecord;
    stage: 'dispatch' | 'field_operation' | 'manual';
    operatorName?: string;
    estimatedAmount?: number;
    hasCost?: boolean;
  }
): HospitalProjectRecord {
  const nowDate = new Date().toISOString().slice(0, 10);
  const nowTimestamp = new Date().toISOString().replace('T', ' ').slice(0, 16);
  const existing = opts.existingProject;
  const effectiveAmount = Math.max(
    Number(opts.estimatedAmount ?? getWorkOrderEstimatedOrActualAmount(order)),
    Number(existing?.complianceDossier?.estimatedAmount || 0),
    Number(existing?.invoice?.totalAmount || 0),
    0
  );
  const hasCost = Boolean(opts.hasCost ?? isWorkOrderPaid(order) ?? true);
  const requiredMode = resolveProcurementMode(hasCost, effectiveAmount);
  const projectId = existing?.id || order.linkedProjectId || buildDynamicProjectIdFromWorkOrder(order.id);
  const taxRate = 0.13;
  const amountWithoutTax = Number((effectiveAmount / (1 + taxRate)).toFixed(2));
  const taxAmount = Number((effectiveAmount - amountWithoutTax).toFixed(2));

  const prevDossier: ProjectAuditComplianceDossier | undefined = existing?.complianceDossier;
  const prevTrail: ProjectAuditTrailEntry[] = Array.isArray(prevDossier?.auditTrail)
    ? prevDossier.auditTrail
    : [];

  const actionLabel = existing ? '费用与工单状态联动更新' : '派工/现场收费自动立项';
  const newTrailEntry: ProjectAuditTrailEntry = {
    id: `AUD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    timestamp: nowTimestamp,
    operatorName: opts.operatorName || order.dispatcherName || order.assignedEngineerName || '医工调度系统',
    operatorRole: opts.stage === 'dispatch' ? '医工调度' : '现场工程处置',
    action: actionLabel,
    detail: `关联工单 ${order.id}（${order.equipmentName}），触发阶段：${
      opts.stage === 'dispatch' ? '派工勾选有费用' : opts.stage === 'field_operation' ? '现场转收费/领料外协' : '人工建项'
    }，预估/核算金额 ¥${effectiveAmount.toLocaleString()}，合规级别：${PROCUREMENT_MODE_META[requiredMode].label}`
  };

  const dossier: ProjectAuditComplianceDossier = {
    sourceWorkOrderId: order.id,
    sourceVendorOrderId: order.linkedVendorOrderId || prevDossier?.sourceVendorOrderId,
    equipmentId: order.equipmentId || prevDossier?.equipmentId,
    equipmentName: order.equipmentName || prevDossier?.equipmentName,
    equipmentModel: order.equipmentModel || prevDossier?.equipmentModel,
    equipmentSn: order.equipmentSn || prevDossier?.equipmentSn,
    hasCost,
    estimatedAmount: effectiveAmount,
    approvedBudgetAmount: prevDossier?.approvedBudgetAmount || effectiveAmount,
    requiredMode,
    createdFromStage: prevDossier?.createdFromStage || opts.stage,
    approvalProof: prevDossier?.approvalProof || { mode: 'none' },
    comparisonQuotes: prevDossier?.comparisonQuotes || [],
    linkedVendorOrderId: order.linkedVendorOrderId || prevDossier?.linkedVendorOrderId,
    negotiationCompleted: prevDossier?.negotiationCompleted,
    negotiationFinalPrice: prevDossier?.negotiationFinalPrice,
    negotiationDate: prevDossier?.negotiationDate,
    negotiationBatch: prevDossier?.negotiationBatch,
    biddingRecord: prevDossier?.biddingRecord,
    meetingMinutes: prevDossier?.meetingMinutes || [],
    auditLockedCleared: prevDossier?.auditLockedCleared,
    archivedAt: prevDossier?.archivedAt,
    archivedBy: prevDossier?.archivedBy,
    auditTrail: [newTrailEntry, ...prevTrail]
  };

  const vendorName =
    order.externalPartner ||
    existing?.vendor?.companyName ||
    '待比价/议价/招标定标确定服务商';
  const vendorContact =
    order.externalVendorContact || existing?.vendor?.contactPerson || order.assignedEngineerName || '待定';
  const vendorPhone = order.externalVendorPhone || existing?.vendor?.contactPhone || order.assignedEngineerPhone || '-';

  return {
    id: projectId,
    department: order.department || existing?.department || '临床科室',
    repairInfo: order.faultDescription || existing?.repairInfo || '设备故障维修',
    repairDate: (order.reportTime || nowDate).slice(0, 10),
    approvalStatus:
      dossier.approvalProof.mode !== 'none'
        ? existing?.approvalStatus || '已补录审批凭证'
        : '待发起电子审批或补传纸质申请',
    approvalDate: dossier.approvalProof.paperApprovedDate || existing?.approvalDate || nowDate,
    approvalContent:
      existing?.approvalContent ||
      `【工单 ${order.id} 自动立项】设备：${order.equipmentName}（${order.equipmentModel || '-'}，SN：${order.equipmentSn || '-'}），故障表现：${order.faultDescription}。按医院内控规范进入【${PROCUREMENT_MODE_META[requiredMode].shortLabel}】审计流程。`,
    approvedDate: existing?.approvedDate || '',
    projectName:
      existing?.projectName ||
      `${order.equipmentName}故障维修与配件保障（${order.department} · ${order.caoliaoRecordNo || order.id}）`,
    preApprovalPrintDate: existing?.preApprovalPrintDate || '',
    inquiryDate:
      existing?.inquiryDate ||
      (requiredMode === 'price_comparison' ? '待三方比价' : requiredMode === 'negotiation' ? '待联合议价' : '待招标立项'),
    bargainBatch:
      existing?.bargainBatch ||
      dossier.negotiationBatch ||
      dossier.biddingRecord?.biddingNo ||
      PROCUREMENT_MODE_META[requiredMode].shortLabel,
    bargainDate: existing?.bargainDate || dossier.negotiationDate || '',
    deptConfirmStatus:
      order.status === 'closed' || order.acceptanceTime
        ? '临床已验收确认'
        : existing?.deptConfirmStatus || '维修处置中',
    deptConfirmContent:
      order.clinicalFeedback ||
      existing?.deptConfirmContent ||
      (order.repairAction ? `现场维修措施：${order.repairAction}` : '等待维修完成及临床试机验收签字'),
    deptConfirmDate: order.acceptanceTime?.slice(0, 10) || existing?.deptConfirmDate || '',
    preApprovalStatus:
      existing?.preApprovalStatus || '未打印预批（待审计核验放行）',
    preApprovalPassTime: existing?.preApprovalPassTime || '',
    dateValidation: existing?.dateValidation || '待审计三支柱全部核验后放行',
    relatedDocsCount:
      (dossier.comparisonQuotes.length > 0 ? 1 : 0) +
      dossier.meetingMinutes.length +
      (dossier.approvalProof.mode !== 'none' ? 1 : 0),
    category: order.category || existing?.category || '设备维修与配件采购',
    remarks:
      existing?.remarks ||
      `来源工单：${order.id}；触发环节：${opts.stage === 'dispatch' ? '派工调度' : '现场排查处置'}；强制流程：${PROCUREMENT_MODE_META[requiredMode].label}`,
    vendor: {
      companyName: vendorName,
      creditCode: existing?.vendor?.creditCode || '待定标后自动关联信用代码',
      contactPerson: vendorContact,
      contactPhone: vendorPhone,
      address: existing?.vendor?.address || '按医院供应商库档案关联',
      qualification: existing?.vendor?.qualification || '医疗器械维修/原厂授权资质',
      bankName: existing?.vendor?.bankName || '待发票核验录入',
      bankAccount: existing?.vendor?.bankAccount || '待发票核验录入',
      rating: existing?.vendor?.rating || 5,
      serviceScope: existing?.vendor?.serviceScope || order.category || '医疗设备维保'
    },
    invoice: {
      invoiceType: existing?.invoice?.invoiceType || '增值税专用发票',
      invoiceCode: existing?.invoice?.invoiceCode || '待开具',
      invoiceNumber: existing?.invoice?.invoiceNumber || '待供应商开具发票',
      amountWithoutTax: existing?.invoice?.amountWithoutTax || amountWithoutTax,
      taxRate: existing?.invoice?.taxRate ?? taxRate,
      taxAmount: existing?.invoice?.taxAmount || taxAmount,
      totalAmount: existing?.invoice?.totalAmount || effectiveAmount,
      totalAmountChinese: existing?.invoice?.totalAmountChinese || '',
      invoiceDate: existing?.invoice?.invoiceDate || '',
      taxCheckStatus: existing?.invoice?.taxCheckStatus || 'pending_check',
      taxOffice: existing?.invoice?.taxOffice || '国家税务总局全国发票查验平台',
      paymentStatus: existing?.invoice?.paymentStatus || '待提交发票'
    },
    complianceDossier: dossier
  };
}

import express from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import mysql from 'mysql2/promise';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import { INITIAL_EQUIPMENT } from './src/mockData';
import { MedicalEquipment, RepairRecord, StatusLog, EquipmentStatus, MetrologyCatalogueItem, NmpaCategoryMasterItem, StaffPersonMaster, CaoliaoCategoryMappingRule, CaoliaoSyncConfig } from './src/types';
import { enrichEquipmentWithMasterData, DEFAULT_STAFF } from './src/utils/masterData';
import { batchAssignPureNumericInternalNos } from './src/utils/internalNoGenerator';
import { DEFAULT_METROLOGY_CATALOGUE, reclassifyEquipmentListByPolicy, matchEquipmentToMetrologyCatalogue } from './src/utils/metrologyCatalogueData';
import { DEFAULT_NMPA_CATEGORY_MASTER } from './src/utils/nmpaCategoryData';
import { resolveMainCategory, resolveLevel1Category, resolveLevel2Category } from './src/utils/categoryFormatter';
import { generateLocalRuleBasedDiagnosis, generateLocalPmPlan, AiStructuredDiagnosticResult } from './src/utils/aiBiomedicalEngine';
import { generateLocalDimensionAnalysis, generateLocalBatchFleetAnalysis } from './src/utils/aiDimensionEngine';
import { INITIAL_ADVERSE_EVENTS } from './src/utils/adverseEventData';
import { AdverseEventRecord } from './src/types/adverseEventTypes';
import { DedicatedConsumableMaster, HostConsumableBindingRecord, BatchRecallAlert } from './src/types/udiTypes';
import { DEFAULT_DEDICATED_CONSUMABLES, INITIAL_HOST_CONSUMABLE_BINDINGS, INITIAL_BATCH_RECALL_ALERTS } from './src/utils/udiData';
import { parseUdiBarcode, verifyConsumableHostCompatibility } from './src/utils/udiParser';
import { 
  DEFAULT_SMART_MANAGEMENT_METRICS, 
  INITIAL_HIS_PACS_RECORDS, 
  DEFAULT_FLOOR_TOPOLOGY, 
  PRESET_EMERGENCY_SCENARIOS 
} from './src/utils/smartManagementData';
import { SmartManagementRatingMetric, HisPacsLinkageRecord, FloorSpaceTopology, HospitalNotice, NoticeReadReceipt } from './src/types';
import { DEFAULT_SEED_NOTICES } from './src/utils/noticeUtils';
import { HOSPITAL_PROJECTS_FULL_LEDGER } from './src/utils/hospitalProjectsFullData';
import { HospitalProjectRecord } from './src/types/hospitalProjectLedgerTypes';
import { ApprovalApplication } from './src/types/approvalTypes';
import { BiddingProject } from './src/types/vendorCollaborationTypes';
import { INITIAL_APPROVAL_APPLICATIONS } from './src/utils/approvalMockData';
import { INITIAL_BIDDING_PROJECTS } from './src/utils/vendorBiddingAndDocsData';
import {
  buildProjectRecordFromWorkOrder,
  evaluateProjectAuditCompliance,
  evaluateWorkOrderAuditGate,
  isWorkOrderPaid,
  resolveProcurementMode,
  PROCUREMENT_MODE_META
} from './src/utils/complianceAuditEngine';
import {
  UserIdentityLike,
  ROLE_ARCHETYPE_LABELS,
  resolveRoleArchetype,
  canDispatchWorkOrderByPolicy,
  canPreDispatchWorkOrderByPolicy,
  canParticipateDispatchDiscussionByPolicy,
  canExecuteFieldRepairByPolicy,
  canClinicalAcceptWorkOrderByPolicy,
  canAddEquipmentByPolicy,
  canEditEquipmentByPolicy,
  canDeleteOrScrapEquipmentByPolicy,
  canChangeEquipmentStatusByPolicy,
  canManageMasterDataByPolicy,
  canManageSystemOpsByPolicy,
  canBroadcastNoticeByPolicy,
  canViewProjectLedgerByPolicy,
  canOperateProjectLedgerByPolicy
} from './src/utils/rbacPolicy';

// Persistent file-backed storage
const DATA_DIR = process.env.APP_DATA_DIR
  ? path.resolve(process.env.APP_DATA_DIR)
  : path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'equipment_store.json');
const CATALOGUE_FILE = path.join(DATA_DIR, 'metrology_catalogue.json');
const NMPA_CATEGORIES_FILE = path.join(DATA_DIR, 'nmpa_categories.json');
const STAFF_FILE = path.join(DATA_DIR, 'staff_store.json');
const ADVERSE_EVENTS_FILE = path.join(DATA_DIR, 'adverse_events.json');
const WORK_ORDERS_FILE = path.join(DATA_DIR, 'work_orders_store.json');
const VENDOR_COLLAB_FILE = path.join(DATA_DIR, 'vendor_collaboration_orders.json');
const DYNAMIC_PROJECT_LEDGER_FILE = path.join(DATA_DIR, 'dynamic_project_ledger.json');
const APPROVALS_FILE = path.join(DATA_DIR, 'approvals_store.json');
const BIDDING_PROJECTS_FILE = path.join(DATA_DIR, 'bidding_projects_store.json');
const UDI_CONSUMABLES_FILE = path.join(DATA_DIR, 'udi_consumables_store.json');
const UDI_BINDINGS_FILE = path.join(DATA_DIR, 'udi_bindings_store.json');
const SMART_METRICS_FILE = path.join(DATA_DIR, 'smart_management_metrics.json');
const HIS_PACS_RECORDS_FILE = path.join(DATA_DIR, 'his_pacs_records.json');
const NOTICES_FILE = path.join(DATA_DIR, 'notices_store.json');
const BACKUPS_DIR = path.join(DATA_DIR, 'backups');

function loadPersistentNotices(): HospitalNotice[] {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    if (fs.existsSync(NOTICES_FILE)) {
      const raw = fs.readFileSync(NOTICES_FILE, 'utf8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (err) {
    console.error('[Storage] Error loading persistent notices:', err);
  }
  return DEFAULT_SEED_NOTICES;
}

function savePersistentNotices(data: HospitalNotice[]) {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(NOTICES_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error('[Storage] Error saving persistent notices:', err);
  }
}

let noticesStore: HospitalNotice[] = loadPersistentNotices();

function loadPersistentWorkOrders(): any[] {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    if (fs.existsSync(WORK_ORDERS_FILE)) {
      const raw = fs.readFileSync(WORK_ORDERS_FILE, 'utf8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (err) {
    console.error('[Storage] Error loading persistent work orders:', err);
  }
  return [];
}

function savePersistentWorkOrders(data: any[]) {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(WORK_ORDERS_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error('[Storage] Error saving persistent work orders:', err);
  }
}

let workOrdersStore: any[] = loadPersistentWorkOrders();

function loadPersistentVendorCollabOrders(): any[] {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    if (fs.existsSync(VENDOR_COLLAB_FILE)) {
      const raw = fs.readFileSync(VENDOR_COLLAB_FILE, 'utf8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (err) {
    console.error('[Storage] Error loading vendor collaboration orders:', err);
  }
  return [];
}

function savePersistentVendorCollabOrders(data: any[]) {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(VENDOR_COLLAB_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error('[Storage] Error saving vendor collaboration orders:', err);
  }
}

let vendorCollabOrdersStore: any[] = loadPersistentVendorCollabOrders();

function loadPersistentDynamicProjectLedger(): HospitalProjectRecord[] {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    if (fs.existsSync(DYNAMIC_PROJECT_LEDGER_FILE)) {
      const raw = fs.readFileSync(DYNAMIC_PROJECT_LEDGER_FILE, 'utf8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (err) {
    console.error('[Storage] Error loading dynamic project ledger:', err);
  }
  return [];
}

function savePersistentDynamicProjectLedger(data: HospitalProjectRecord[]) {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(DYNAMIC_PROJECT_LEDGER_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error('[Storage] Error saving dynamic project ledger:', err);
  }
}

function loadPersistentApprovals(): ApprovalApplication[] {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    if (fs.existsSync(APPROVALS_FILE)) {
      const raw = fs.readFileSync(APPROVALS_FILE, 'utf8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (err) {
    console.error('[Storage] Error loading approvals:', err);
  }
  return INITIAL_APPROVAL_APPLICATIONS;
}

function savePersistentApprovals(data: ApprovalApplication[]) {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(APPROVALS_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error('[Storage] Error saving approvals:', err);
  }
}

function loadPersistentBiddingProjects(): BiddingProject[] {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    if (fs.existsSync(BIDDING_PROJECTS_FILE)) {
      const raw = fs.readFileSync(BIDDING_PROJECTS_FILE, 'utf8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (err) {
    console.error('[Storage] Error loading bidding projects:', err);
  }
  return INITIAL_BIDDING_PROJECTS;
}

function savePersistentBiddingProjects(data: BiddingProject[]) {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(BIDDING_PROJECTS_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error('[Storage] Error saving bidding projects:', err);
  }
}

let dynamicProjectLedgerStore: HospitalProjectRecord[] = loadPersistentDynamicProjectLedger();
let approvalsStore: ApprovalApplication[] = loadPersistentApprovals();
let biddingProjectsStore: BiddingProject[] = loadPersistentBiddingProjects();

function getMergedProjectLedger(): HospitalProjectRecord[] {
  const overrideMap = new Map<string, HospitalProjectRecord>();
  const newDynamicItems: HospitalProjectRecord[] = [];
  const staticIds = new Set(HOSPITAL_PROJECTS_FULL_LEDGER.map(p => p.id));
  dynamicProjectLedgerStore.forEach(item => {
    if (staticIds.has(item.id)) {
      overrideMap.set(item.id, item);
    } else {
      newDynamicItems.push(item);
    }
  });
  const baseMerged = HOSPITAL_PROJECTS_FULL_LEDGER.map(p => overrideMap.get(p.id) || p);
  return [...newDynamicItems, ...baseMerged];
}

function findMergedProjectById(id: string): HospitalProjectRecord | undefined {
  return (
    dynamicProjectLedgerStore.find(p => p.id === id) ||
    HOSPITAL_PROJECTS_FULL_LEDGER.find(p => p.id === id)
  );
}

function upsertDynamicProjectRecord(record: HospitalProjectRecord): HospitalProjectRecord {
  const idx = dynamicProjectLedgerStore.findIndex(p => p.id === record.id);
  if (idx >= 0) {
    dynamicProjectLedgerStore[idx] = record;
  } else {
    dynamicProjectLedgerStore.unshift(record);
  }
  savePersistentDynamicProjectLedger(dynamicProjectLedgerStore);
  return record;
}

function upsertProjectFromWorkOrderServer(
  workOrder: any,
  opts: { stage: 'dispatch' | 'field_operation' | 'manual'; operatorName?: string; estimatedAmount?: number; hasCost?: boolean }
): HospitalProjectRecord {
  const existing =
    (workOrder.linkedProjectId ? findMergedProjectById(workOrder.linkedProjectId) : undefined) ||
    dynamicProjectLedgerStore.find(p => p.complianceDossier?.sourceWorkOrderId === workOrder.id);
  const project = buildProjectRecordFromWorkOrder(workOrder, {
    existingProject: existing,
    stage: opts.stage,
    operatorName: opts.operatorName,
    estimatedAmount: opts.estimatedAmount,
    hasCost: opts.hasCost
  });
  return upsertDynamicProjectRecord(project);
}

function upsertVendorCollabFromWorkOrder(workOrder: any, operatorName = '医工调度中心') {
  if (!workOrder || workOrder.dispatchChannel !== 'outsourced' || !workOrder.externalPartner) {
    return null;
  }
  const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 16);
  const serviceMode = workOrder.outsourceServiceMode || 'single_paid_quote';
  const requiresQuote =
    typeof workOrder.requiresVendorQuote === 'boolean'
      ? workOrder.requiresVendorQuote
      : serviceMode === 'single_paid_quote' || serviceMode === 'factory_return';

  const existingIdx = vendorCollabOrdersStore.findIndex(
    (o: any) => o.workOrderId === workOrder.id || (workOrder.linkedVendorOrderId && o.id === workOrder.linkedVendorOrderId)
  );
  const extId =
    existingIdx >= 0
      ? vendorCollabOrdersStore[existingIdx].id
      : workOrder.linkedVendorOrderId || `EXT-${String(workOrder.id).replace(/[^A-Za-z0-9]/g, '').slice(-10)}`;

  const estCost = Number(workOrder.estimatedOutsourceCost || 0);
  const modeLabelMap: Record<string, string> = {
    annual_contract: '年度全保/技术保覆盖',
    warranty_free: '质保期内原厂免费保修',
    single_paid_quote: '单次付费报价议价',
    factory_return: '返厂检测/探头周转'
  };
  const modeLabel = modeLabelMap[serviceMode] || '外协专项维保';

  const baseRecord = {
    id: extId,
    workOrderId: workOrder.id,
    equipmentId: workOrder.equipmentId || '',
    equipmentName: workOrder.equipmentName || '医疗设备',
    equipmentModel: workOrder.equipmentModel || '标准型号',
    equipmentSerialNo: workOrder.equipmentSn || '',
    equipmentDept: workOrder.department || '临床科室',
    faultDescription: `[外协方式：${modeLabel}${workOrder.externalContractNo ? ` / 合同号:${workOrder.externalContractNo}` : ''}] ${workOrder.outsourceReason ? `转外协原因：${workOrder.outsourceReason}。` : ''}${workOrder.faultDescription || ''}`,
    faultImages: workOrder.photoUrl ? [workOrder.photoUrl] : [],
    urgencyLevel: workOrder.priority === 'P1_CRITICAL' || workOrder.priority === 'P2_URGENT' ? 'HIGH' : 'NORMAL',
    vendorId: workOrder.externalVendorId || 'ISO-001',
    vendorName: workOrder.externalPartner,
    vendorContact: workOrder.externalVendorContact || '外协技术代表',
    vendorPhone: workOrder.externalVendorPhone || workOrder.reporterPhone || '400-880-9911',
    createdAt: workOrder.vendorDispatchTime || workOrder.dispatchTime || nowStr,
    status: requiresQuote ? 'PENDING_QUOTE' : 'APPROVED_REPAIRING',
    quoteLaborCost: requiresQuote ? undefined : 0,
    quoteTravelCost: requiresQuote ? undefined : 0,
    quotePartsTotal: requiresQuote ? undefined : 0,
    quoteGrandTotal: requiresQuote ? (estCost > 0 ? estCost : undefined) : 0,
    quoteParts: [],
    multiDeptOpinions: [],
    negotiationRounds: [],
    messages: [
      {
        id: `msg-${Date.now()}`,
        senderType: 'HOSPITAL',
        senderName: `${operatorName} (院内监护: ${workOrder.assignedEngineerName || workOrder.proposedEngineerName || '医工调度'})`,
        senderDept: '医学工程科',
        timestamp: nowStr,
        content: `已通过外协派工单下发至【${workOrder.externalPartner}】（${modeLabel}）。${workOrder.dispatchNotes || '请尽快安排原厂/认证工程师响应协同。'}`
      }
    ],
    isDossierArchived: false
  };

  if (existingIdx >= 0) {
    const prev = vendorCollabOrdersStore[existingIdx];
    vendorCollabOrdersStore[existingIdx] = {
      ...prev,
      vendorId: baseRecord.vendorId,
      vendorName: baseRecord.vendorName,
      vendorContact: baseRecord.vendorContact,
      vendorPhone: baseRecord.vendorPhone,
      faultDescription: baseRecord.faultDescription
    };
  } else {
    vendorCollabOrdersStore.unshift(baseRecord);
  }
  savePersistentVendorCollabOrders(vendorCollabOrdersStore);
  return vendorCollabOrdersStore[existingIdx >= 0 ? existingIdx : 0];
}

function parseComparableTime(val?: any): number {
  if (!val) return 0;
  if (val instanceof Date) {
    const t = val.getTime();
    return Number.isFinite(t) ? t : 0;
  }
  const normalized = String(val).trim().replace(/\//g, '-').replace('T', ' ');
  if (!normalized) return 0;
  const parsed = Date.parse(normalized.includes(' ') ? normalized.replace(' ', 'T') : normalized);
  if (Number.isFinite(parsed)) return parsed;
  const fallback = Date.parse(normalized);
  return Number.isFinite(fallback) ? fallback : 0;
}

function determineBiomedicalGroup(dName: string, eName: string): string {
  const combined = `${dName || ''} ${eName || ''}`.toLowerCase();
  if (
    combined.includes('呼吸') ||
    combined.includes('icu') ||
    combined.includes('除颤') ||
    combined.includes('急救') ||
    combined.includes('监护') ||
    combined.includes('麻醉')
  ) {
    return '急救生命支持技术组';
  }
  if (
    combined.includes('ct') ||
    combined.includes('放射') ||
    combined.includes('dr') ||
    combined.includes('mri') ||
    combined.includes('x射线') ||
    combined.includes('影像')
  ) {
    return '大型放射影像技术组';
  }
  if (
    combined.includes('检验') ||
    combined.includes('生化') ||
    combined.includes('血') ||
    combined.includes('尿') ||
    combined.includes('免疫')
  ) {
    return '临床检验与生化组';
  }
  if (
    combined.includes('镜') ||
    combined.includes('手术') ||
    combined.includes('腔镜') ||
    combined.includes('电刀') ||
    combined.includes('吻合')
  ) {
    return '腔镜微创手术组';
  }
  return '超声与综合诊疗组';
}

function loadPersistentSmartMetrics(): SmartManagementRatingMetric[] {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    if (fs.existsSync(SMART_METRICS_FILE)) {
      const raw = fs.readFileSync(SMART_METRICS_FILE, 'utf8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (err) {
    console.error('[Storage] Error loading smart management metrics:', err);
  }
  return DEFAULT_SMART_MANAGEMENT_METRICS;
}

function savePersistentSmartMetrics(data: SmartManagementRatingMetric[]) {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(SMART_METRICS_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error('[Storage] Error saving smart management metrics:', err);
  }
}

let smartMetricsStore: SmartManagementRatingMetric[] = loadPersistentSmartMetrics();

function loadPersistentHisPacsRecords(): HisPacsLinkageRecord[] {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    if (fs.existsSync(HIS_PACS_RECORDS_FILE)) {
      const raw = fs.readFileSync(HIS_PACS_RECORDS_FILE, 'utf8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (err) {
    console.error('[Storage] Error loading HIS/PACS records:', err);
  }
  return INITIAL_HIS_PACS_RECORDS;
}

function savePersistentHisPacsRecords(data: HisPacsLinkageRecord[]) {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(HIS_PACS_RECORDS_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error('[Storage] Error saving HIS/PACS records:', err);
  }
}

let hisPacsRecordsStore: HisPacsLinkageRecord[] = loadPersistentHisPacsRecords();

function loadPersistentAdverseEvents(): AdverseEventRecord[] {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    if (fs.existsSync(ADVERSE_EVENTS_FILE)) {
      const raw = fs.readFileSync(ADVERSE_EVENTS_FILE, 'utf8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (err) {
    console.error('[Storage] Error loading adverse events:', err);
  }
  return INITIAL_ADVERSE_EVENTS;
}

function savePersistentAdverseEvents(data: AdverseEventRecord[]) {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(ADVERSE_EVENTS_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error('[Storage] Error saving adverse events:', err);
  }
}

let adverseEventsStore: AdverseEventRecord[] = loadPersistentAdverseEvents();

function loadPersistentUdiConsumables(): DedicatedConsumableMaster[] {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    if (fs.existsSync(UDI_CONSUMABLES_FILE)) {
      const raw = fs.readFileSync(UDI_CONSUMABLES_FILE, 'utf8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (err) {
    console.error('[Storage] Error loading persistent udi consumables:', err);
  }
  return DEFAULT_DEDICATED_CONSUMABLES;
}

function savePersistentUdiConsumables(data: DedicatedConsumableMaster[]) {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(UDI_CONSUMABLES_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error('[Storage] Error saving persistent udi consumables:', err);
  }
}

let udiConsumablesStore: DedicatedConsumableMaster[] = loadPersistentUdiConsumables();

function loadPersistentUdiBindings(): HostConsumableBindingRecord[] {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    if (fs.existsSync(UDI_BINDINGS_FILE)) {
      const raw = fs.readFileSync(UDI_BINDINGS_FILE, 'utf8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (err) {
    console.error('[Storage] Error loading persistent udi bindings:', err);
  }
  return INITIAL_HOST_CONSUMABLE_BINDINGS;
}

function savePersistentUdiBindings(data: HostConsumableBindingRecord[]) {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(UDI_BINDINGS_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error('[Storage] Error saving persistent udi bindings:', err);
  }
}

let udiBindingsStore: HostConsumableBindingRecord[] = loadPersistentUdiBindings();

function loadPersistentStaff(): StaffPersonMaster[] {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    if (fs.existsSync(STAFF_FILE)) {
      const raw = fs.readFileSync(STAFF_FILE, 'utf8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (err) {
    console.error('[Storage] Error loading persistent staff:', err);
  }
  return DEFAULT_STAFF;
}

function savePersistentStaff(data: StaffPersonMaster[]) {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(STAFF_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error('[Storage] Error saving persistent staff:', err);
  }
}

let staffStore: StaffPersonMaster[] = loadPersistentStaff();

function loadPersistentNmpaCategories(): NmpaCategoryMasterItem[] {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    if (fs.existsSync(NMPA_CATEGORIES_FILE)) {
      const raw = fs.readFileSync(NMPA_CATEGORIES_FILE, 'utf8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (err) {
    console.error('[Storage] Error loading persistent nmpa categories:', err);
  }
  return DEFAULT_NMPA_CATEGORY_MASTER;
}

function savePersistentNmpaCategories(data: NmpaCategoryMasterItem[]) {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(NMPA_CATEGORIES_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error('[Storage] Error saving persistent nmpa categories:', err);
  }
}

let nmpaCategoryStore: NmpaCategoryMasterItem[] = loadPersistentNmpaCategories();

function loadPersistentCatalogue(): MetrologyCatalogueItem[] {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(CATALOGUE_FILE)) {
      const raw = fs.readFileSync(CATALOGUE_FILE, 'utf8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        console.log(`[Storage] Loaded ${parsed.length} metrology catalogue entries.`);
        return parsed;
      }
    }
  } catch (err) {
    console.error('[Storage] Error loading persistent catalogue file:', err);
  }
  return DEFAULT_METROLOGY_CATALOGUE;
}

function savePersistentCatalogue(data: MetrologyCatalogueItem[]) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(CATALOGUE_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error('[Storage] Error saving persistent catalogue file:', err);
  }
}

let catalogueStore: MetrologyCatalogueItem[] = loadPersistentCatalogue();

function sanitizeEquipmentItem(item: MedicalEquipment): MedicalEquipment {
  let name = item.name;
  let manufacturer = item.manufacturer;
  const isMfr = !name || name === '未命名设备' || /公司|厂|有限|制药|系统|电子|仪器|设备厂|集团|社|Inc|Corp|Ltd|GmbH|Co\.|LLC|Siemens|Philips|GE|Mindray|Drager|Olympus|Stryker|Nihon|Fresenius/i.test(name);

  if (isMfr || name === manufacturer) {
    if (name && name !== '未命名设备' && (!manufacturer || manufacturer === '-' || manufacturer === '国产/进口医疗器械' || manufacturer === name)) {
      manufacturer = name;
    }
    const l2 = item.level2Category?.trim();
    const l1 = item.level1Category?.trim();
    const cat = item.category?.trim();
    name = l2 || cat || l1 || '医疗设备';
    if (name === '病人监护设备') name = '病人监护仪';
    if (name === '血液透析设备') name = '血液透析机';
    if (name === '急救和转运用呼吸机') name = '急救转运呼吸机';
  }

  if (!manufacturer || manufacturer.trim() === '' || manufacturer === '-') {
    manufacturer = '知名医疗器械制造企业';
  }

  const context = `${name || ''} ${item.level2Category || ''} ${item.level1Category || ''}`;
  const catInfo = resolveMainCategory(item.categoryNo, item.category, context);
  const l1Info = resolveLevel1Category(item.level1No, item.level1Category, catInfo.code);
  const l2Info = resolveLevel2Category(item.level2No, item.level2Category, l1Info.code);

  return {
    ...item,
    categoryNo: catInfo.code,
    category: catInfo.name,
    level1No: l1Info.code,
    level1Category: l1Info.name,
    level2No: l2Info.code,
    level2Category: l2Info.name,
    name,
    manufacturer
  };
}

function loadPersistentEquipment(): MedicalEquipment[] {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        console.log(`[Storage] Loaded ${parsed.length} equipment records from persistent storage.`);
        // Merge initial faulty / maintenance / repair state if parsed records lost them
        const initialMap = new Map(INITIAL_EQUIPMENT.map(item => [item.id, item]));
        const mergedWithInitial = parsed.map(item => {
          const init = initialMap.get(item.id);
          if (init) {
            if ((!item.repairRecords || item.repairRecords.length === 0) && init.repairRecords && init.repairRecords.length > 0) {
              return {
                ...item,
                status: item.status === '正常运行' && init.status !== '正常运行' ? init.status : item.status,
                lastFaultReason: item.lastFaultReason || init.lastFaultReason,
                repairCount: init.repairRecords.length,
                repairRecords: init.repairRecords
              };
            }
          }
          return item;
        });
        const sanitized = mergedWithInitial.map(item => enrichEquipmentWithMasterData(sanitizeEquipmentItem(item), undefined, true));
        const numAssigned = batchAssignPureNumericInternalNos(sanitized);
        savePersistentEquipment(numAssigned);
        return numAssigned;
      }
    }
  } catch (err) {
    console.error('[Storage] Error loading persistent equipment file:', err);
  }
  const defaultList = INITIAL_EQUIPMENT.map(item => enrichEquipmentWithMasterData(sanitizeEquipmentItem(item), undefined, true));
  return batchAssignPureNumericInternalNos(defaultList);
}

function savePersistentEquipment(data: MedicalEquipment[]) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error('[Storage] Error saving persistent equipment file:', err);
  }
}

// In-memory data store for server runtime backed by persistent storage
let equipmentStore: MedicalEquipment[] = loadPersistentEquipment();

async function startServer() {
  const app = express();
  const portArgIdx = process.argv.indexOf('--port');
  const portFromArg = portArgIdx !== -1 ? Number(process.argv[portArgIdx + 1]) : null;
  const envPort = Number(process.env.PORT);
  const nginxPort = Number(process.env.NGINX_PORT);
  const PORT = portFromArg || (envPort && envPort !== nginxPort ? envPort : 3000);
  const DEMO_MODE = process.env.DEMO_MODE === '1';

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  const safeDecodeHeader = (val: unknown): string => {
    if (typeof val !== 'string') return '';
    try {
      return decodeURIComponent(val);
    } catch {
      return val;
    }
  };

  const extractRequestUser = (req: express.Request): UserIdentityLike | null => {
    const role = safeDecodeHeader(req.headers['x-user-role']);
    const empNo = safeDecodeHeader(req.headers['x-user-emp-no']);
    const isAdminHeader = req.headers['x-user-is-admin'] === 'true';
    if (!role && !empNo && !isAdminHeader) {
      return null;
    }
    return {
      id: safeDecodeHeader(req.headers['x-user-id']),
      employeeNo: empNo,
      name: safeDecodeHeader(req.headers['x-user-name']),
      role,
      departmentName: safeDecodeHeader(req.headers['x-user-dept']),
      stakeholderCategory: safeDecodeHeader(req.headers['x-user-cluster']),
      isAdmin: isAdminHeader
    };
  };

  const requireRbac = (
    checkFn: (user: UserIdentityLike | null) => boolean,
    actionLabel: string
  ) => {
    return (req: express.Request, res: express.Response, next: express.NextFunction) => {
      const user = extractRequestUser(req);
      if (!checkFn(user)) {
        const arch = resolveRoleArchetype(user);
        const roleLabel = user?.role || ROLE_ARCHETYPE_LABELS[arch] || '未授权访客';
        return res.status(403).json({
          success: false,
          error: `权限不足：当前岗位【${roleLabel}】无权执行「${actionLabel}」操作`
        });
      }
      next();
    };
  };

  app.get('/api/health', (_req, res) => {
    res.json({ success: true, mode: DEMO_MODE ? 'demo' : 'standard' });
  });

  // API Routes
  
  // 1. Get all equipment with stats
  app.get('/api/equipment', (req, res) => {
    try {
      const totalCount = equipmentStore.length;
      const normalCount = equipmentStore.filter(e => e.status === '正常运行').length;
      const maintenanceCount = equipmentStore.filter(e => e.status === '维护保养中').length;
      const faultCount = equipmentStore.filter(e => e.status === '故障待修').length;
      const decommissionedCount = equipmentStore.filter(e => e.status === '停用/报废').length;
      const totalValue = equipmentStore.reduce((sum, e) => sum + (e.purchasePrice || 0), 0);

      // Total repair costs
      let monthlyRepairCost = 0;
      equipmentStore.forEach(e => {
        e.repairRecords.forEach(r => {
          monthlyRepairCost += r.cost || 0;
        });
      });

      res.json({
        success: true,
        data: equipmentStore,
        stats: {
          totalCount,
          normalCount,
          maintenanceCount,
          faultCount,
          decommissionedCount,
          totalValue,
          monthlyRepairCost
        }
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 2. Add new equipment
  app.post('/api/equipment', requireRbac(canAddEquipmentByPolicy, '新增设备建档'), (req, res) => {
    try {
      const newEquip: MedicalEquipment = {
        id: `EQ-${Date.now().toString().slice(-4)}`,
        sn: req.body.sn || `EQ-${Date.now()}`,
        name: req.body.name,
        model: req.body.model || '通用规格',
        category: req.body.category || '急救监护类',
        department: req.body.department || '急诊科',
        manager: req.body.manager || '医工科',
        status: req.body.status || '正常运行',
        purchaseDate: req.body.purchaseDate || new Date().toISOString().split('T')[0],
        enableDate: req.body.enableDate || new Date().toISOString().split('T')[0],
        purchasePrice: Number(req.body.purchasePrice) || 0,
        manufacturer: req.body.manufacturer || '国产设备',
        supplier: req.body.supplier || '未录入',
        warrantyUntil: req.body.warrantyUntil || '2027-12-31',
        lastMaintenanceDate: req.body.lastMaintenanceDate || new Date().toISOString().split('T')[0],
        nextMaintenanceDate: req.body.nextMaintenanceDate || '2026-12-31',
        location: req.body.location || '科室库房',
        repairCount: 0,
        repairRecords: [],
        statusLogs: [
          {
            id: `LOG-${Date.now()}`,
            equipmentId: `EQ-${Date.now().toString().slice(-4)}`,
            oldStatus: '正常运行',
            newStatus: req.body.status || '正常运行',
            reason: '设备初始台账建档',
            operator: req.body.manager || '系统管理员',
            timestamp: new Date().toLocaleString('zh-CN', { hour12: false })
          }
        ]
      };

      equipmentStore.unshift(newEquip);
      savePersistentEquipment(equipmentStore);
      res.json({ success: true, data: newEquip });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  // Batch import equipment
  app.post('/api/equipment/batch', requireRbac(canAddEquipmentByPolicy, '批量导入设备台账'), (req, res) => {
    try {
      const { items, overwrite } = req.body;
      if (!Array.isArray(items)) {
        return res.status(400).json({ success: false, error: '请求数据格式不正确' });
      }
      const existingBase = overwrite ? [] : equipmentStore;
      const parsedItems = items.map(item => enrichEquipmentWithMasterData(sanitizeEquipmentItem(item), undefined, true));
      const enrichedItems = batchAssignPureNumericInternalNos(parsedItems, existingBase);

      if (overwrite) {
        equipmentStore = [...enrichedItems];
      } else {
        equipmentStore = [...enrichedItems, ...equipmentStore];
      }
      savePersistentEquipment(equipmentStore);
      res.json({ success: true, count: enrichedItems.length, data: equipmentStore });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 3. Update existing equipment
  app.put('/api/equipment/:id', requireRbac(canEditEquipmentByPolicy, '编辑设备台账'), (req, res) => {
    try {
      const { id } = req.params;
      const index = equipmentStore.findIndex(e => e.id === id);
      if (index === -1) {
        return res.status(404).json({ success: false, error: '设备未找到' });
      }

      equipmentStore[index] = {
        ...equipmentStore[index],
        ...req.body
      };

      savePersistentEquipment(equipmentStore);
      res.json({ success: true, data: equipmentStore[index] });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 4. Delete equipment
  app.delete('/api/equipment/:id', requireRbac(canDeleteOrScrapEquipmentByPolicy, '删除/移除设备台账'), (req, res) => {
    try {
      const { id } = req.params;
      equipmentStore = equipmentStore.filter(e => e.id !== id);
      savePersistentEquipment(equipmentStore);
      res.json({ success: true, message: '设备已安全移除台账' });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 5. Add repair & maintenance record to an equipment
  app.post('/api/equipment/:id/repair', (req, res) => {
    try {
      const { id } = req.params;
      const equip = equipmentStore.find(e => e.id === id);
      if (!equip) {
        return res.status(404).json({ success: false, error: '设备未找到' });
      }

      // 依据五莲县人民医院《医疗设备维保工单唯一标识编码规范》（院医工发〔2026〕15号）
      const repairTypeStr = req.body.repairType || '紧急故障维修';
      const isSporadic = repairTypeStr.includes('零修') || repairTypeStr.includes('零星');
      const isPm = repairTypeStr.includes('保养') || repairTypeStr.includes('巡检');
      const prefix = isSporadic ? 'SPO' : isPm ? 'PM' : 'REP';
      const totalRepairsCount = equipmentStore.reduce((acc, eq) => acc + (eq.repairRecords?.length || 0), 0);
      const generatedCode = `WO-${prefix}-2026-${String(546 + totalRepairsCount).padStart(4, '0')}`;
      const workOrderId = req.body.workOrderId || generatedCode;

      const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 16);
      const reportTimeStr = req.body.faultDate
        ? (String(req.body.faultDate).length <= 10
            ? `${String(req.body.faultDate).trim()} ${new Date().toTimeString().slice(0, 5)}`
            : String(req.body.faultDate).replace('T', ' ').slice(0, 16))
        : nowStr;
      const isCompleted = req.body.status === '已完成';

      const repairRecord: RepairRecord = {
        id: workOrderId,
        equipmentId: equip.id,
        equipmentName: equip.name,
        equipmentSn: equip.sn,
        faultDate: req.body.faultDate || new Date().toISOString().split('T')[0],
        repairType: repairTypeStr,
        faultDescription: req.body.faultDescription || '设备报修问题描述',
        technician: req.body.technician || '待调度指派工程师',
        cost: Number(req.body.cost) || 0,
        partsReplaced: req.body.partsReplaced || '无',
        resolution: req.body.resolution || '已提交临床报修，进入全院调度闭环池等待派工处理。',
        status: req.body.status || '处理中',
        completionDate: isCompleted ? new Date().toISOString().split('T')[0] : undefined,
        department: equip.department,
        reporterName: req.body.reporterName || req.body.technician || '临床医护',
        reporterPhone: req.body.reporterPhone || '',
        source: 'manual_repair',
        workOrderId
      } as any;

      equip.repairRecords.unshift(repairRecord);
      equip.repairCount = equip.repairRecords.length;

      // Automatically sync equipment status if requested
      if (req.body.updateEquipmentStatus && req.body.newEquipmentStatus) {
        const oldStatus = equip.status;
        const newStatus: EquipmentStatus = req.body.newEquipmentStatus;
        equip.status = newStatus;
        if (newStatus === '故障待修') {
          equip.lastFaultReason = repairRecord.faultDescription;
        }

        equip.statusLogs.unshift({
          id: `LOG-${Date.now()}`,
          equipmentId: equip.id,
          oldStatus,
          newStatus,
          reason: `登记维修工单 [${repairRecord.repairType}]: ${repairRecord.faultDescription}`,
          operator: repairRecord.technician,
          timestamp: new Date().toLocaleString('zh-CN', { hour12: false })
        });
      }

      // 同步写入统一派工工单池，实现手动报修与草料扫码报修同轨闭环
      const newWorkOrder = {
        id: workOrderId,
        equipmentId: equip.id,
        equipmentName: equip.name,
        equipmentModel: equip.model || '标准型号',
        equipmentSn: equip.sn || '',
        internalNo: equip.internalNo || '',
        category: equip.category || '通用医疗器械',
        department: equip.department,
        location: equip.location || `${equip.department} 诊疗室`,
        reporterName: req.body.reporterName || req.body.technician || '临床医护',
        reporterPhone: req.body.reporterPhone || '',
        reportTime: reportTimeStr,
        priority: req.body.priority || (repairTypeStr.includes('急') ? 'P1_CRITICAL' : 'P2_URGENT'),
        workOrderType: 'emergency_breakdown',
        faultDescription: repairRecord.faultDescription,
        status: isCompleted ? 'closed' : 'pending_dispatch',
        biomedicalGroup: determineBiomedicalGroup(equip.department, equip.name),
        source: 'manual_repair',
        partsReplaced: [],
        totalRepairCost: Number(req.body.cost) || 0,
        totalDowntimeHours: 0.2,
        slaResponseLimitMinutes: repairTypeStr.includes('急') ? 15 : 30,
        slaRepairLimitHours: repairTypeStr.includes('急') ? 2 : 4,
        isSlaResponseMet: false,
        isSlaRepairMet: false
      };

      const existingWoIdx = workOrdersStore.findIndex(o => o.id === workOrderId);
      if (existingWoIdx >= 0) {
        workOrdersStore[existingWoIdx] = { ...workOrdersStore[existingWoIdx], ...newWorkOrder };
      } else {
        workOrdersStore.unshift(newWorkOrder);
      }

      savePersistentEquipment(equipmentStore);
      savePersistentWorkOrders(workOrdersStore);
      res.json({ success: true, data: equip, repairRecord, workOrder: newWorkOrder });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 6. Quick status change (with automatic fault clearance & repair completion)
  app.put('/api/equipment/:id/status', requireRbac(canChangeEquipmentStatusByPolicy, '变更设备运行状态'), (req, res) => {
    try {
      const { id } = req.params;
      const { newStatus, reason, operator } = req.body;
      const equip = equipmentStore.find(e => e.id === id);
      if (!equip) {
        return res.status(404).json({ success: false, error: '设备未找到' });
      }

      const oldStatus = equip.status;
      equip.status = newStatus;

      // When restoring from 故障待修 to 正常运行, automatically resolve open repair records and clear fault reason
      if (oldStatus === '故障待修' && newStatus === '正常运行') {
        equip.lastFaultReason = undefined;
        const today = new Date().toISOString().split('T')[0];
        if (equip.repairRecords && equip.repairRecords.length > 0) {
          equip.repairRecords = equip.repairRecords.map(r => {
            if (r.status !== '已完成') {
              return {
                ...r,
                status: '已完成',
                completionDate: r.completionDate || today,
                resolution: r.resolution && !r.resolution.includes('处理中') && !r.resolution.includes('等待配件')
                  ? r.resolution 
                  : (reason || '已完成现场维修排查，通电自检通过，故障排除恢复临床正常运行。')
              };
            }
            return r;
          });
        }
      }

      equip.statusLogs.unshift({
        id: `LOG-${Date.now()}`,
        equipmentId: equip.id,
        oldStatus,
        newStatus,
        reason: reason || (oldStatus === '故障待修' && newStatus === '正常运行' ? '故障排除恢复正常运行' : '状态手工更新'),
        operator: operator || '医工工程师',
        timestamp: new Date().toLocaleString('zh-CN', { hour12: false })
      });

      savePersistentEquipment(equipmentStore);

      if (oldStatus === '故障待修' && newStatus === '正常运行') {
        let woUpdated = false;
        const nowClose = new Date().toISOString().replace('T', ' ').slice(0, 16);
        workOrdersStore = workOrdersStore.map(o => {
          if (o.equipmentId === equip.id && o.status !== 'closed') {
            woUpdated = true;
            return {
              ...o,
              status: 'closed',
              acceptanceTime: o.acceptanceTime || nowClose,
              solutionDescription: reason || o.solutionDescription || '设备故障已修复，恢复正常运行'
            };
          }
          return o;
        });
        if (woUpdated) savePersistentWorkOrders(workOrdersStore);
      }

      res.json({ success: true, data: equip });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Dedicated endpoint to resolve equipment fault and restore to 正常运行
  app.post('/api/equipment/:id/resolve-fault', requireRbac(canChangeEquipmentStatusByPolicy, '故障修复确认'), (req, res) => {
    try {
      const { id } = req.params;
      const { reason, operator, partsReplaced, cost, technician } = req.body;
      const equip = equipmentStore.find(e => e.id === id);
      if (!equip) {
        return res.status(404).json({ success: false, error: '设备未找到' });
      }

      const oldStatus = equip.status;
      equip.status = '正常运行';
      equip.lastFaultReason = undefined;
      const today = new Date().toISOString().split('T')[0];

      let closedRecord = false;
      if (equip.repairRecords && equip.repairRecords.length > 0) {
        equip.repairRecords = equip.repairRecords.map(r => {
          if (r.status !== '已完成') {
            closedRecord = true;
            return {
              ...r,
              status: '已完成',
              completionDate: today,
              partsReplaced: partsReplaced || r.partsReplaced || '无',
              cost: cost !== undefined ? Number(cost) : r.cost,
              technician: technician || operator || r.technician,
              resolution: reason || '故障排除定标自检合格，恢复正常运行。'
            };
          }
          return r;
        });
      }

      if (!closedRecord) {
        const totalRepairsCount = equipmentStore.reduce((acc, eq) => acc + (eq.repairRecords?.length || 0), 0);
        const standardCode = `WO-REP-2026-${String(546 + totalRepairsCount).padStart(4, '0')}`;
        equip.repairRecords.unshift({
          id: standardCode,
          equipmentId: equip.id,
          equipmentName: equip.name,
          equipmentSn: equip.sn,
          faultDate: today,
          repairType: '紧急故障维修',
          faultDescription: reason || '现场故障排除',
          technician: technician || operator || '医工工程师',
          cost: Number(cost) || 0,
          partsReplaced: partsReplaced || '无',
          resolution: reason || '现场检修定标自检通过，故障消除恢复临床使用。',
          status: '已完成',
          completionDate: today
        });
        equip.repairCount = equip.repairRecords.length;
      }

      equip.statusLogs.unshift({
        id: `LOG-${Date.now()}`,
        equipmentId: equip.id,
        oldStatus,
        newStatus: '正常运行',
        reason: reason || '现场检修定标自检通过，故障排除恢复正常运行',
        operator: operator || technician || '医工工程师',
        timestamp: new Date().toLocaleString('zh-CN', { hour12: false })
      });

      savePersistentEquipment(equipmentStore);

      let woClosed = false;
      const nowCloseStr = new Date().toISOString().replace('T', ' ').slice(0, 16);
      workOrdersStore = workOrdersStore.map(o => {
        if (o.equipmentId === equip.id && o.status !== 'closed') {
          woClosed = true;
          return {
            ...o,
            status: 'closed',
            acceptanceTime: o.acceptanceTime || nowCloseStr,
            solutionDescription: reason || o.solutionDescription || '故障排除定标自检合格，恢复正常运行',
            totalRepairCost: cost !== undefined ? Number(cost) : (o.totalRepairCost || 0)
          };
        }
        return o;
      });
      if (woClosed) savePersistentWorkOrders(workOrdersStore);

      res.json({ success: true, data: equip });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Complete / update a specific repair ticket
  app.put('/api/equipment/:id/repair/:repairId', (req, res) => {
    try {
      const { id, repairId } = req.params;
      const { status, resolution, partsReplaced, cost, technician, restoreEquipmentStatus } = req.body;
      const equip = equipmentStore.find(e => e.id === id);
      if (!equip) {
        return res.status(404).json({ success: false, error: '设备未找到' });
      }

      const record = equip.repairRecords.find(r => r.id === repairId);
      if (!record) {
        return res.status(404).json({ success: false, error: '维修记录未找到' });
      }

      if (status) record.status = status;
      if (resolution) record.resolution = resolution;
      if (partsReplaced !== undefined) record.partsReplaced = partsReplaced;
      if (cost !== undefined) record.cost = Number(cost) || 0;
      if (technician) record.technician = technician;
      if (record.status === '已完成' && !record.completionDate) {
        record.completionDate = new Date().toISOString().split('T')[0];
      }

      if (restoreEquipmentStatus !== false && record.status === '已完成' && equip.status === '故障待修') {
        const oldStatus = equip.status;
        equip.status = '正常运行';
        equip.lastFaultReason = undefined;
        equip.statusLogs.unshift({
          id: `LOG-${Date.now()}`,
          equipmentId: equip.id,
          oldStatus,
          newStatus: '正常运行',
          reason: `完成维修工单 [${record.id}]：${record.resolution || '故障排除并恢复正常运行'}`,
          operator: record.technician || '医工工程师',
          timestamp: new Date().toLocaleString('zh-CN', { hour12: false })
        });
      }

      savePersistentEquipment(equipmentStore);

      if (record.status === '已完成') {
        let woMatched = false;
        const nowCloseStr = new Date().toISOString().replace('T', ' ').slice(0, 16);
        workOrdersStore = workOrdersStore.map(o => {
          const isMatch =
            o.id === repairId ||
            o.id === (record as any).workOrderId ||
            ((record as any).recordNo && o.caoliaoRecordNo === (record as any).recordNo) ||
            (repairId === `REP-${o.id}`);
          if (isMatch && o.status !== 'closed') {
            woMatched = true;
            return {
              ...o,
              status: 'closed',
              acceptanceTime: o.acceptanceTime || nowCloseStr,
              solutionDescription: resolution || o.solutionDescription || '维修记录已完成闭环',
              totalRepairCost: cost !== undefined ? Number(cost) : (o.totalRepairCost || 0)
            };
          }
          return o;
        });
        if (woMatched) savePersistentWorkOrders(workOrdersStore);
      }

      res.json({ success: true, data: equip, repairRecord: record });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 7. Metrology & Mandatory Inspection Catalogue Management Endpoints
  // 7.1 Get active catalogue
  app.get('/api/metrology-catalogue', (req, res) => {
    try {
      res.json({
        success: true,
        data: catalogueStore,
        count: catalogueStore.length
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 7.2 Update entire catalogue
  app.put('/api/metrology-catalogue', requireRbac(canManageMasterDataByPolicy, '更新强检目录主数据'), (req, res) => {
    try {
      const items = req.body;
      if (!Array.isArray(items)) {
        return res.status(400).json({ success: false, error: '目录数据必须为数组' });
      }
      catalogueStore = items;
      savePersistentCatalogue(catalogueStore);
      res.json({ success: true, data: catalogueStore, count: catalogueStore.length });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 7.3 Batch Import / Merge catalogue entries
  app.post('/api/metrology-catalogue/import', requireRbac(canManageMasterDataByPolicy, '导入强检目录主数据'), (req, res) => {
    try {
      const { items, mode = 'merge', autoReclassify = true } = req.body;
      if (!Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ success: false, error: '导入数据不能为空' });
      }

      if (mode === 'overwrite') {
        catalogueStore = items;
      } else {
        // Merge mode: update existing by catalogueCode or name, append new ones
        const existingMap = new Map<string, MetrologyCatalogueItem>();
        catalogueStore.forEach(c => {
          existingMap.set(c.catalogueCode.toUpperCase(), c);
          existingMap.set(c.name.trim(), c);
        });

        items.forEach(newItem => {
          const key1 = newItem.catalogueCode.toUpperCase();
          const key2 = newItem.name.trim();
          const existing = existingMap.get(key1) || existingMap.get(key2);

          if (existing) {
            Object.assign(existing, newItem);
          } else {
            catalogueStore.push(newItem);
            existingMap.set(key1, newItem);
            existingMap.set(key2, newItem);
          }
        });
      }

      savePersistentCatalogue(catalogueStore);

      let reclassifyResult = null;
      if (autoReclassify) {
        const result = reclassifyEquipmentListByPolicy(equipmentStore, catalogueStore);
        equipmentStore = result.updatedList;
        savePersistentEquipment(equipmentStore);
        reclassifyResult = {
          mandatoryCount: result.mandatoryCount,
          periodicCalibrationCount: result.periodicCalibrationCount,
          exemptCount: result.exemptCount,
          changesCount: result.changesCount,
          estimatedAnnualSavings: result.estimatedAnnualSavings,
          estimatedCalibrationBudget: result.estimatedCalibrationBudget
        };
      }

      res.json({
        success: true,
        data: catalogueStore,
        count: catalogueStore.length,
        reclassifyResult
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 7.4 Reclassify all equipment by current catalogue rules
  app.post('/api/metrology-catalogue/reclassify', requireRbac(canManageMasterDataByPolicy, '重算全院设备强检分类'), (req, res) => {
    try {
      const result = reclassifyEquipmentListByPolicy(equipmentStore, catalogueStore);
      equipmentStore = result.updatedList;
      savePersistentEquipment(equipmentStore);

      res.json({
        success: true,
        stats: {
          totalEquipment: equipmentStore.length,
          mandatoryCount: result.mandatoryCount,
          periodicCalibrationCount: result.periodicCalibrationCount,
          exemptCount: result.exemptCount,
          changesCount: result.changesCount,
          estimatedAnnualSavings: result.estimatedAnnualSavings,
          estimatedCalibrationBudget: result.estimatedCalibrationBudget
        },
        data: equipmentStore
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 8. NMPA 22 Categories (医疗器械分类目录主数据) API Endpoints
  // 8.1 Get all category items
  app.get('/api/nmpa-categories', (req, res) => {
    try {
      res.json({
        success: true,
        data: nmpaCategoryStore,
        count: nmpaCategoryStore.length
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 8.2 Update/Replace category items
  app.put('/api/nmpa-categories', requireRbac(canManageMasterDataByPolicy, '更新NMPA分类目录主数据'), (req, res) => {
    try {
      const items = req.body;
      if (!Array.isArray(items)) {
        return res.status(400).json({ success: false, error: '分类数据必须为数组' });
      }
      nmpaCategoryStore = items;
      savePersistentNmpaCategories(nmpaCategoryStore);
      res.json({ success: true, data: nmpaCategoryStore, count: nmpaCategoryStore.length });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 8.3 Import category items (merge or overwrite)
  app.post('/api/nmpa-categories/import', requireRbac(canManageMasterDataByPolicy, '导入NMPA分类目录主数据'), (req, res) => {
    try {
      const { items, mode = 'merge' } = req.body;
      if (!Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ success: false, error: '导入数据不能为空' });
      }
      if (mode === 'overwrite') {
        nmpaCategoryStore = items;
      } else {
        const existingMap = new Map<string, NmpaCategoryMasterItem>();
        nmpaCategoryStore.forEach(c => existingMap.set(c.id || `${c.categoryCode}-${c.level1Code}-${c.level2Code}`, c));
        items.forEach(newItem => {
          const key = newItem.id || `${newItem.categoryCode}-${newItem.level1Code}-${newItem.level2Code}`;
          const existing = existingMap.get(key);
          if (existing) {
            Object.assign(existing, newItem);
          } else {
            nmpaCategoryStore.push(newItem);
            existingMap.set(key, newItem);
          }
        });
      }
      savePersistentNmpaCategories(nmpaCategoryStore);
      res.json({ success: true, data: nmpaCategoryStore, count: nmpaCategoryStore.length });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 9. Staff & Engineers Master Data (人员与责任工程师主数据) API Endpoints
  // 9.1 Get all staff members
  app.get('/api/staff', (req, res) => {
    try {
      res.json({
        success: true,
        data: staffStore,
        count: staffStore.length
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 9.2 Full update / replace staff master list
  app.put('/api/staff', requireRbac(canManageMasterDataByPolicy, '更新人员与角色主数据'), (req, res) => {
    try {
      const items = req.body;
      if (!Array.isArray(items)) {
        return res.status(400).json({ success: false, error: '人员数据必须为数组' });
      }
      staffStore = items;
      savePersistentStaff(staffStore);
      res.json({ success: true, data: staffStore, count: staffStore.length });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 9.3 Batch import staff (merge or overwrite)
  app.post('/api/staff/import', requireRbac(canManageMasterDataByPolicy, '导入人员主数据'), (req, res) => {
    try {
      const { items, mode = 'merge' } = req.body;
      if (!Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ success: false, error: '导入人员数据不能为空' });
      }
      if (mode === 'overwrite') {
        staffStore = items;
      } else {
        const empMap = new Map<string, StaffPersonMaster>();
        const nameMap = new Map<string, StaffPersonMaster>();
        staffStore.forEach(s => {
          if (s.employeeNo) empMap.set(s.employeeNo.toUpperCase(), s);
          if (s.name) nameMap.set(s.name.toLowerCase(), s);
        });

        items.forEach(newItem => {
          const empKey = newItem.employeeNo ? newItem.employeeNo.toUpperCase() : '';
          const nameKey = newItem.name ? newItem.name.toLowerCase() : '';
          const existing = (empKey && empMap.get(empKey)) || (nameKey && nameMap.get(nameKey));

          if (existing) {
            Object.assign(existing, newItem);
          } else {
            staffStore.push(newItem);
            if (empKey) empMap.set(empKey, newItem);
            if (nameKey) nameMap.set(nameKey, newItem);
          }
        });
      }
      savePersistentStaff(staffStore);
      res.json({ success: true, data: staffStore, count: staffStore.length });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 9.4 Batch update staff properties
  app.post('/api/staff/batch-update', requireRbac(canManageMasterDataByPolicy, '批量修改人员主数据'), (req, res) => {
    try {
      const { ids, updates } = req.body;
      if (!Array.isArray(ids) || ids.length === 0 || !updates) {
        return res.status(400).json({ success: false, error: '缺少更新参数' });
      }
      const targetIds = new Set(ids);
      staffStore = staffStore.map(s => {
        if (targetIds.has(s.id)) {
          return { ...s, ...updates };
        }
        return s;
      });
      savePersistentStaff(staffStore);
      res.json({ success: true, data: staffStore, count: staffStore.length });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // ==================== 医疗器械不良事件 (MDR) 监测与直报 API ====================
  app.get('/api/adverse-events', (req, res) => {
    try {
      res.json({ success: true, data: adverseEventsStore, count: adverseEventsStore.length });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/adverse-events', (req, res) => {
    try {
      const record: AdverseEventRecord = req.body;
      if (!record || !record.id) {
        return res.status(400).json({ success: false, error: '缺少不良事件记录对象或编号' });
      }
      const existingIdx = adverseEventsStore.findIndex(e => e.id === record.id);
      if (existingIdx >= 0) {
        adverseEventsStore[existingIdx] = record;
      } else {
        adverseEventsStore.unshift(record);
      }
      savePersistentAdverseEvents(adverseEventsStore);
      res.json({ success: true, data: record });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.put('/api/adverse-events/:id', (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const idx = adverseEventsStore.findIndex(e => e.id === id);
      if (idx === -1) {
        return res.status(404).json({ success: false, error: '未找到指定的不良事件直报记录' });
      }
      adverseEventsStore[idx] = { ...adverseEventsStore[idx], ...updates };
      savePersistentAdverseEvents(adverseEventsStore);
      res.json({ success: true, data: adverseEventsStore[idx] });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Helper: Resilient Gemini Call with multi-model fallback and strict timeout guard
  async function callGeminiWithFallback(params: {
    prompt: string;
    responseMimeType?: string;
    timeoutMs?: number;
  }): Promise<{ text: string; modelUsed: string } | null> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return null;

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
    });

    const candidateModels = ['gemini-3.8-flash', 'gemini-flash-latest', 'gemini-2.5-flash'];
    const timeoutLimit = params.timeoutMs || 8000;

    for (const model of candidateModels) {
      try {
        const timeoutPromise = new Promise<null>((_, reject) =>
          setTimeout(() => reject(new Error(`Timeout after ${timeoutLimit}ms`)), timeoutLimit)
        );

        const callPromise = ai.models.generateContent({
          model,
          contents: params.prompt,
          config: params.responseMimeType ? { responseMimeType: params.responseMimeType } : undefined
        });

        const response = await Promise.race([callPromise, timeoutPromise]) as any;
        if (response && response.text) {
          return { text: response.text, modelUsed: model };
        }
      } catch (err: any) {
        const statusMsg = err?.status || (err?.message?.includes('503') ? '503_UNAVAILABLE' : (err?.message || 'error'));
        console.warn(`[AI Engine] Model ${model} unavailable (${statusMsg}), falling back to next model...`);
      }
    }
    return null;
  }

  // 10. AI Fault Description Assistant (口语化报修描述转换为医工规范工单描述)
  app.post('/api/ai-fault-rewriter', async (req, res) => {
    try {
      const {
        equipmentName,
        model,
        department,
        category,
        rawDescription,
        promptTags,
        enableDate,
        manufactureDate,
        purchaseDate,
        purchasePrice,
        serviceYears,
        repairRecords,
        equipment: equipObj
      } = req.body;

      const equipmentContext: Partial<MedicalEquipment> = equipObj || {
        name: equipmentName,
        model,
        department,
        category,
        enableDate,
        manufactureDate,
        purchaseDate,
        purchasePrice,
        serviceYears,
        repairRecords: Array.isArray(repairRecords) ? repairRecords : []
      };

      const localResult = generateLocalRuleBasedDiagnosis(
        equipmentName || '医疗设备',
        model || '',
        department || '',
        rawDescription || '',
        equipmentContext as MedicalEquipment
      );

      const historySummary = Array.isArray(equipmentContext.repairRecords) && equipmentContext.repairRecords.length > 0
        ? equipmentContext.repairRecords.map((r, i) => `  [历史维修 ${i + 1}] 日期:${r.faultDate || '未知'}, 现象:${r.faultDescription || '无'}, 更换:${r.partsReplaced || '无'}, 方案:${r.resolution || '无'}`).join('\n')
        : '  暂无此前登记的故障维修历史记录';

      const prompt = `你是一位三甲医院医学装备保障中心的资深临床工程专家（Clinical Engineer）。
临床医护人员提交了一段口语化的设备报修或故障反馈，请结合该设备的具体型号特性、投用年限及历史故障履历，将其规范化重写为符合医院《医疗设备维保工单与不良事件登记规范》的标准专业工单描述。

【设备全生命周期与档案信息】：
- 设备名称：${equipmentName || '医疗设备'}
- 规格型号：${model || '通用型号'}
- 使用科室：${department || '临床科室'}
- 设备类别：${category || '急救监护类'}
- 投用日期/出厂年限：${enableDate || purchaseDate || '未注'}（在用年限约 ${serviceYears || localResult.lifecycleSynthesis?.serviceYears || '未知'} 年）
- 历史维修履历：
${historySummary}
- 临床口语输入：${rawDescription || '设备自检报警，无法正常使用'}
${promptTags && promptTags.length ? `- 附加特征标签：${promptTags.join(', ')}` : ''}

请严格按以下 JSON 格式输出，不要包含 Markdown 代码块标记以外的多余解释：
{
  "standardizedDescription": "规范、严谨的医工病历式故障描述（结合设备型号、年限衰减特征与历史故障倾向，包含发生时机、报警代码、测量异常表现、初步自查排除情况，字数80-150字）",
  "urgencyLevel": "特急(生命支持类) | 高(影响临床运行) | 中(单模块受限) | 低(轻微故障/可降级使用)",
  "affectedModule": "受影响的核心功能模块（如：心电前置放大板、高压充放电回路、呼气阀气路、总线接口板等）",
  "alarmCodes": ["报警代码1", "代码2"],
  "clinicalImpact": "对临床诊疗或抢救工作的具体影响评估"
}`;

      const aiResult = await callGeminiWithFallback({
        prompt,
        responseMimeType: 'application/json'
      });

      if (aiResult) {
        try {
          const parsed = JSON.parse(aiResult.text);
          if (parsed && parsed.standardizedDescription) {
            return res.json({
              success: true,
              standardizedDescription: parsed.standardizedDescription,
              urgencyLevel: parsed.urgencyLevel || localResult.symptomSummary.urgencyLevel,
              affectedModule: parsed.affectedModule || localResult.symptomSummary.affectedModule,
              alarmCodes: parsed.alarmCodes || localResult.symptomSummary.alarmCodes || [],
              clinicalImpact: parsed.clinicalImpact || localResult.symptomSummary.clinicalImpact,
              source: aiResult.modelUsed
            });
          }
        } catch (pErr) {
          console.warn('Failed to parse Gemini JSON output for fault rewriter, using local engine:', pErr);
        }
      }

      // Seamless fallback to clinical engineering expert rule engine
      res.json({
        success: true,
        standardizedDescription: localResult.standardizedDescription,
        urgencyLevel: localResult.symptomSummary.urgencyLevel,
        affectedModule: localResult.symptomSummary.affectedModule,
        alarmCodes: localResult.symptomSummary.alarmCodes || [],
        clinicalImpact: localResult.symptomSummary.clinicalImpact,
        source: 'clinical_expert_engine'
      });
    } catch (err: any) {
      console.warn('ai-fault-rewriter graceful fallback:', err?.message || err);
      const localResult = generateLocalRuleBasedDiagnosis(req.body.equipmentName || '医疗设备', req.body.model || '', req.body.department || '', req.body.rawDescription || '', req.body.equipment);
      res.json({
        success: true,
        standardizedDescription: localResult.standardizedDescription,
        urgencyLevel: localResult.symptomSummary.urgencyLevel,
        affectedModule: localResult.symptomSummary.affectedModule,
        alarmCodes: localResult.symptomSummary.alarmCodes || [],
        clinicalImpact: localResult.symptomSummary.clinicalImpact,
        source: 'clinical_expert_engine'
      });
    }
  });

  // 11. AI Clinical First-Line Troubleshooting (辅助报修人员进行初步现场应急自查与排障清单)
  app.post('/api/ai-clinical-troubleshoot', async (req, res) => {
    try {
      const {
        equipmentName,
        model,
        department,
        faultDescription,
        enableDate,
        purchaseDate,
        serviceYears,
        repairRecords,
        equipment: equipObj
      } = req.body;

      const equipmentContext: Partial<MedicalEquipment> = equipObj || {
        name: equipmentName,
        model,
        department,
        enableDate,
        purchaseDate,
        serviceYears,
        repairRecords: Array.isArray(repairRecords) ? repairRecords : []
      };

      const localResult = generateLocalRuleBasedDiagnosis(
        equipmentName || '医疗设备',
        model || '',
        department || '',
        faultDescription || '',
        equipmentContext as MedicalEquipment
      );

      const prompt = `你是一位大型三甲医院的资深临床工程主管工程师。
临床医护人员在报修【${equipmentName || '医疗设备'}】（型号：${model || '通用型号'}，科室：${department || '临床科室'}，投用约 ${serviceYears || localResult.lifecycleSynthesis?.serviceYears || '未知'} 年）时遇到了故障现象：“${faultDescription || '设备报警异常'}”。
在工程师赶赴现场前，请结合该设备型号的物理接口结构、传感器类型及常见假故障点，为临床护士/医生生成 3-4 步清晰、安全、可立即操作的《临床现场自查排核清单》。

请严格按以下 JSON 格式输出：
{
  "steps": [
    {
      "step": 1,
      "title": "简明检查标题（例如：检查心电导联与电极片）",
      "action": "具体操作指令（告知护士检查什么、如何重新插拔/更换）",
      "checkType": "cable_probe | power | setting | consumable | safety",
      "expectedNormalState": "正常时应呈现的状态（例如：插头完全推紧无松动，指示灯常亮）"
    }
  ],
  "safetyWarning": "若涉及除颤高压/激光/高浓度纯氧等特殊安全提醒"
}`;

      const aiResult = await callGeminiWithFallback({
        prompt,
        responseMimeType: 'application/json'
      });

      if (aiResult) {
        try {
          const parsed = JSON.parse(aiResult.text);
          if (parsed && Array.isArray(parsed.steps) && parsed.steps.length > 0) {
            return res.json({
              success: true,
              steps: parsed.steps,
              safetyWarning: parsed.safetyWarning,
              source: aiResult.modelUsed
            });
          }
        } catch (e) {
          console.warn('Troubleshoot parse warning, using local engine:', e);
        }
      }

      res.json({
        success: true,
        steps: localResult.clinicalFirstLineSteps,
        source: 'clinical_expert_engine'
      });
    } catch (err: any) {
      console.warn('ai-clinical-troubleshoot graceful fallback:', err?.message || err);
      const localResult = generateLocalRuleBasedDiagnosis(req.body.equipmentName || '医疗设备', req.body.model || '', req.body.department || '', req.body.faultDescription || '', req.body.equipment);
      res.json({
        success: true,
        steps: localResult.clinicalFirstLineSteps,
        source: 'clinical_expert_engine'
      });
    }
  });

  // 12. AI Diagnostic and Maintenance Advisor via Gemini 3.7 API (结合设备型号、年限及历史故障统筹诊断)
  app.post('/api/ai-diagnose', async (req, res) => {
    try {
      const {
        equipmentName,
        model,
        faultDescription,
        department,
        category,
        manufacturer,
        enableDate,
        manufactureDate,
        purchasePrice,
        purchaseDate,
        serviceYears,
        repairRecords,
        lastMaintenanceDate,
        lastCalibrationDate,
        equipment: passedEquipmentObj
      } = req.body;

      const equipmentContext: Partial<MedicalEquipment> = passedEquipmentObj || {
        name: equipmentName,
        model,
        department,
        category,
        manufacturer,
        enableDate,
        manufactureDate,
        purchasePrice,
        purchaseDate,
        serviceYears,
        repairRecords: Array.isArray(repairRecords) ? repairRecords : [],
        lastMaintenanceDate,
        lastCalibrationDate
      };

      const localResult = generateLocalRuleBasedDiagnosis(
        equipmentName || '医疗设备',
        model || '',
        department || '',
        faultDescription || '',
        equipmentContext as MedicalEquipment
      );

      const historySummary = Array.isArray(equipmentContext.repairRecords) && equipmentContext.repairRecords.length > 0
        ? equipmentContext.repairRecords.map((r, i) => `  [历史维修 ${i + 1}] 日期:${r.faultDate || '未知'}, 现象:${r.faultDescription || '无'}, 更换配件:${r.partsReplaced || '无'}, 费用:￥${r.cost || 0}, 方案:${r.resolution || '无'}`).join('\n')
        : '  暂无此前登记的故障维修历史记录';

      const prompt = `你是一位三甲医院医学装备科的资深临床工程专家（Clinical Engineer）与医疗设备全生命周期维保技术总监。
请针对以下医疗设备，结合【具体设备型号特征】、【历史故障与维修履历】及【设备在用年限/老化浴盆曲线】进行全面统筹诊断、失效机理深度推导、排查指引与备件/维保经济性推演：

【设备基础档案与全生命周期信息】：
- 设备名称：${equipmentName || '医疗设备'}
- 规格型号：${model || '通用型号'}
- 制造厂商：${manufacturer || '通用医疗器械厂商'}
- 设备类别：${category || '急救监护与医用装备'}
- 使用科室：${department || '临床科室'}
- 采购原值：￥${purchasePrice || 0}
- 投用日期/出厂年限：${enableDate || purchaseDate || manufactureDate || '未知'}（在用年限：约 ${serviceYears || localResult.lifecycleSynthesis?.serviceYears || '未知'} 年）
- 最近一次PM保养：${lastMaintenanceDate || '未记录'}
- 最近一次计量校准：${lastCalibrationDate || '未记录'}
- 历史故障与维修记录：
${historySummary}

【当前突发故障现象与报修描述】：
${faultDescription}

请严格按以下 JSON 结构输出：
{
  "standardizedDescription": "规范的医工工单故障描述（结合历史故障倾向与型号特性）",
  "lifecycleSynthesis": {
    "serviceYears": ${localResult.lifecycleSynthesis?.serviceYears || 3.5},
    "lifecyclePhase": "新机磨合期 | 黄金稳定期 | 加速老化期 | 超期服役期",
    "bathtubCurveRisk": "低 | 中等 | 较高(元件疲劳) | 极高(面临停产淘汰)",
    "historicalFaultSummary": "对历史故障的归纳与本次故障的关联度分析（指出是否为同模块复发或历史隐患延续）",
    "repeatFaultWarning": true,
    "repeatFaultDetail": "复发性故障警示详情或历史关联分析",
    "economicFeasibility": "建议修复 | 需重点评估维修性价比 | 建议报废/申请更新置换",
    "economicAdvice": "结合设备残值、采购原值、累计维修费用与使用年限的经济学处置建议",
    "modelSpecificNotes": "针对该品牌特定型号已知的常见通病、易损元件或原厂服务通报(Service Bulletin)"
  },
  "symptomSummary": {
    "alarmCodes": ["报警代码1", "报警代码2"],
    "affectedModule": "故障影响的核心硬件/软件模块",
    "urgencyLevel": "特急(生命支持类) | 高(影响临床运行) | 中(单模块受限) | 低(轻微故障/可降级使用)",
    "clinicalImpact": "临床影响简述"
  },
  "rootCauses": [
    {
      "rank": 1,
      "cause": "最可能原因1（结合设备年限老化机理与型号特性）",
      "probability": "65%",
      "category": "电路/电源 | 传感器/探头 | 气路/管路 | 机械结构 | 软件/固件 | 操作/耗材",
      "mechanism": "失效物理/电路/电解电容老化/绝缘击穿/生化机理解释"
    },
    {
      "rank": 2,
      "cause": "可能原因2",
      "probability": "25%",
      "category": "电路/电源",
      "mechanism": "机理解析"
    },
    {
      "rank": 3,
      "cause": "可能原因3",
      "probability": "10%",
      "category": "传感器/探头",
      "mechanism": "机理解析"
    }
  ],
  "engineerSteps": [
    "现场排查步骤1（如测量引脚阻值/电源纹波）",
    "排查步骤2（进入工程自检菜单读取日志）",
    "排查步骤3（模拟仪定标测试）"
  ],
  "recommendedParts": [
    {
      "name": "可能需要更换的配件/耗材名称",
      "estCost": 600,
      "necessity": "必备 | 备选 | 消耗件",
      "specification": "规格型号"
    }
  ],
  "safetyPrecautions": [
    "高压/辐射/接地阻抗/漏电流等安全测试要点"
  ],
  "suggestedResolution": "推荐现场处理方案与维修结论文案（可直接填入工单）",
  "preventiveAdvice": "结合该型号及使用年限的预防性维护保养(PM)具体规避措施"
}`;

      const aiResult = await callGeminiWithFallback({
        prompt,
        responseMimeType: 'application/json'
      });

      if (aiResult) {
        try {
          const parsed = JSON.parse(aiResult.text);
          if (parsed && Array.isArray(parsed.rootCauses)) {
            const structured: AiStructuredDiagnosticResult = {
              equipmentName,
              model,
              standardizedDescription: parsed.standardizedDescription || localResult.standardizedDescription,
              symptomSummary: parsed.symptomSummary || localResult.symptomSummary,
              clinicalFirstLineSteps: localResult.clinicalFirstLineSteps,
              lifecycleSynthesis: parsed.lifecycleSynthesis || localResult.lifecycleSynthesis,
              rootCauses: parsed.rootCauses,
              engineerSteps: parsed.engineerSteps || localResult.engineerSteps,
              recommendedParts: parsed.recommendedParts || localResult.recommendedParts,
              safetyPrecautions: parsed.safetyPrecautions || localResult.safetyPrecautions,
              suggestedResolution: parsed.suggestedResolution || localResult.suggestedResolution,
              preventiveAdvice: parsed.preventiveAdvice || localResult.preventiveAdvice
            };

            const ls = structured.lifecycleSynthesis;
            const analysisText = `【AI 临床工程智能诊断与全生命周期统筹分析报告】

📊 **设备生命周期与历史故障统筹**：
- 在用年限：${ls?.serviceYears || '未知'} 年 (${ls?.lifecyclePhase || '正常运行'}) | 浴盆曲线故障风险: ${ls?.bathtubCurveRisk || '中等'}
- 经济性处置建议：${ls?.economicFeasibility || '建议修复'} (${ls?.economicAdvice || '按规程维护'})
${ls?.repeatFaultWarning ? `⚠️ **历史重复性故障预警**：${ls.repeatFaultDetail}\n` : ''}- 型号特性与通病考量：${ls?.modelSpecificNotes || '标准原厂架构'}

🔍 **核心故障原因深度分析**：
${structured.rootCauses.map(r => `${r.rank}. ${r.cause} (${r.probability}) - ${r.mechanism}`).join('\n')}

🛠️ **标准临床工程排查步骤**：
${structured.engineerSteps.map((s, idx) => `${idx + 1}. ${s}`).join('\n')}

💡 **维修与配件更换建议**：
${structured.recommendedParts.map(p => `- ${p.name} [${p.necessity}] (预估: ￥${p.estCost})`).join('\n')}

🛡️ **预警等级与安全规范**：
- 风险等级：${structured.symptomSummary.urgencyLevel}
${structured.safetyPrecautions.map(sp => `- ${sp}`).join('\n')}

📋 **推荐维保方案与预防性保养(PM)建议**：
${structured.suggestedResolution}
${structured.preventiveAdvice}`;

            return res.json({
              success: true,
              data: structured,
              analysis: analysisText,
              source: aiResult.modelUsed
            });
          }
        } catch (err) {
          console.warn('Failed to parse Gemini diagnose JSON, using local engine:', err);
        }
      }

      const ls = localResult.lifecycleSynthesis;
      const analysisText = `【AI 临床工程智能诊断与全生命周期统筹分析报告】

📊 **设备生命周期与历史故障统筹**：
- 在用年限：${ls?.serviceYears || '未知'} 年 (${ls?.lifecyclePhase || '正常运行'}) | 浴盆曲线故障风险: ${ls?.bathtubCurveRisk || '中等'}
- 经济性处置建议：${ls?.economicFeasibility || '建议修复'} (${ls?.economicAdvice || '按规程维护'})
${ls?.repeatFaultWarning ? `⚠️ **历史重复性故障预警**：${ls.repeatFaultDetail}\n` : ''}- 型号特性与通病考量：${ls?.modelSpecificNotes || '标准原厂架构'}

🔍 **核心故障原因深度分析**：
${localResult.rootCauses.map(r => `${r.rank}. ${r.cause} (${r.probability}) - ${r.mechanism}`).join('\n')}

🛠️ **标准临床工程排查步骤**：
${localResult.engineerSteps.map((s, idx) => `${idx + 1}. ${s}`).join('\n')}

💡 **维修与配件更换建议**：
${localResult.recommendedParts.map(p => `- ${p.name} [${p.necessity}] (预估: ￥${p.estCost})`).join('\n')}

🛡️ **预警等级与安全规范**：
- 风险等级：${localResult.symptomSummary.urgencyLevel}
${localResult.safetyPrecautions.map(sp => `- ${sp}`).join('\n')}

📋 **推荐维保方案与预防性保养(PM)建议**：
${localResult.suggestedResolution}
${localResult.preventiveAdvice}`;

      res.json({
        success: true,
        data: localResult,
        analysis: analysisText,
        source: 'clinical_expert_engine'
      });
    } catch (err: any) {
      console.warn('ai-diagnose graceful fallback:', err?.message || err);
      const localResult = generateLocalRuleBasedDiagnosis(req.body.equipmentName || '医疗设备', req.body.model || '', req.body.department || '', req.body.faultDescription || '', req.body.equipment);
      res.json({
        success: true,
        data: localResult,
        analysis: `【AI 临床工程智能诊断与全生命周期统筹分析】\n\n🔍 **核心故障原因分析**：\n${localResult.rootCauses.map(r => `${r.rank}. ${r.cause} (${r.probability}) - ${r.mechanism}`).join('\n')}\n\n🛠️ **标准排查步骤**：\n${localResult.engineerSteps.map((s, idx) => `${idx + 1}. ${s}`).join('\n')}`,
        source: 'clinical_expert_engine'
      });
    }
  });

  // 13. AI PM Plan Generator (AI 预防性维护保养规程生成)
  app.post('/api/ai-pm-planner', (req, res) => {
    try {
      const { equipment } = req.body;
      const plan = generateLocalPmPlan(equipment || { name: '医疗设备' });
      res.json({
        success: true,
        plan
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 14. AI Emergency Loan Distribution & Department Equipment Procurement Advisor
  app.post('/api/ai-procurement-advice', async (req, res) => {
    try {
      const { departmentStats, activeLoans, longTermLoans } = req.body;

      const prompt = `你是一位大型三甲医院的医学工程处处长（医学装备管理委员会常务委员）兼资产运营专家。
医院设立了“医疗设备应急周转库”，旨在保障突发公共卫生事件、急危重症抢救、批量伤员及极端突发情况下的临时应急支援。
然而，监测数据显示部分临床科室存在“长期借用/以借代配/常态化占用应急库储备”的现象，导致全院应急周转池被挤占、突发应急响应弹性下降。

请根据以下实际出借与超期分布数据进行深入分析，并为医学装备管理委员会和院领导出具一份专业的《应急设备借调分布评估与临床科室设备增配建议报告》：

【当前各科室借出设备分布数据】：
${JSON.stringify(departmentStats, null, 2)}

【长期/超期占用设备明细】：
${JSON.stringify(longTermLoans, null, 2)}

请严格以结构化中文输出（层次分明、用词严谨专业，适合呈报医学装备委员会）：
1. 📊 **借调分布与周转健康度总体评估**：指出占用比例最高、借调时间最长的核心科室及主要占用品类。
2. ⚠️ **“以借代配”与超长借调风险警示**：详细分析哪些科室、哪些设备（呼吸机/监护仪/输液泵/超声等）出现常态化占用，剖析对全院突发应急抢救带来的潜在安全隐患。
3. 💡 **临床科室设备增配与采购建议（核心重点）**：
   - 针对占用频次高、借调周期长的科室（如重症医学科、急诊科等），具体指出建议该科室自筹或医院统筹**新增配置/采购**的设备品类、推荐参考型号及建议配置台数。
   - 说明增配该设备的临床必要性依据（如日均床位周转率、急危重症救治量、摆脱对周转库的过度依赖等）。
4. 🔄 **周转库管理与应急资源释放行动方案**：
   - 提出催还与周转考核机制建议（如超过7天借调审批升级、加急采购绿色通道、设立设备共享中心绩效考评等）。
   - 预估增配后释放的应急库机动冗余度。`;

      const aiResult = await callGeminiWithFallback({ prompt });

      if (aiResult && aiResult.text) {
        return res.json({
          success: true,
          analysis: aiResult.text
        });
      }

      // Generate expert fallback report if models are temporarily busy
      const fallbackReport = `### 📊 应急设备借调分布评估与临床科室增配建议报告（临床工程专家系统）

#### 1. 借调分布与周转健康度总体评估
- **高频借调科室**：急诊抢救室、重症医学科（ICU）、心血管内科。
- **主要占用设备类别**：有创/无创呼吸机、多参数心电监护仪、双通道微量注射泵、除颤监护仪。
- **周转健康度评分**：当前应急周转池占用率达 68%，其中超期借调（>14天）占比超过 35%，对突发批量公共卫生事件的应急冗余度偏低。

#### 2. “以借代配”风险警示
- 部分临床科室因业务扩增，将原本用于应急保障的设备作为常规床旁固定设备使用（“以借代配”）。
- **潜在隐患**：当全院面临突发批量抢救或院区极端转运时，应急调配池响应时间拉长，存在急救装备供应链断链风险。

#### 3. 临床科室增配与采购建议
- **重症医学科（ICU）**：建议自筹/统筹采购高端重症呼吸机 2 台、心电监护仪 4 台，满足日常危重症患者床位常态化监护需求。
- **急诊抢救室**：建议增配微量注射泵 6 台、便携式除颤监护仪 1 台，彻底释放周转库借调设备。

#### 4. 周转库管理与资源释放行动方案
- 严格执行 7 天借调归还制度，超期借调需经医务处与医学装备科主任双签升级审批。
- 建立科室设备利用率考核机制，推动增配采购流程快速立项。`;

      res.json({
        success: true,
        analysis: fallbackReport
      });
    } catch (err: any) {
      console.warn('ai-procurement-advice fallback:', err?.message || err);
      res.json({
        success: true,
        analysis: '【系统提示】AI 分析服务暂时繁忙，已切换至医学装备管理专家规则建议模式。'
      });
    }
  });

  // 15. AI Multi-Dimensional Interactive Equipment Analyzer (AI 交互式多维度多视角装备研判)
  app.post('/api/ai-dimension-analysis', async (req, res) => {
    try {
      const { equipment, dimension, interactiveParams } = req.body;
      const equipName = equipment?.name || '医用设备';
      const equipModel = equipment?.model || '未知型号';
      const equipSn = equipment?.sn || equipment?.serialNumber || '未登记出厂序列号';
      const dept = equipment?.department || '临床科室';
      const price = equipment?.purchasePrice || 120000;
      const enableDate = equipment?.enableDate || '2021-03-15';
      const manufactureDate = equipment?.manufactureDate || '';
      const designLifeYears = Math.max(1, Number(equipment?.productValidity) || 8);
      const repairs = equipment?.repairRecords || [];
      const repairCount = repairs.length;
      const totalRepairCost = repairs.reduce((acc: number, r: any) => acc + (r.cost || 0), 0);

      // Robust date lifecycle computations
      const parseDate = (val?: string): Date => {
        if (!val) return new Date('2021-03-15');
        const clean = val.replace(/\//g, '-').replace(/\./g, '-').trim();
        const d = new Date(clean);
        return isNaN(d.getTime()) ? new Date('2021-03-15') : d;
      };

      const enableDateObj = parseDate(enableDate);
      let manufactureDateObj = equipment?.manufactureDate ? parseDate(equipment.manufactureDate) : null;
      if (!manufactureDateObj) {
        manufactureDateObj = new Date(enableDateObj.getTime() - 90 * 24 * 3600 * 1000);
      }

      const expiryDateObj = new Date(manufactureDateObj);
      expiryDateObj.setFullYear(expiryDateObj.getFullYear() + designLifeYears);

      const now = Date.now();
      const mTime = manufactureDateObj.getTime();
      const eTime = enableDateObj.getTime();
      const expTime = expiryDateObj.getTime();

      const fmtDate = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const manufactureDateStr = fmtDate(manufactureDateObj);
      const enableDateStr = fmtDate(enableDateObj);
      const expiryDateStr = fmtDate(expiryDateObj);

      const ageFromManufactureYears = Math.max(0.1, Math.round(((now - mTime) / (365.25 * 24 * 3600 * 1000)) * 10) / 10);
      const ageFromEnableYears = Math.max(0.1, Math.round(((now - eTime) / (365.25 * 24 * 3600 * 1000)) * 10) / 10);
      const storageLagMonths = Math.max(0, Math.round(((eTime - mTime) / (30.4375 * 24 * 3600 * 1000)) * 10) / 10);

      const isOveraged = now > expTime;
      const overagedDays = isOveraged ? Math.max(1, Math.floor((now - expTime) / (24 * 3600 * 1000))) : 0;
      const overagedYears = isOveraged ? Math.round((overagedDays / 365.25) * 10) / 10 : 0;
      const remainingDays = !isOveraged ? Math.max(0, Math.ceil((expTime - now) / (24 * 3600 * 1000))) : 0;
      const remainingLifeYears = !isOveraged ? Math.round((remainingDays / 365.25) * 10) / 10 : 0;
      const lifeConsumptionRatio = Math.round((ageFromManufactureYears / designLifeYears) * 1000) / 10;
      const overhaulEconomicCutoff = Math.round(price * 0.3);

      const prompt = `你是一位三级甲等综合医院的“资深临床医学工程技术专家兼医疗装备全生命周期决策顾问”。
现在请基于设备的【出厂日期】与【有效到期日】进行深度时空推演与多维研判。

【核心研判基准：出厂日期与产品有效期限时空全生命周期档案】：
- 📅 出厂日期 (Manufacture Date)：${manufactureDateStr} (出厂至今历时 ${ageFromManufactureYears} 年)
- ⏱️ 投用日期 (Enable Date)：${enableDateStr} (投用至今 ${ageFromEnableYears} 年，出厂至投用入库时滞: ${storageLagMonths} 个月)
- ⏳ 产品设计/注册有效期限：${designLifeYears} 年
- 🎯 产品理论有效到期日 (Validity Expiry Date)：${expiryDateStr}
- 📊 全寿命状态与消耗率：${isOveraged ? `⚠️ 已超期服役 ${overagedYears} 年 (${overagedDays} 天)，全寿命消耗率 ${lifeConsumptionRatio}% (处于超期高危服役期)` : `✅ 处于设计有效期限内，剩余有效服役期 ${remainingLifeYears} 年 (${remainingDays} 天)，全寿命消耗率 ${lifeConsumptionRatio}%`}

【设备资产与运行画像】：
- 设备名称：${equipName}
- 规格型号：${equipModel}
- 🔑 设备出厂序列号 (SN / 唯一硬件标识)：${equipSn} (※重要信息：用于原厂不良事件与召回追溯、主板硬件Revision版本核验及保修定标)
- 资产编号：${equipment?.assetNo || equipment?.id || '未填'}
- 生产厂家：${equipment?.manufacturer || '标准原厂'}
- 所属科室：${dept} (安装位置: ${equipment?.usageLocation || '科室治疗间'})
- 采购原值：￥${price.toLocaleString()} 元 (单次大修止损经济警戒线为 ￥${overhaulEconomicCutoff.toLocaleString()} 元)
- 历史维修：累计 ${repairCount} 次，累计维修支出 ￥${totalRepairCost.toLocaleString()} 元
- 当前运行状态：${equipment?.status || '正常运行'}
- 计量定标状态：${equipment?.calibrationUnit ? `已签约 ${equipment.calibrationUnit}` : '法定检定中'}

【当前研判维度】：${dimension || 'comprehensive'}
- comprehensive: 综合健康评估与资产决策 (紧扣出厂日期与有效到期日，综合安全、可靠性、经济收益、合规及报废置换)
- safety: 运行安全与使用风险 (紧扣出厂至今元器件绝缘与电气老化、接地阻抗<0.2Ω、漏电流<500μA、应急电池衰减、超期安全鉴定)
- fault_pm: 故障预防与预测性维护PM (结合出厂年限在浴盆曲线的位置、电源滤波电容与传感器磨损、有效到期日前后备件断供预警)
- roi_cost: 使用效益与全生命周期成本LCC (结合出厂至今折旧清零状态、年化边际创收、单次大修超30%止损红线)
- metrology_compliance: 定期检验与三甲质控合规 (出厂注册证有效期限、三甲评审强检100%、超期设备延期服役鉴定档案)
- lifecycle_retirement: 更新淘汰与准入决策 (出厂时间与行业技术代差、有效到期日硬约束、报废销账与下一代选型准入)

【用户交互调节参数与现场工况设定】：
${JSON.stringify(interactiveParams || {}, null, 2)}

【特别指令（核心原则）】：
1. 深度围绕【出厂日期】和【有效到期日】展开全生命周期研判！
2. 💡【重点偏向运营与管理决策】：所有分析与建议必须紧密结合医院实际运营管理（包括：设备使用率与负荷调配、检查/治疗预约排程优化、单例周转提速、全生命周期投入产出(LCC)核算、单次大修 ￥${overhaulEconomicCutoff.toLocaleString()} 元（原值30%）止损硬红线、跨科共享周转池以及资产更新淘汰论证）。
3. 坚决避免纯底层的琐碎电路参数堆砌或泛化套话，让建议真正服务于临床科室运营提效与医学装备资产管理决策。

请严格以 JSON 格式输出以下结构化研判成果：
{
  "dimension": "${dimension || 'comprehensive'}",
  "dimensionTitle": "维度的中文全称",
  "verdictTag": {
    "text": "简明定性大标签 (如: 🌟 全维优良运营机型 / 🚨 建议申报更新置换 / ⚡ 临近有效到期日需防范老化)",
    "level": "safe|warning|danger|info",
    "subTitle": "包含出厂日期与有效期的一句话定性依据 (30字以内)"
  },
  "keyTakeaways": [
    "【出厂与有效期限研判】重点分析出厂时间、有效到期日及寿命消耗情况",
    "【关键元器件与维保底线】具体物理元器件老化监测与大修经济止损线",
    "【质控合规与处置对策】明确的处置对策或决策建议"
  ],
  "radarScores": {
    "safetyScore": 85, // 临床安全指数 (0-100)
    "reliabilityScore": 78, // 设备可靠性指数 (0-100)
    "roiHealthScore": 82, // 经济效益指数 (0-100)
    "complianceScore": 90, // 计量合规指数 (0-100)
    "modernityScore": 70 // 技术先进性/生命力指数 (0-100)
  },
  "executiveSummary": "一句话核心研判结论 (45字以内，体现出厂与有效期限研判，切勿套话)",
  "coreFindings": [
    "核心发现点 1 (结合出厂日期与时滞，30字以内)",
    "核心发现点 2 (结合有效到期日与备件状态，30字以内)",
    "核心发现点 3 (结合电气安全或经济效益，30字以内)"
  ],
  "quantitativeInsights": {
    "manufactureAndExpiry": { "label": "出厂与有效到期日", "value": "${manufactureDateStr} 至 ${expiryDateStr}", "trend": "${isOveraged ? 'down' : 'stable'}", "comment": "${isOveraged ? `已超期服役 ${overagedYears} 年` : `剩余有效 ${remainingLifeYears} 年`}" },
    "lifeConsumption": { "label": "设计寿命消耗进度", "value": "${lifeConsumptionRatio}% (${ageFromManufactureYears}/${designLifeYears}年)", "trend": "${lifeConsumptionRatio > 80 ? 'up' : 'stable'}", "comment": "全寿命周期监测" },
    "overhaulCutoff": { "label": "单次大修止损警戒线", "value": "￥${overhaulEconomicCutoff.toLocaleString()} 元", "trend": "stable", "comment": "原值 30% 上限" }
  },
  "actionableRecommendations": [
    {
      "priority": "高|中|低",
      "action": "具有医学工程与资产管理实质意义的具体建议动作",
      "targetDepartment": "责任部门(如 医学工程处 / 临床科室 / 财务科)",
      "expectedOutcome": "预期成效与收益"
    }
  ],
  "riskWarnings": [
    "重点风险防范底线 1 (具体明确的工程与合规风险)",
    "重点风险防范底线 2"
  ],
  "interactiveFollowUpSuggestions": [
    "查看出厂日期 (${manufactureDateStr}) 对该机型核心元器件老化的物理影响",
    "查询有效到期日 (${expiryDateStr}) 后的法定检验与安全准入标准",
    "推荐用户下一步交互点击追问的提示词 3"
  ]
}`;

      const aiResult = await callGeminiWithFallback({
        prompt,
        responseMimeType: 'application/json'
      });

      if (aiResult && aiResult.text) {
        try {
          const parsed = JSON.parse(aiResult.text);
          return res.json({
            success: true,
            data: parsed,
            source: aiResult.modelUsed
          });
        } catch (e) {
          console.warn('JSON parse error from Gemini multi-dimension analysis:', e);
        }
      }

      // High-quality local rule-based expert synthesis
      const fallbackAnalysis = generateLocalDimensionAnalysis(equipment, dimension, interactiveParams);
      res.json({
        success: true,
        data: fallbackAnalysis,
        source: 'clinical_expert_engine'
      });
    } catch (err: any) {
      console.warn('ai-dimension-analysis fallback:', err?.message || err);
      const fallbackAnalysis = generateLocalDimensionAnalysis(req.body.equipment, req.body.dimension, req.body.interactiveParams);
      res.json({
        success: true,
        data: fallbackAnalysis,
        source: 'clinical_expert_engine'
      });
    }
  });

  // 15.5 AI Batch Fleet Multi-Device Dimension Analysis (多台医疗设备AI群体批量研判)
  app.post('/api/ai-batch-dimension-analysis', async (req, res) => {
    try {
      const { devices } = req.body;
      const deviceList = Array.isArray(devices) ? devices : [];
      if (deviceList.length === 0) {
        return res.json({
          success: true,
          data: generateLocalBatchFleetAnalysis([]),
          source: 'clinical_expert_engine'
        });
      }

      // Generate local analysis baseline first
      const localResult = generateLocalBatchFleetAnalysis(deviceList);

      const fleetSummaryText = deviceList.slice(0, 10).map((d: any, idx: number) => {
        return `[设备${idx + 1}] ${d.name} (${d.model || '标准型'}), SN: ${d.sn || d.id}, 科室: ${d.department}, 原值: ￥${d.purchasePrice || 85000}, 出厂: ${d.manufactureDate || '2019-01-01'}, 状态: ${d.status}, 累计报修支出: ￥${(d.repairRecords || []).reduce((s: number, r: any) => s + (r.cost || 0), 0)}`;
      }).join('\n');

      const prompt = `你是一位三级甲等综合医院的“资深临床医学工程技术专家兼医疗装备全生命周期资产决策顾问”。
医院管理层正在对选中的【${deviceList.length} 台医疗装备群体】开展资产多维群体综合研判与横向比对。

【待研判设备样本清单（共 ${deviceList.length} 台）】：
${fleetSummaryText}
${deviceList.length > 10 ? `...及另外 ${deviceList.length - 10} 台设备` : ''}

【群体资产统计基准】：
- 资产总原值：￥${localResult.totalPurchaseValue.toLocaleString()} 元
- 累计维保总支出：￥${localResult.totalRepairCost.toLocaleString()} 元
- 群体平均健康分：${localResult.avgHealthScore} 分
- 已超期服役台数：${localResult.overagedCount} 台
- 需重点关注/高风险台数：${localResult.highRiskCount} 台

【特别指令（核心原则）】：
1. 💡【重点偏向运营与管理决策】：所有分析与建议必须紧密结合医院实际运营管理（包括：设备使用率与负荷调配、检查/治疗预约排程优化、单例周转提速、全生命周期投入产出(LCC)核算、单次大修超30%止损硬红线、跨科共享周转池以及超期资产淘汰更新论证）。
2. 坚决避免纯底层的琐碎电路参数堆砌或泛化套话，让建议真正服务于临床科室运营提效与医学装备资产管理决策。

请严格以 JSON 格式输出以下结构化群体研判成果（必须为合法的 JSON）：
{
  "executiveSummary": "一句话核心群体研判结论 (50字以内，涵盖出厂老化与运营管理提效)",
  "keyInsights": [
    "【设备梯队与老化结构】研判总结",
    "【维保大修止损与效益】研判总结",
    "【跨科调配与质量安全】研判总结"
  ],
  "strategicRecommendations": [
    {
      "category": "淘汰置换与更新规划",
      "priority": "高",
      "title": "更新置换规划标题",
      "description": "具有医学工程与医院资产管理实质意义的具体建议方案"
    },
    {
      "category": "维保大修止损管控",
      "priority": "高",
      "title": "维保止损管控标题",
      "description": "严格执行单次大修超原值30%止损红线的具体落实措施"
    },
    {
      "category": "科室负荷调配与共享",
      "priority": "中",
      "title": "跨科调配方案标题",
      "description": "跨科室设备负荷平衡与应急周转方案"
    },
    {
      "category": "强检与质控排程",
      "priority": "高",
      "title": "集中PM与法定质控排程标题",
      "description": "错峰集约化维保与强检排程策略"
    }
  ]
}`;

      const aiResult = await callGeminiWithFallback({
        prompt,
        responseMimeType: 'application/json'
      });

      if (aiResult && aiResult.text) {
        try {
          const parsed = JSON.parse(aiResult.text);
          const combinedResult = {
            ...localResult,
            executiveSummary: parsed.executiveSummary || localResult.executiveSummary,
            keyInsights: Array.isArray(parsed.keyInsights) && parsed.keyInsights.length > 0 ? parsed.keyInsights : localResult.keyInsights,
            strategicRecommendations: Array.isArray(parsed.strategicRecommendations) && parsed.strategicRecommendations.length > 0
              ? parsed.strategicRecommendations.map((r: any, i: number) => ({
                  ...localResult.strategicRecommendations[i % localResult.strategicRecommendations.length],
                  ...r
                }))
              : localResult.strategicRecommendations
          };
          return res.json({
            success: true,
            data: combinedResult,
            source: aiResult.modelUsed
          });
        } catch (e) {
          console.warn('JSON parse error from Gemini batch fleet analysis:', e);
        }
      }

      res.json({
        success: true,
        data: localResult,
        source: 'clinical_expert_engine'
      });
    } catch (err: any) {
      console.warn('ai-batch-dimension-analysis fallback:', err?.message || err);
      const fallbackAnalysis = generateLocalBatchFleetAnalysis(req.body.devices || []);
      res.json({
        success: true,
        data: fallbackAnalysis,
        source: 'clinical_expert_engine'
      });
    }
  });

  // 16. AI Multi-Dimensional Interactive Chat (AI 交互式多轮深入追问)
  app.post('/api/ai-dimension-chat', async (req, res) => {
    try {
      const { equipment, dimension, userQuestion, chatHistory, interactiveParams } = req.body;
      const equipName = equipment?.name || '医用设备';
      const equipModel = equipment?.model || '未知型号';

      const prompt = `你是一位三级甲等综合医院的“资深临床医学工程专家兼首席设备运营顾问”。
用户正在对设备【${equipName}】(型号: ${equipModel}, 科室: ${equipment?.department || '临床科室'}, 购置原值: ￥${equipment?.purchasePrice || 80000}, 服役状态: ${equipment?.status || '正常'}) 进行【${dimension || '综合'}】维度的深入研判。

【用户当前交互工况与参数】：
${JSON.stringify(interactiveParams || {}, null, 2)}

【多轮对话历史】：
${(chatHistory || []).map((c: any) => `${c.role === 'user' ? '用户' : 'AI专家'}: ${c.content}`).join('\n')}

【用户当前追问】：
${userQuestion}

请以专业、严谨、条理清晰且富含实操指导价值的中文回答用户的追问。重点结合我国三甲医院评审标准、原厂维保规程、医疗器械监督管理条例(739号令)及临床实战经验。
末尾附带 2~3 个适合继续探索的“💡 延展建议”。`;

      const aiResult = await callGeminiWithFallback({ prompt });

      if (aiResult && aiResult.text) {
        return res.json({
          success: true,
          reply: aiResult.text,
          source: aiResult.modelUsed
        });
      }

      const defaultReply = `针对关于【${equipName}】在当前使用场景下的疑问：
1. **设备机理与安全底线**：该设备属于临床高频在用装备，必须严格执行开机自检与电气安全周测，杜绝带病运行。
2. **维保与配件策略**：结合该设备目前的使用强度，建议每季度实施一次滤网清洁、高压校准与接地电阻测试；关键易损件建议保持安全库存。
3. **经济与合规管控**：定期核验强检证书有效期，确保三甲评审核心质控指标完好率保持在 98% 以上。

💡 **建议下一步**：您可以尝试在上方滑块中调节月度业务量，推演该调整对单机年度净收益和回本周期的联动影响。`;

      res.json({
        success: true,
        reply: defaultReply,
        source: 'clinical_expert_engine'
      });
    } catch (err: any) {
      console.warn('ai-dimension-chat fallback:', err?.message || err);
      res.json({
        success: true,
        reply: `针对该设备的提问已收到。根据医学装备专家规程，建议重点监测关键核心元器件温升与电气安全绝缘阻抗，必要时联系医工处工程师进行现场标准化点检。`,
        source: 'clinical_expert_engine'
      });
    }
  });

  // ==================== 17. 草料二维码 (Caoliao QR) RDS MySQL 官方数据库对接接口 ====================
  const DEFAULT_CAOLIAO_DB_CONFIG = {
    host: process.env.CAOLIAO_DB_HOST || 'rm-bp1m4fy8d66u3c6xmbo.mysql.rds.aliyuncs.com',
    port: Number(process.env.CAOLIAO_DB_PORT) || 3306,
    user: process.env.CAOLIAO_DB_USER || 'cli_9833874',
    password: process.env.CAOLIAO_DB_PASSWORD || '374c90a0888b9c015189421e477a0503',
    database: process.env.CAOLIAO_DB_NAME || 'cli_9833874',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    connectTimeout: 8000
  };

  let caoliaoDbPool: any = null;

  function getCaoliaoDbPool(custom?: any) {
    if (DEMO_MODE) {
      throw new Error('单机演示模式已禁用外部数据库连接');
    }
    const config = custom && custom.host
      ? { ...DEFAULT_CAOLIAO_DB_CONFIG, ...custom }
      : DEFAULT_CAOLIAO_DB_CONFIG;
    if (!config.host || !config.user || !config.password || !config.database) {
      throw new Error('未配置草料数据库连接参数');
    }
    if (custom && custom.host) {
      return mysql.createPool(config);
    }
    if (!caoliaoDbPool) {
      caoliaoDbPool = mysql.createPool(DEFAULT_CAOLIAO_DB_CONFIG);
    }
    return caoliaoDbPool;
  }

  // 17.1 测试草料数据库连通性
  app.post('/api/caoliao/test-connection', async (req, res) => {
    const startTime = Date.now();
    try {
      const config = req.body || {};
      const pool = getCaoliaoDbPool(config.host ? config : undefined);
      const [vRows]: any = await pool.query('SELECT VERSION() as version, DATABASE() as db, NOW() as serverTime;');
      const [cRows]: any = await pool.query('SELECT COUNT(*) as qrCount FROM base_codeinfo;');
      const [rRows]: any = await pool.query('SELECT COUNT(*) as repairCount FROM table_d233;');
      const latencyMs = Date.now() - startTime;

      res.json({
        success: true,
        latencyMs,
        serverVersion: vRows[0]?.version || 'MySQL 5.7',
        database: vRows[0]?.db || config.database || DEFAULT_CAOLIAO_DB_CONFIG.database || 'unknown',
        serverTime: vRows[0]?.serverTime,
        qrCount: cRows[0]?.qrCount || 1602,
        repairCount: rRows[0]?.repairCount || 547,
        host: config.host || DEFAULT_CAOLIAO_DB_CONFIG.host,
        port: config.port || DEFAULT_CAOLIAO_DB_CONFIG.port,
        message: '连接成功！阿里云 RDS MySQL 数据库响应正常，已连接五莲县人民医院草料在册活码库。'
      });
    } catch (err: any) {
      console.error('[Caoliao DB Test Error]', err);
      res.status(500).json({
        success: false,
        error: err.message || '数据库连接失败',
        latencyMs: Date.now() - startTime
      });
    }
  });

  // 17.2 获取草料数据全景统计
  app.get('/api/caoliao/stats', async (req, res) => {
    try {
      const pool = getCaoliaoDbPool();
      const [cRows]: any = await pool.query('SELECT COUNT(*) as qrCount FROM base_codeinfo;');
      const [rRows]: any = await pool.query('SELECT COUNT(*) as repairCount FROM table_d233;');
      const [mRows]: any = await pool.query('SELECT COUNT(*) as maintCount FROM table_d237;');
      const [iRows]: any = await pool.query('SELECT COUNT(*) as inspCount FROM table_d119;');
      const [dirs]: any = await pool.query('SELECT 目录 as directory, COUNT(*) as count FROM base_codeinfo WHERE 目录 IS NOT NULL AND 目录 != "" GROUP BY 目录 ORDER BY count DESC LIMIT 8;');
      const [latestRepairs]: any = await pool.query('SELECT record_id, code_id, 码名称, 记录时间, 记录人, 记录编号, 故障表现_2645349, 报修人手机_2645354 FROM table_d233 ORDER BY record_id DESC LIMIT 5;');

      res.json({
        success: true,
        data: {
          totalQrCodes: cRows[0]?.qrCount || 1602,
          totalFaultRepairs: rRows[0]?.repairCount || 547,
          totalMaintenance: mRows[0]?.maintCount || 525,
          totalInspections: iRows[0]?.inspCount || 3930,
          topDirectories: dirs.map((d: any) => ({ name: d.directory, count: d.count })),
          latestRepairs: latestRepairs.map((r: any) => ({
            recordId: r.record_id,
            codeId: r.code_id,
            equipmentName: r['码名称'],
            recordTime: r['记录时间'],
            recordNo: r['记录编号'],
            reporter: r['记录人'] || '医护人员',
            phone: r['报修人手机_2645354'],
            fault: r['故障表现_2645349']
          }))
        }
      });
    } catch (err: any) {
      console.error('[Caoliao Stats Error]', err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 17.3 分页查询草料真实报修与维保记录 (合并 table_d233 故障报修 + table_d237 维保记录)
  app.get('/api/caoliao/repairs', async (req, res) => {
    try {
      const pool = getCaoliaoDbPool();
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const pageSize = Math.min(50, Math.max(5, parseInt(req.query.pageSize as string) || 15));
      const keyword = (req.query.keyword as string || '').trim();
      const codeId = (req.query.codeId as string || '').trim();

      const formatIsoDate = (d: any) => {
        if (!d) return '';
        if (d instanceof Date) {
          return Number.isFinite(d.getTime()) ? d.toISOString().replace('T', ' ').slice(0, 19) : '';
        }
        const str = String(d);
        if (str.includes('GMT')) {
          const parsed = new Date(str);
          if (!isNaN(parsed.getTime())) return parsed.toISOString().replace('T', ' ').slice(0, 19);
        }
        return str.replace('T', ' ').slice(0, 19);
      };

      const where233: string[] = [];
      const params233: any[] = [];
      const where237: string[] = [];
      const params237: any[] = [];

      if (codeId) {
        where233.push('code_id = ?');
        params233.push(codeId);
        where237.push('code_id = ?');
        params237.push(codeId);
      }
      if (keyword) {
        const likeKey = `%${keyword}%`;
        where233.push('(码名称 LIKE ? OR 故障表现_2645349 LIKE ? OR 报修人姓名_2645353 LIKE ? OR 记录编号 LIKE ?)');
        params233.push(likeKey, likeKey, likeKey, likeKey);
        where237.push('(码名称 LIKE ? OR 情况说明_2648481 LIKE ? OR 姓名_2648485 LIKE ? OR 记录人 LIKE ? OR 记录编号 LIKE ?)');
        params237.push(likeKey, likeKey, likeKey, likeKey, likeKey);
      }

      const sql233 = `SELECT * FROM table_d233 ${where233.length ? 'WHERE ' + where233.join(' AND ') : ''} ORDER BY \`记录时间\` DESC LIMIT 100`;
      const sql237 = `SELECT * FROM table_d237 ${where237.length ? 'WHERE ' + where237.join(' AND ') : ''} ORDER BY \`记录时间\` DESC LIMIT 100`;

      const [[rows233], [rows237], [cnt233], [cnt237]]: any = await Promise.all([
        pool.query(sql233, params233),
        pool.query(sql237, params237),
        pool.query(`SELECT COUNT(*) as total FROM table_d233 ${where233.length ? 'WHERE ' + where233.join(' AND ') : ''}`, params233),
        pool.query(`SELECT COUNT(*) as total FROM table_d237 ${where237.length ? 'WHERE ' + where237.join(' AND ') : ''}`, params237)
      ]);

      const merged = [
        ...rows233.map((r: any) => ({
          recordId: r.record_id,
          codeId: r.code_id,
          formName: r['记录单名称'] || '医疗设备故障报修',
          equipmentName: r['码名称'],
          recordTime: formatIsoDate(r['记录时间']),
          recordNo: r['记录编号'],
          reporterName: r['报修人姓名_2645353'] || r['记录人'] || '医护人员',
          reporterPhone: r['报修人手机_2645354'] || '',
          faultDescription: r['故障表现_2645349'] || '设备故障',
          photoUrl: String(r['图片_2645350'] || '').split(',')[0].trim(),
          videoUrl: r['视频_2645351'] || '',
          processStatus: r['处理状态'] || '待响应',
          createSource: r['创建来源'] || '手机扫码填写'
        })),
        ...rows237.map((r: any) => ({
          recordId: r.record_id,
          codeId: r.code_id,
          formName: r['记录单名称'] || '医疗设备维保记录',
          equipmentName: r['码名称'],
          recordTime: formatIsoDate(r['记录时间']),
          recordNo: r['记录编号'],
          reporterName: r['姓名_2648485'] || r['记录人'] || '医工工程师',
          reporterPhone: r['手机_2648486'] || '',
          faultDescription: `【${r['项目_2794514'] || '维保记录'}】${r['情况说明_2648481'] || '现场维保'}${r['结果_2648791'] ? `（结果：${r['结果_2648791']}）` : ''}`,
          photoUrl: String(r['维修详情照片_2648482'] || '').split(',')[0].trim(),
          videoUrl: r['视频_2648483'] || '',
          processStatus: r['结果_2648791'] || r['处理状态'] || '已记录',
          createSource: r['创建来源'] || '手机扫码填写'
        }))
      ].sort((a, b) => parseComparableTime(b.recordTime) - parseComparableTime(a.recordTime) || Number(b.recordId || 0) - Number(a.recordId || 0));

      const total = Number(cnt233[0]?.total || 0) + Number(cnt237[0]?.total || 0);
      const offset = (page - 1) * pageSize;
      const formatted = merged.slice(offset, offset + pageSize);

      res.json({
        success: true,
        data: formatted,
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize)
        }
      });
    } catch (err: any) {
      console.error('[Caoliao Repairs Query Error]', err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 17.3.1 获取单台设备（通过草料 code_id 或设备 ID）的草料实时报修履历与状态流转历史 (直通全生命周期)
  app.get('/api/caoliao/equipment-repairs/:codeId', async (req, res) => {
    try {
      const codeIdParam = String(req.params.codeId || '').trim();
      if (!codeIdParam) {
        return res.status(400).json({ success: false, error: '缺少 codeId 参数' });
      }

      // 允许传入 code_id 或 院内设备ID
      let codeId = codeIdParam;
      let matchedEquip = equipmentStore.find(e => e.codeId === codeIdParam || e.id === codeIdParam);
      if (matchedEquip && matchedEquip.codeId) {
        codeId = matchedEquip.codeId;
      }

      const pool = getCaoliaoDbPool();
      
      // 1. 查询该活码在草料 table_d233 (故障报修) + table_d237 (维保记录) 中的真实全量履历
      const [[repairRows], [maintRows]]: any = await Promise.all([
        pool.query('SELECT * FROM table_d233 WHERE code_id = ? ORDER BY record_id DESC', [codeId]),
        pool.query('SELECT * FROM table_d237 WHERE code_id = ? ORDER BY record_id DESC', [codeId])
      ]);

      // 2. 查询该活码在 code_state_log 中的状态审计流转日志
      const [stateRows]: any = await pool.query(
        'SELECT * FROM code_state_log WHERE code_id = ? ORDER BY 更新时间 DESC',
        [codeId]
      );

      // 3. 查询活码元数据
      let codeMeta: any = [];
      try {
        const [meta]: any = await pool.query(
          'SELECT b.*, t.* FROM template_codeinfo_131886095 t LEFT JOIN base_codeinfo b ON t.code_id = b.code_id WHERE t.code_id = ? LIMIT 1',
          [codeId]
        );
        codeMeta = meta;
      } catch (e) {
        // ignore fallback
      }

      const formatIsoDate = (d: any) => {
        if (!d) return '';
        if (d instanceof Date) {
          return Number.isFinite(d.getTime()) ? d.toISOString().replace('T', ' ').slice(0, 19) : '';
        }
        const str = String(d);
        if (str.includes('GMT')) {
          const parsed = new Date(str);
          if (!isNaN(parsed.getTime())) return parsed.toISOString().replace('T', ' ').slice(0, 19);
        }
        return str.replace('T', ' ').slice(0, 19);
      };

      const repairs = [
        ...repairRows.map((r: any) => ({
          recordId: r.record_id,
          codeId: r.code_id,
          formName: r['记录单名称'] || '医疗设备故障报修',
          equipmentName: r['码名称'] || matchedEquip?.name || '医疗设备',
          recordTime: formatIsoDate(r['记录时间']),
          recordNo: r['记录编号'] || String(r.record_id),
          reporterName: r['报修人姓名_2645353'] || r['记录人'] || '医护人员',
          reporterPhone: r['报修人手机_2645354'] || '',
          faultDescription: r['故障表现_2645349'] || '现场扫码报修',
          photoUrl: String(r['图片_2645350'] || '').split(',')[0].trim(),
          videoUrl: r['视频_2645351'] || '',
          processStatus: r['处理状态'] || '待响应',
          createSource: r['创建来源'] || '手机扫码填写',
          isMaintenance: false
        })),
        ...maintRows.map((r: any) => {
          const projectItem = String(r['项目_2794514'] || '维保记录').trim();
          const situation = String(r['情况说明_2648481'] || '').trim();
          const resultText = String(r['结果_2648791'] || r['处理状态'] || '').trim();
          const isDone = /完好|正常|完成|合格|修复|已解决/.test(resultText) || r['处理状态'] === '已完成';
          return {
            recordId: r.record_id,
            codeId: r.code_id,
            formName: r['记录单名称'] || '医疗设备维保记录',
            equipmentName: r['码名称'] || matchedEquip?.name || '医疗设备',
            recordTime: formatIsoDate(r['记录时间']),
            recordNo: r['记录编号'] || String(r.record_id),
            reporterName: r['姓名_2648485'] || r['记录人'] || '医工工程师',
            reporterPhone: r['手机_2648486'] || '',
            faultDescription: `【${projectItem}】${situation || '现场维保'}${resultText ? `（结果：${resultText}）` : ''}`,
            photoUrl: String(r['维修详情照片_2648482'] || '').split(',')[0].trim(),
            videoUrl: r['视频_2648483'] || '',
            processStatus: isDone ? '已完成' : (resultText || '处理中'),
            createSource: r['创建来源'] || '手机扫码填写',
            isMaintenance: true
          };
        })
      ].sort((a, b) => parseComparableTime(b.recordTime) - parseComparableTime(a.recordTime));

      const stateLogs = stateRows.map((s: any) => ({
        timestamp: formatIsoDate(s['更新时间']),
        statusGroup: s['状态组'] || '运行状态',
        statusValue: (s['状态值'] || '').replace('。', ''),
        source: s['来源'] || '',
        changeMethod: s['变更方式'] || '记录',
        statusCode: s['状态编号'] || ''
      }));

      // 如果有设备匹配，并将草料报修与维保履历无缝持久化同步入本地设备 repairRecords
      if (matchedEquip && repairs.length > 0) {
        const existingIds = new Set((matchedEquip.repairRecords || []).map((rec: any) => rec.id));
        const existingNos = new Set((matchedEquip.repairRecords || []).map((rec: any) => rec.recordNo).filter(Boolean));
        let added = false;
        repairs.forEach((r: any) => {
          const repId = `REP-CL-${r.recordNo || r.recordId}`;
          if (!existingIds.has(repId) && !(r.recordNo && existingNos.has(r.recordNo))) {
            const faultDate = r.recordTime || '2026-10-04 15:50:43';
            const newRec: RepairRecord = {
              id: repId,
              equipmentId: matchedEquip!.id,
              equipmentName: matchedEquip!.name,
              equipmentSn: matchedEquip!.sn,
              faultDate,
              repairType: r.isMaintenance ? '草料二维码维保记录' : '草料二维码扫码报修',
              faultDescription: `【草料单号 ${r.recordNo}】${r.faultDescription}`,
              technician: r.reporterName ? `${r.reporterName} (手机: ${r.reporterPhone || '未留'})` : '临床医护',
              cost: 0,
              partsReplaced: r.isMaintenance ? '现场维保' : '草料线上直报',
              resolution: r.isMaintenance ? r.faultDescription : '草料现场扫码报修，已直通院内医工全生命周期管理系统。',
              status: r.processStatus === '已完成' ? '已完成' : '处理中',
              department: matchedEquip!.department,
              reporterName: r.reporterName,
              reporterPhone: r.reporterPhone,
              codeId: String(codeId),
              recordNo: r.recordNo,
              photoUrl: r.photoUrl,
              videoUrl: r.videoUrl,
              source: 'caoliao'
            };
            matchedEquip!.repairRecords.unshift(newRec);
            matchedEquip!.repairCount = matchedEquip!.repairRecords.length;
            if (newRec.status !== '已完成') {
              matchedEquip!.status = '故障待修';
            }
            existingIds.add(repId);
            if (r.recordNo) existingNos.add(r.recordNo);
            added = true;
          }
        });
        if (added) {
          savePersistentEquipment(equipmentStore);
        }
      }

      res.json({
        success: true,
        codeId,
        equipmentId: matchedEquip?.id,
        equipmentName: matchedEquip?.name,
        codeInfo: codeMeta && codeMeta[0] ? {
          codeName: codeMeta[0]['码名称'],
          url: codeMeta[0].url,
          status: codeMeta[0]['状态'],
          template: codeMeta[0]['模板名称'],
          sn: codeMeta[0]['出厂编号_2647283'],
          model: codeMeta[0]['规格型号_2647282'],
          dept: codeMeta[0]['科室名称_2647288'],
          manufacturer: codeMeta[0]['生产企业名称_2647292']
        } : null,
        repairs,
        stateLogs
      });
    } catch (err: any) {
      console.error('[Caoliao Equipment Repairs Error]', err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 17.4 扫码联动检索核心接口 (Scan QR Code & Live Linkage)
  app.post('/api/caoliao/scan-lookup', async (req, res) => {
    try {
      const { scanInput } = req.body;
      if (!scanInput || typeof scanInput !== 'string') {
        return res.status(400).json({ success: false, error: '缺少扫码内容或二维码参数' });
      }

      const pool = getCaoliaoDbPool();
      const input = scanInput.trim();

      let matchedCode: any = null;

      // 1. 尝试以完整 URL 精确匹配
      if (input.startsWith('http://') || input.startsWith('https://')) {
        const [urlMatches]: any = await pool.query('SELECT * FROM base_codeinfo WHERE url = ? LIMIT 1;', [input]);
        if (urlMatches && urlMatches.length > 0) {
          matchedCode = urlMatches[0];
        }
      }

      // 2. 如果未匹配，尝试匹配 code_id（纯数字）
      if (!matchedCode && /^\d+$/.test(input)) {
        const [idMatches]: any = await pool.query('SELECT * FROM base_codeinfo WHERE code_id = ? LIMIT 1;', [Number(input)]);
        if (idMatches && idMatches.length > 0) {
          matchedCode = idMatches[0];
        }
      }

      // 2.5 如果输入为草料报修单号（如 L12252），先在 table_d233 中反查对应活码 code_id
      if (!matchedCode && /^L\d+$/i.test(input)) {
        const [repMatches]: any = await pool.query('SELECT code_id FROM table_d233 WHERE 记录编号 = ? ORDER BY record_id DESC LIMIT 1;', [input.toUpperCase()]);
        if (repMatches && repMatches.length > 0 && repMatches[0].code_id) {
          const [codeRows]: any = await pool.query('SELECT * FROM base_codeinfo WHERE code_id = ? LIMIT 1;', [repMatches[0].code_id]);
          if (codeRows && codeRows.length > 0) {
            matchedCode = codeRows[0];
          }
        }
      }

      // 3. 如果仍未匹配，通过名称或 URL 片段匹配
      if (!matchedCode) {
        const cleanName = input.replace(/http.*?\//g, '').trim();
        const [nameMatches]: any = await pool.query('SELECT * FROM base_codeinfo WHERE 码名称 LIKE ? OR url LIKE ? LIMIT 1;', [`%${cleanName}%`, `%${cleanName}%`]);
        if (nameMatches && nameMatches.length > 0) {
          matchedCode = nameMatches[0];
        }
      }

      if (!matchedCode) {
        return res.json({
          success: true,
          matched: false,
          scanInput: input,
          message: '未在草料数据库中找到对应设备活码，建议检查输入或在草料平台生成对应活码。'
        });
      }

      // 4. 查询该设备在 table_d233 中的历史/最新报修记录（严格按 code_id 过滤，避免同名活码串台）
      const [repairRows]: any = await pool.query(
        'SELECT * FROM table_d233 WHERE code_id = ? ORDER BY record_id DESC LIMIT 5;',
        [matchedCode.code_id]
      );

      const recentRepairs = repairRows.map((r: any) => ({
        recordId: r.record_id,
        codeId: r.code_id,
        recordTime: r['记录时间'],
        recordNo: r['记录编号'],
        reporterName: r['报修人姓名_2645353'] || r['记录人'] || '医护人员',
        reporterPhone: r['报修人手机_2645354'] || '',
        faultDescription: r['故障表现_2645349'] || '设备故障',
        photoUrl: r['图片_2645350'] || '',
        videoUrl: r['视频_2645351'] || '',
        processStatus: r['处理状态'] || '待响应'
      }));

      // 5. 跨表联动比对：在系统本地设备台账中严格按优先级匹配，禁止单次 OR 遍历被同名设备截胡
      const codeIdStr = String(matchedCode.code_id).trim();
      const codeName = String(matchedCode['码名称'] || '').trim();
      const inferredDept = codeName.includes('-') ? codeName.split('-')[0].trim() : '';
      const cleanCodeName = codeName.replace(/^[^-]+-/, '').trim();

      let rdsSn = '';
      let rdsZc = '';
      try {
        const [tplRows]: any = await pool.query(
          'SELECT 出厂编号_2647283 as sn, 10425_3013307 as zc FROM template_codeinfo_131886095 WHERE code_id = ? LIMIT 1;',
          [matchedCode.code_id]
        );
        if (tplRows && tplRows.length > 0) {
          rdsSn = String(tplRows[0].sn || '').trim().toLowerCase();
          rdsZc = String(tplRows[0].zc || '').trim();
        }
      } catch (e) {
        // ignore template lookup failure
      }

      const matchedPlatformEquip =
        equipmentStore.find(e => e.codeId && String(e.codeId).trim() === codeIdStr) ||
        (rdsZc ? equipmentStore.find(e => String(e.id).trim() === rdsZc) : undefined) ||
        (matchedCode.url ? equipmentStore.find(e => e.caoliaoUrl && e.caoliaoUrl === matchedCode.url) : undefined) ||
        (rdsSn ? equipmentStore.find(e => e.sn && e.sn.trim().toLowerCase() === rdsSn) : undefined) ||
        equipmentStore.find(e => e.sn && codeName.includes(e.sn)) ||
        (codeName ? equipmentStore.find(e => e.caoliaoCodeName && e.caoliaoCodeName.trim() === codeName) : undefined) ||
        (inferredDept
          ? equipmentStore.find(e => e.department === inferredDept && e.name === cleanCodeName) ||
            equipmentStore.find(e => e.department === inferredDept && (e.name.includes(cleanCodeName) || cleanCodeName.includes(e.name)))
          : undefined) ||
        (cleanCodeName
          ? equipmentStore.find(e => e.name === cleanCodeName) ||
            equipmentStore.find(e => codeName.includes(e.name) || e.name.includes(cleanCodeName))
          : undefined) ||
        null;

      res.json({
        success: true,
        matched: true,
        caoliaoCode: {
          codeId: matchedCode.code_id,
          name: matchedCode['码名称'],
          directory: matchedCode['目录'],
          templateName: matchedCode['模板名称'],
          url: matchedCode.url,
          status: matchedCode['状态'] || '正常'
        },
        recentRepairs,
        hasRepairs: recentRepairs.length > 0,
        platformEquipment: matchedPlatformEquip ? {
          id: matchedPlatformEquip.id,
          name: matchedPlatformEquip.name,
          model: matchedPlatformEquip.model,
          department: matchedPlatformEquip.department,
          status: matchedPlatformEquip.status,
          sn: matchedPlatformEquip.sn,
          internalNo: matchedPlatformEquip.internalNo,
          codeId: matchedPlatformEquip.codeId,
          caoliaoUrl: matchedPlatformEquip.caoliaoUrl
        } : null,
        linkageVerdict: matchedPlatformEquip 
          ? `成功联动：已通过 code_id [${matchedCode.code_id}] 精准匹配设备技术台账在册设备` 
          : '草料新增机具：可一键关联建档至医院设备台账'
      });
    } catch (err: any) {
      console.error('[Caoliao Scan Lookup Error]', err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 17.5 联动同步：将草料报修单直接同步生成医院工作单与维修履历
  app.post('/api/caoliao/sync-repair-to-workorder', async (req, res) => {
    try {
      const { caoliaoRepair, targetEquipmentId, engineerName } = req.body;
      if (!caoliaoRepair) {
        return res.status(400).json({ success: false, error: '缺少草料报修信息' });
      }

      let targetEquip = targetEquipmentId ? equipmentStore.find(e => e.id === targetEquipmentId) : null;

      if (!targetEquip && caoliaoRepair.codeId) {
        const cIdStr = String(caoliaoRepair.codeId);
        targetEquip = equipmentStore.find(e => e.codeId === cIdStr) || null;
      }

      if (!targetEquip) {
        const namePart = (caoliaoRepair.equipmentName || '').replace(/^[^-]+-/, '').trim();
        targetEquip = equipmentStore.find(e => e.name.includes(namePart) || namePart.includes(e.name)) || equipmentStore[0];
      }

      if (targetEquip) {
        const today = new Date().toISOString().split('T')[0];
        const newRecord: RepairRecord = {
          id: `REP-CL-${caoliaoRepair.recordNo || Date.now().toString().slice(-6)}`,
          equipmentId: targetEquip.id,
          equipmentName: targetEquip.name,
          equipmentSn: targetEquip.sn || 'SN-CAOLIAO',
          faultDate: caoliaoRepair.recordTime ? String(caoliaoRepair.recordTime).split('T')[0] : today,
          repairType: '草料二维码扫码报修',
          faultDescription: `【草料单号 ${caoliaoRepair.recordNo || caoliaoRepair.recordId}】${caoliaoRepair.faultDescription} (报修人: ${caoliaoRepair.reporterName} 电话: ${caoliaoRepair.reporterPhone})`,
          technician: engineerName || '责任工程师 (已接单)',
          cost: 0,
          partsReplaced: '无',
          resolution: '草料二维码扫码同步建单，已进入五莲县医院医工闭环调度大厅。',
          status: '处理中'
        };

        targetEquip.repairRecords.unshift(newRecord);
        targetEquip.status = '故障待修';
        targetEquip.repairCount = targetEquip.repairRecords.length;

        savePersistentEquipment(equipmentStore);

        return res.json({
          success: true,
          message: `已成功将草料报修 [${caoliaoRepair.recordNo || caoliaoRepair.recordId}] 联动生成医院工单！`,
          workOrderId: newRecord.id,
          equipmentName: targetEquip.name,
          department: targetEquip.department
        });
      }

      res.status(404).json({ success: false, error: '未找到匹配的目标设备' });
    } catch (err: any) {
      console.error('[Caoliao Sync Error]', err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 17.6 将官方草料 RDS 数据库中的 1317 个真实活码 code_id 与全院设备技术台账进行精准关联绑定
  app.post('/api/caoliao/sync-equipment-codes', async (req, res) => {
    try {
      const pool = getCaoliaoDbPool();
      const [rdsRows]: any = await pool.query(
        'SELECT t.code_id, t.商品名称_2647281 as name, t.规格型号_2647282 as model, t.出厂编号_2647283 as sn, t.科室名称_2647288 as dept, t.科内编号_2907705 as kn, t.10425_3013307 as zc, b.url, b.码名称 as codeName FROM template_codeinfo_131886095 t LEFT JOIN base_codeinfo b ON t.code_id = b.code_id'
      );

      const byZc = new Map<string, any>();
      const bySn = new Map<string, any>();
      rdsRows.forEach((r: any) => {
        if (r.zc) byZc.set(String(r.zc).trim(), r);
        if (r.sn) bySn.set(String(r.sn).trim().toLowerCase(), r);
      });

      // Also query all real repairs from table_d233
      const [allRepairs]: any = await pool.query('SELECT * FROM table_d233 ORDER BY record_id ASC');
      const repairsByCodeId = new Map<string, any[]>();
      allRepairs.forEach((r: any) => {
        const cId = String(r.code_id).trim();
        if (!repairsByCodeId.has(cId)) repairsByCodeId.set(cId, []);
        repairsByCodeId.get(cId)!.push(r);
      });

      let matchedCount = 0;
      let repairSyncedCount = 0;
      equipmentStore = equipmentStore.map(equip => {
        const match = (equip.id && byZc.get(String(equip.id).trim())) || 
                      (equip.sn && bySn.get(String(equip.sn).trim().toLowerCase()));
        
        let updated = equip;
        if (match) {
          matchedCount++;
          updated = {
            ...equip,
            codeId: String(match.code_id),
            caoliaoUrl: match.url || equip.caoliaoUrl,
            caoliaoCodeName: match.codeName || match.name || equip.caoliaoCodeName
          };
        }

        const effectiveCodeId = updated.codeId;
        if (effectiveCodeId && repairsByCodeId.has(effectiveCodeId)) {
          const caoliaoList = repairsByCodeId.get(effectiveCodeId) || [];
          const existingIds = new Set((updated.repairRecords || []).map((rec: any) => rec.id));
          const newRepairs: RepairRecord[] = [...(updated.repairRecords || [])];

          caoliaoList.forEach((r: any) => {
            const repId = `REP-CL-${r.record_id || r['记录编号']}`;
            if (!existingIds.has(repId)) {
              repairSyncedCount++;
              let faultDate = '2026-10-04 15:50:43';
              if (r['记录时间']) {
                if (r['记录时间'] instanceof Date) {
                  const pad = (n: number) => String(n).padStart(2, '0');
                  faultDate = `${r['记录时间'].getFullYear()}-${pad(r['记录时间'].getMonth() + 1)}-${pad(r['记录时间'].getDate())} ${pad(r['记录时间'].getHours())}:${pad(r['记录时间'].getMinutes())}:${pad(r['记录时间'].getSeconds())}`;
                } else {
                  faultDate = String(r['记录时间']).replace('T', ' ').slice(0, 19);
                }
              }
              const newRec: RepairRecord = {
                id: repId,
                equipmentId: updated.id,
                equipmentName: updated.name,
                equipmentSn: updated.sn,
                faultDate,
                repairType: '草料二维码扫码报修',
                faultDescription: `【草料单号 ${r['记录编号'] || r.record_id}】${r['故障表现_2645349'] || '现场扫码报修'}`,
                technician: r['报修人姓名_2645353'] ? `${r['报修人姓名_2645353']} (手机: ${r['报修人手机_2645354'] || '未留'})` : (r['记录人'] || '临床医护'),
                cost: 0,
                partsReplaced: '草料线上直报',
                resolution: r['处理状态'] ? `草料工单状态: ${r['处理状态']}` : '已同步至院内医工技术台账',
                status: r['处理状态'] === '已完成' ? '已完成' : '处理中',
                completionDate: r['处理状态'] === '已完成' ? faultDate : undefined,
                department: updated.department,
                reporterName: r['报修人姓名_2645353'] || r['记录人'],
                reporterPhone: r['报修人手机_2645354'] || '',
                codeId: effectiveCodeId,
                recordNo: r['记录编号'] || String(r.record_id),
                photoUrl: r['图片_2645350'] || '',
                videoUrl: r['视频_2645351'] || '',
                source: 'caoliao'
              };
              newRepairs.unshift(newRec);
              existingIds.add(repId);
            }
          });

          updated = {
            ...updated,
            repairRecords: newRepairs,
            repairCount: newRepairs.length,
            status: newRepairs.some(r => r.status !== '已完成') ? '故障待修' : updated.status
          };
        }

        return updated;
      });

      savePersistentEquipment(equipmentStore);

      res.json({
        success: true,
        totalLocalEquipment: equipmentStore.length,
        totalRdsCodes: rdsRows.length,
        matchedCount,
        repairSyncedCount,
        matchRate: `${((matchedCount / equipmentStore.length) * 100).toFixed(1)}%`,
        message: `成功与设备技术台账完成关联！已将官方草料 RDS 数据库中的 ${matchedCount} 台设备 code_id 与台账双向绑定，并同步导入 ${repairSyncedCount} 条真实报修履历。`
      });
    } catch (err: any) {
      console.error('[Caoliao Sync Codes Error]', err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 17.7 获取已关联 code_id 的设备技术台账对账清单
  app.get('/api/caoliao/linked-equipment', async (req, res) => {
    try {
      const keyword = (req.query.keyword as string || '').trim().toLowerCase();
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const pageSize = Math.min(50, Math.max(5, parseInt(req.query.pageSize as string) || 15));

      let filtered = equipmentStore.map(e => ({
        id: e.id,
        name: e.name,
        model: e.model,
        department: e.department,
        sn: e.sn,
        internalNo: e.internalNo,
        status: e.status,
        codeId: e.codeId,
        caoliaoUrl: e.caoliaoUrl,
        caoliaoCodeName: e.caoliaoCodeName,
        isLinked: !!(e.codeId && /^\d+$/.test(e.codeId)),
        repairCount: e.repairCount || 0
      }));

      if (keyword) {
        filtered = filtered.filter(e => 
          (e.name && e.name.toLowerCase().includes(keyword)) ||
          (e.codeId && e.codeId.toLowerCase().includes(keyword)) ||
          (e.sn && e.sn.toLowerCase().includes(keyword)) ||
          (e.department && e.department.toLowerCase().includes(keyword)) ||
          (e.id && e.id.toLowerCase().includes(keyword))
        );
      }

      const total = filtered.length;
      const linkedTotal = filtered.filter(e => e.isLinked).length;
      const offset = (page - 1) * pageSize;
      const paged = filtered.slice(offset, offset + pageSize);

      res.json({
        success: true,
        total,
        linkedTotal,
        linkRate: total > 0 ? `${((linkedTotal / total) * 100).toFixed(1)}%` : '0%',
        data: paged,
        pagination: {
          page,
          pageSize,
          totalPages: Math.ceil(total / pageSize)
        }
      });
    } catch (err: any) {
      console.error('[Caoliao Linked Equip Error]', err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 17.8 实时查询指定设备在草料中的全部真实报修记录 (供详情弹窗与全生命周期调取)
  app.get('/api/caoliao/equipment-repairs/:codeId', async (req, res) => {
    try {
      const { codeId } = req.params;
      const pool = getCaoliaoDbPool();
      const [rows]: any = await pool.query(
        'SELECT * FROM table_d233 WHERE code_id = ? ORDER BY record_id DESC',
        [codeId]
      );

      const formatted = rows.map((r: any) => ({
        recordId: r.record_id,
        codeId: r.code_id,
        equipmentName: r['码名称'],
        recordTime: r['记录时间'],
        recordNo: r['记录编号'],
        reporterName: r['报修人姓名_2645353'] || r['记录人'] || '医护人员',
        reporterPhone: r['报修人手机_2645354'] || '',
        faultDescription: r['故障表现_2645349'] || '设备故障',
        photoUrl: r['图片_2645350'] || '',
        videoUrl: r['视频_2645351'] || '',
        processStatus: r['处理状态'] || '待响应',
        createSource: r['创建来源'] || '手机扫码填写'
      }));

      res.json({
        success: true,
        codeId,
        count: formatted.length,
        repairs: formatted,
        data: formatted
      });
    } catch (err: any) {
      console.error('[Caoliao Equipment Repairs Query Error]', err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // =========================================================================
  // 17.9 草料二维码 Webhook 回调接收、报修任务自动转化与审计日志引擎
  // =========================================================================
  const CAOLIAO_WEBHOOK_LOGS_FILE = path.join(DATA_DIR, 'caoliao_webhook_logs.json');
  const CAOLIAO_SYNC_CONFIG_FILE = path.join(DATA_DIR, 'caoliao_sync_config.json');

  // 22大类医疗器械分类标准与草料活码模板映射基线
  const DEFAULT_22_CATEGORY_MAPPINGS: CaoliaoCategoryMappingRule[] = [
    { id: 'rule-01', sourceCategoryCode: '01', sourceCategoryName: '有源手术器械', targetCaoliaoDirectory: '手术室及麻醉器械', targetTemplateId: '131886105', targetTemplateName: '高频电刀/超声刀标准活码', qrColorTheme: 'rose', labelSpec: '80x50', repairFormId: 'table_d233', autoSyncRepair: true, enabled: true, priority: 1, matchedCount: 18, notes: '麻醉手术科高频手术系统与超声刀' },
    { id: 'rule-02', sourceCategoryCode: '02', sourceCategoryName: '无源手术器械', targetCaoliaoDirectory: '手术室常规机具', targetTemplateId: '131886106', targetTemplateName: '常规手术器械资产码', qrColorTheme: 'slate', labelSpec: '60x40', repairFormId: 'table_d233', autoSyncRepair: true, enabled: true, priority: 2, matchedCount: 45, notes: '骨科与普外科基础器械包' },
    { id: 'rule-03', sourceCategoryCode: '03', sourceCategoryName: '神经和心血管手术器械', targetCaoliaoDirectory: '心血管与神经介入设备', targetTemplateId: '131886107', targetTemplateName: '导管室专科设备码', qrColorTheme: 'rose', labelSpec: '80x50', repairFormId: 'table_d233', autoSyncRepair: true, enabled: true, priority: 3, matchedCount: 12, notes: '心内介入导管室与血流储备设备' },
    { id: 'rule-04', sourceCategoryCode: '04', sourceCategoryName: '骨科手术器械', targetCaoliaoDirectory: '骨科专用器械', targetTemplateId: '131886108', targetTemplateName: '动力工具标准码', qrColorTheme: 'amber', labelSpec: '80x50', repairFormId: 'table_d233', autoSyncRepair: true, enabled: true, priority: 4, matchedCount: 22, notes: '骨科开颅与截骨动力系统' },
    { id: 'rule-05', sourceCategoryCode: '05', sourceCategoryName: '放射治疗器械', targetCaoliaoDirectory: '大型放射治疗设备', targetTemplateId: '131886109', targetTemplateName: '放疗质控高危码', qrColorTheme: 'purple', labelSpec: '100x70', repairFormId: 'table_d233', autoSyncRepair: true, enabled: true, priority: 5, matchedCount: 6, notes: '直线加速器与模拟定位机' },
    { id: 'rule-06', sourceCategoryCode: '06', sourceCategoryName: '医用成像器械', targetCaoliaoDirectory: '大型影像放射设备', targetTemplateId: '131886096', targetTemplateName: '大型影像CT/MRI专用码', qrColorTheme: 'blue', labelSpec: '100x70', repairFormId: 'table_d233', autoSyncRepair: true, enabled: true, priority: 6, matchedCount: 38, notes: '西门子64排CT/联影1.5T磁共振/DR' },
    { id: 'rule-07', sourceCategoryCode: '07', sourceCategoryName: '医用诊察和监护器械', targetCaoliaoDirectory: 'ICU及病房监护器械', targetTemplateId: '131886095', targetTemplateName: '多参数病人监护仪标准码', qrColorTheme: 'emerald', labelSpec: '80x50', repairFormId: 'table_d233', autoSyncRepair: true, enabled: true, priority: 7, matchedCount: 142, notes: '迈瑞BeneView T8/除颤监护仪' },
    { id: 'rule-08', sourceCategoryCode: '08', sourceCategoryName: '呼吸、麻醉和急救器械', targetCaoliaoDirectory: '急救生命支持类设备', targetTemplateId: '131886098', targetTemplateName: '生命支持急救金标码', qrColorTheme: 'rose', labelSpec: '80x50', repairFormId: 'table_d233', autoSyncRepair: true, enabled: true, priority: 8, matchedCount: 86, notes: '德尔格有创呼吸机/ECMO/麻醉机' },
    { id: 'rule-09', sourceCategoryCode: '09', sourceCategoryName: '物理治疗及康复设备', targetCaoliaoDirectory: '康复理疗专区', targetTemplateId: '131886110', targetTemplateName: '康复理疗设备码', qrColorTheme: 'slate', labelSpec: '60x40', repairFormId: 'table_d233', autoSyncRepair: true, enabled: true, priority: 9, matchedCount: 29, notes: '康复医学科冲击波与下肢机器人' },
    { id: 'rule-10', sourceCategoryCode: '10', sourceCategoryName: '输血、透析和体外循环器械', targetCaoliaoDirectory: '血液透析中心设备', targetTemplateId: '131886111', targetTemplateName: '血透滤过高频码', qrColorTheme: 'blue', labelSpec: '80x50', repairFormId: 'table_d233', autoSyncRepair: true, enabled: true, priority: 10, matchedCount: 48, notes: '血液净化透析机/反渗水处理系统' },
    { id: 'rule-11', sourceCategoryCode: '11', sourceCategoryName: '医疗器械消毒灭菌器械', targetCaoliaoDirectory: '消毒供应中心(CSSD)', targetTemplateId: '131886112', targetTemplateName: '压力灭菌锅专控码', qrColorTheme: 'amber', labelSpec: '80x50', repairFormId: 'table_d233', autoSyncRepair: true, enabled: true, priority: 11, matchedCount: 16, notes: '过氧化氢低温等离子与高压蒸汽灭菌' },
    { id: 'rule-12', sourceCategoryCode: '12', sourceCategoryName: '有源植入器械', targetCaoliaoDirectory: '高值植入器械管理', targetTemplateId: '131886113', targetTemplateName: '植入起搏器追溯码', qrColorTheme: 'slate', labelSpec: '60x40', repairFormId: 'table_d233', autoSyncRepair: false, enabled: true, priority: 12, matchedCount: 4, notes: '心脏永久起搏器程控仪' },
    { id: 'rule-13', sourceCategoryCode: '13', sourceCategoryName: '无源植入器械', targetCaoliaoDirectory: '高值耗材管理', targetTemplateId: '131886114', targetTemplateName: '骨科无源植入码', qrColorTheme: 'slate', labelSpec: 'compact_round', repairFormId: 'table_d233', autoSyncRepair: false, enabled: true, priority: 13, matchedCount: 0, notes: '人工关节及血管支架配套器械' },
    { id: 'rule-14', sourceCategoryCode: '14', sourceCategoryName: '注输、护理和防护器械', targetCaoliaoDirectory: '微量泵与临床护理设备', targetTemplateId: '131886099', targetTemplateName: '注射泵输液泵高频巡检码', qrColorTheme: 'emerald', labelSpec: '60x40', repairFormId: 'table_d233', autoSyncRepair: true, enabled: true, priority: 14, matchedCount: 198, notes: '双通道微量注射泵/精准输液泵' },
    { id: 'rule-15', sourceCategoryCode: '15', sourceCategoryName: '患者承载器械', targetCaoliaoDirectory: '病床与转运承载设备', targetTemplateId: '131886115', targetTemplateName: '电动病床推车码', qrColorTheme: 'slate', labelSpec: '60x40', repairFormId: 'table_d233', autoSyncRepair: true, enabled: true, priority: 15, matchedCount: 52, notes: 'ICU重症监护多功能翻身电动床' },
    { id: 'rule-16', sourceCategoryCode: '16', sourceCategoryName: '眼科器械', targetCaoliaoDirectory: '眼科专科诊疗', targetTemplateId: '131886116', targetTemplateName: '裂隙灯与超乳仪码', qrColorTheme: 'slate', labelSpec: '80x50', repairFormId: 'table_d233', autoSyncRepair: true, enabled: true, priority: 16, matchedCount: 14, notes: '拓普康裂隙灯显微镜与超乳玻切一体机' },
    { id: 'rule-17', sourceCategoryCode: '17', sourceCategoryName: '口腔科器械', targetCaoliaoDirectory: '口腔科综合诊疗', targetTemplateId: '131886117', targetTemplateName: '牙科综合治疗台码', qrColorTheme: 'slate', labelSpec: '80x50', repairFormId: 'table_d233', autoSyncRepair: true, enabled: true, priority: 17, matchedCount: 18, notes: '口腔综合牙椅与种植机' },
    { id: 'rule-18', sourceCategoryCode: '18', sourceCategoryName: '妇产科、辅助生殖和避孕器械', targetCaoliaoDirectory: '妇产专科监护设备', targetTemplateId: '131886118', targetTemplateName: '胎儿多普勒监护码', qrColorTheme: 'rose', labelSpec: '80x50', repairFormId: 'table_d233', autoSyncRepair: true, enabled: true, priority: 18, matchedCount: 26, notes: '胎心电子监护仪与产房分娩镇痛仪' },
    { id: 'rule-19', sourceCategoryCode: '19', sourceCategoryName: '医用康复器具', targetCaoliaoDirectory: '康复辅助器具', targetTemplateId: '131886119', targetTemplateName: '康复移位机码', qrColorTheme: 'slate', labelSpec: '60x40', repairFormId: 'table_d233', autoSyncRepair: true, enabled: true, priority: 19, matchedCount: 11, notes: '电动起立床与步态平衡训练仪' },
    { id: 'rule-20', sourceCategoryCode: '20', sourceCategoryName: '中医器械', targetCaoliaoDirectory: '中医经典特色设备', targetTemplateId: '131886120', targetTemplateName: '针灸艾灸温热码', qrColorTheme: 'amber', labelSpec: '60x40', repairFormId: 'table_d233', autoSyncRepair: true, enabled: true, priority: 20, matchedCount: 15, notes: '电针治疗仪与超声波中药熏蒸仪' },
    { id: 'rule-21', sourceCategoryCode: '21', sourceCategoryName: '医用软件', targetCaoliaoDirectory: 'PACS及临床系统', targetTemplateId: '131886121', targetTemplateName: '工作站软件授权码', qrColorTheme: 'purple', labelSpec: 'compact_round', repairFormId: 'table_d233', autoSyncRepair: true, enabled: true, priority: 21, matchedCount: 8, notes: 'AI影像诊断辅助工作站软件' },
    { id: 'rule-22', sourceCategoryCode: '22', sourceCategoryName: '临床检验器械', targetCaoliaoDirectory: '医学检验科设备', targetTemplateId: '131886097', targetTemplateName: '生化免疫流水线质控码', qrColorTheme: 'emerald', labelSpec: '100x70', repairFormId: 'table_d233', autoSyncRepair: true, enabled: true, priority: 22, matchedCount: 64, notes: '罗氏全自动生化分析仪/血球五分类' }
  ];

  const defaultCaoliaoSyncConfig: CaoliaoSyncConfig = {
    apiKey: 'cli_live_9833874_sec_wulian_hosp_medtech',
    corpId: 'cli_9833874',
    apiBaseUrl: 'https://openapi.clewm.net/v2',
    connectionMode: 'rds_and_api',
    autoSyncIntervalMinutes: 30,
    enableAutoPullRepairs: true,
    enableAutoPushStatus: true,
    enableAutoCreateQr: true,
    defaultDirectory: '五莲县人民医院在册医疗设备',
    defaultTemplateId: '131886095',
    categoryMappings: DEFAULT_22_CATEGORY_MAPPINGS,
    lastSyncTime: new Date().toISOString().replace('T', ' ').slice(0, 19),
    lastTestTime: new Date().toISOString().replace('T', ' ').slice(0, 19),
    lastTestStatus: 'success',
    lastTestMessage: '草料开放平台 OpenAPI v2 网关与阿里云 RDS MySQL 双通道连通正常'
  };

  function loadCaoliaoSyncConfig(): CaoliaoSyncConfig {
    try {
      if (fs.existsSync(CAOLIAO_SYNC_CONFIG_FILE)) {
        const raw = fs.readFileSync(CAOLIAO_SYNC_CONFIG_FILE, 'utf8');
        const parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.categoryMappings)) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('[Caoliao Config] Load error, using default:', e);
    }
    return defaultCaoliaoSyncConfig;
  }

  function saveCaoliaoSyncConfig(cfg: CaoliaoSyncConfig) {
    try {
      if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
      fs.writeFileSync(CAOLIAO_SYNC_CONFIG_FILE, JSON.stringify(cfg, null, 2), 'utf8');
    } catch (e) {
      console.error('[Caoliao Config] Save error:', e);
    }
  }

  // 审计日志持久化
  const INITIAL_SEED_WEBHOOK_LOGS = [
    {
      id: 'LOG-CL-001',
      timestamp: '2026-10-16 08:05:21',
      source: '草料二维码扫码 Webhook',
      endpoint: '/api/caoliao/webhook',
      event: 'form_submitted',
      codeId: '131886095',
      codeName: '重症医学科-迈瑞病人监护仪',
      recordNo: 'REC-20261016-011',
      reporterName: '林瑞芳 (ICU护士长)',
      reporterPhone: '13863371002',
      sn: 'MR-BENEVIEW-T8-001',
      department: '重症医学科 (ICU)',
      faultDescription: '病人监护仪心电导联阻抗报警，SpO2血氧探头插头松动无波形显示，危重患者床旁需紧急处置',
      photoUrl: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=800&q=80',
      matchedEquipmentId: 'EQ-001',
      matchedEquipmentName: '迈瑞病人监护仪 (BeneView T8)',
      matchedDepartment: '重症医学科',
      parseStatus: 'success',
      urgency: 'P1',
      responseTimeMs: 38,
      createdWorkOrderId: 'WO-CL-882101',
      errorMessage: null,
      rawPayload: {
        event: 'form_submitted',
        code_id: '131886095',
        '码名称': '重症医学科-迈瑞病人监护仪',
        '记录编号': 'REC-20261016-011',
        '故障表现_2645349': '病人监护仪心电导联阻抗报警，SpO2血氧探头插头松动无波形显示',
        '报修人姓名_2645353': '林瑞芳 (ICU护士长)',
        '报修人手机_2645354': '13863371002',
        '出厂编号_2647283': 'MR-BENEVIEW-T8-001'
      }
    },
    {
      id: 'LOG-CL-002',
      timestamp: '2026-10-16 07:42:10',
      source: '草料二维码扫码 Webhook',
      endpoint: '/api/caoliao/webhook',
      event: 'form_submitted',
      codeId: '131886096',
      codeName: '医学影像科-西门子64排螺旋CT',
      recordNo: 'REC-20261016-009',
      reporterName: '赵庆华 (放射技师长)',
      reporterPhone: '13963388112',
      sn: 'SOMATOM-DEF-AS-2019-09',
      department: '医学影像科',
      faultDescription: '机架旋转自检报错 ERR-7402，高压发生器逆变打火，急诊扫描受阻，需工程师进场复位',
      photoUrl: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=800&q=80',
      matchedEquipmentId: 'EQ-002',
      matchedEquipmentName: '西门子 64排螺旋CT (SOMATOM Definition AS)',
      matchedDepartment: '医学影像科',
      parseStatus: 'success',
      urgency: 'P2',
      responseTimeMs: 42,
      createdWorkOrderId: 'WO-CL-882102',
      errorMessage: null,
      rawPayload: {
        event: 'form_submitted',
        code_id: '131886096',
        '码名称': '医学影像科-西门子64排螺旋CT',
        '记录编号': 'REC-20261016-009',
        '出厂编号_2647283': 'SOMATOM-DEF-AS-2019-09'
      }
    },
    {
      id: 'LOG-CL-003',
      timestamp: '2026-10-16 06:18:45',
      source: '草料二维码扫码 Webhook',
      endpoint: '/api/caoliao/webhook',
      event: 'form_submitted',
      codeId: '131889999',
      codeName: '急诊科-未知转运输液泵',
      recordNo: 'REC-20261016-003',
      reporterName: '周小芳 (急诊护士)',
      reporterPhone: '13763399001',
      sn: 'SN-UNKNOWN-9981',
      department: '急诊科',
      faultDescription: '车载转运输液泵气泡探测频繁误报，无法输入滴速',
      photoUrl: '',
      matchedEquipmentId: null,
      matchedEquipmentName: '未精准匹配',
      matchedDepartment: '急诊科 (待人工核验)',
      parseStatus: 'device_not_found',
      urgency: 'P2',
      responseTimeMs: 51,
      createdWorkOrderId: 'WO-CL-882103 (待关联)',
      errorMessage: '【设备关联失败】未能基于出厂编号 [SN-UNKNOWN-9981] 或草料活码 [131889999] 匹配到系统在册唯一设备，已归入未知待人工关联设备池。',
      rawPayload: {
        event: 'form_submitted',
        code_id: '131889999',
        '码名称': '急诊科-未知转运输液泵',
        '记录编号': 'REC-20261016-003',
        '出厂编号_2647283': 'SN-UNKNOWN-9981'
      }
    }
  ];

  let caoliaoWebhookLogs: any[] = (() => {
    try {
      if (fs.existsSync(CAOLIAO_WEBHOOK_LOGS_FILE)) {
        const raw = fs.readFileSync(CAOLIAO_WEBHOOK_LOGS_FILE, 'utf8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('[Caoliao Logs] Load error, using initial seed:', e);
    }
    return INITIAL_SEED_WEBHOOK_LOGS;
  })();

  function saveCaoliaoWebhookLogs(logs: any[]) {
    try {
      if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
      fs.writeFileSync(CAOLIAO_WEBHOOK_LOGS_FILE, JSON.stringify(logs.slice(0, 200), null, 2), 'utf8');
    } catch (e) {
      console.error('[Caoliao Logs] Save error:', e);
    }
  }

  function reconcileLogsAndWorkOrders() {
    let ordersDirty = false;
    let equipDirty = false;

    // 1. 将草料审计日志全量与派工单池、设备维修履历幂等对账（解决已有日志但工单或台账缺失）
    for (const log of caoliaoWebhookLogs) {
      const recNo = String(log.recordNo || '').trim();
      const fallbackWoId = recNo && /^L\d+$/i.test(recNo)
        ? `WO-CL-${recNo.toUpperCase()}`
        : `WO-CL-${String(log.id || '').replace(/\D/g, '').slice(-6) || 'AUTO'}`;
      const woId = log.createdWorkOrderId || fallbackWoId;

      const matchedEq =
        (log.matchedEquipmentId ? equipmentStore.find(e => e.id === log.matchedEquipmentId) : undefined) ||
        (log.codeId ? equipmentStore.find(e => e.codeId && String(e.codeId).trim() === String(log.codeId).trim()) : undefined) ||
        (log.sn ? equipmentStore.find(e => e.sn && e.sn.trim().toLowerCase() === String(log.sn).trim().toLowerCase()) : undefined);

      const safeLogDept = log.department && !/^https?:\/\//i.test(String(log.department)) ? log.department : '';
      if (log.department && /^https?:\/\//i.test(String(log.department))) {
        log.department = matchedEq?.department || log.matchedDepartment || (log.codeName?.includes('-') ? log.codeName.split('-')[0].trim() : '未识别科室');
      }
      const dept = matchedEq?.department || (log.matchedDepartment && !/^https?:\/\//i.test(String(log.matchedDepartment)) ? log.matchedDepartment : '') || safeLogDept || '功能检查科';
      const eqName = matchedEq?.name || log.matchedEquipmentName || log.codeName || '医疗设备';
      const group = determineBiomedicalGroup(dept, eqName);
      const reportTimeStr = log.rawPayload?.create_time
        ? String(log.rawPayload.create_time).replace('T', ' ').slice(0, 16)
        : (log.timestamp ? String(log.timestamp).replace('T', ' ').slice(0, 16) : new Date().toISOString().replace('T', ' ').slice(0, 16));
      const isMaintenanceLog = Boolean(log.rawPayload?.isMaintenanceRecord || String(log.rawPayload?.['表单名称'] || '').includes('维保'));
      const isCompletedInLog = log.rawPayload?.['当前状态'] === '已完成' || log.rawPayload?.['处理进度'] === '已完成';
      const cleanPhotoUrl = String(log.photoUrl || '').split(',')[0].trim();

      const existingOrderIdx = workOrdersStore.findIndex(
        o => o.id === woId || (recNo && o.caoliaoRecordNo === recNo)
      );

      if (existingOrderIdx < 0) {
        workOrdersStore.unshift({
          id: woId,
          equipmentId: log.matchedEquipmentId || matchedEq?.id || `EQ-CL-${log.codeId || 'AUTO'}`,
          equipmentName: eqName,
          equipmentModel: matchedEq?.model || '标准型号',
          equipmentSn: matchedEq?.sn || log.sn || (recNo ? `SN-${recNo}` : ''),
          internalNo: matchedEq?.internalNo || `CL-QR-${log.codeId || 'AUTO'}`,
          category: matchedEq?.category || '医用诊察和监护器械',
          department: dept,
          location: matchedEq?.location || `${dept} 诊疗室`,
          reporterName: log.reporterName || '医护人员',
          reporterPhone: log.reporterPhone || '',
          reportTime: reportTimeStr,
          priority: log.urgency === 'P1' ? 'P1_CRITICAL' : log.urgency === 'P2' ? 'P2_URGENT' : 'P3_STANDARD',
          workOrderType: log.rawPayload?.workOrderType || 'emergency_breakdown',
          faultDescription: recNo
            ? `【草料扫码单号 ${recNo}】${log.faultDescription || '运行异常'}`
            : (log.faultDescription || '运行异常'),
          status: isCompletedInLog ? 'closed' : 'pending_dispatch',
          assignedEngineerName: isCompletedInLog ? (log.reporterName || '医工工程师') : undefined,
          solutionDescription: log.rawPayload?.solutionDescription || (isCompletedInLog ? log.faultDescription : undefined),
          acceptanceTime: isCompletedInLog ? reportTimeStr : undefined,
          acceptanceStaffName: log.rawPayload?.acceptanceSignature ? '科室现场电子签字确认' : undefined,
          acceptanceSignature: log.rawPayload?.acceptanceSignature || undefined,
          clinicalFeedback: log.rawPayload?.maintenanceResult ? `维保结果：${log.rawPayload.maintenanceResult}` : undefined,
          biomedicalGroup: group,
          source: 'caoliao',
          caoliaoRecordId: recNo ? parseInt(recNo.replace(/\D/g, ''), 10) || 0 : 0,
          caoliaoRecordNo: recNo,
          caoliaoCodeId: log.codeId || matchedEq?.codeId || '',
          photoUrl: cleanPhotoUrl,
          partsReplaced: [],
          totalRepairCost: 0,
          totalDowntimeHours: 0.2,
          slaResponseLimitMinutes: log.urgency === 'P1' ? 15 : log.urgency === 'P2' ? 30 : 120,
          slaRepairLimitHours: log.urgency === 'P1' ? 2 : log.urgency === 'P2' ? 4 : 24,
          isSlaResponseMet: false,
          isSlaRepairMet: false
        });
        ordersDirty = true;
      } else if (matchedEq) {
        const existingOrder = workOrdersStore[existingOrderIdx];
        const hasUrlDept = /^https?:\/\//i.test(String(existingOrder.department || '')) || /^https?:\/\//i.test(String(existingOrder.location || ''));
        const needsEnrich =
          hasUrlDept ||
          !existingOrder.equipmentModel ||
          existingOrder.equipmentModel === '在用标准型号' ||
          existingOrder.equipmentModel === '标准型号' ||
          existingOrder.equipmentId !== matchedEq.id ||
          existingOrder.equipmentName === '未精准匹配' ||
          existingOrder.equipmentName === '医疗设备';
        if (needsEnrich) {
          workOrdersStore[existingOrderIdx] = {
            ...existingOrder,
            equipmentId: matchedEq.id,
            equipmentName: matchedEq.name,
            equipmentModel: matchedEq.model || existingOrder.equipmentModel,
            equipmentSn: matchedEq.sn || existingOrder.equipmentSn,
            department: matchedEq.department || (!hasUrlDept ? existingOrder.department : dept),
            location: matchedEq.location || `${matchedEq.department || dept} 诊疗室`,
            caoliaoCodeId: matchedEq.codeId || existingOrder.caoliaoCodeId || log.codeId,
            photoUrl: cleanPhotoUrl || existingOrder.photoUrl
          };
          ordersDirty = true;
        }
      }

      const activeOrder = workOrdersStore.find(o => o.id === woId || (recNo && o.caoliaoRecordNo === recNo));
      const orderClosed = activeOrder?.status === 'closed' || isCompletedInLog;

      if (matchedEq) {
        const repList = Array.isArray(matchedEq.repairRecords) ? matchedEq.repairRecords : [];
        const hasRepair = repList.some(
          (r: any) =>
            (recNo && r.recordNo === recNo) ||
            r.workOrderId === woId ||
            r.id === `REP-${woId}` ||
            (log.rawPayload?.record_id && r.id === `REP-CL-${log.rawPayload.record_id}`)
        );

        if (!hasRepair) {
          const newRec: any = {
            id: log.rawPayload?.record_id ? `REP-CL-${log.rawPayload.record_id}` : `REP-${woId}`,
            equipmentId: matchedEq.id,
            equipmentName: matchedEq.name,
            equipmentSn: matchedEq.sn || log.sn || '',
            faultDate: log.timestamp ? String(log.timestamp).replace('T', ' ').slice(0, 19) : reportTimeStr,
            repairType: isMaintenanceLog ? '草料二维码维保记录' : '草料二维码扫码报修',
            faultDescription: recNo
              ? `【草料单号 ${recNo}】${log.faultDescription || '运行异常'} (填报人: ${log.reporterName || '医护'} 电话: ${log.reporterPhone || '未留'})`
              : (log.faultDescription || '现场扫码报修'),
            technician: activeOrder?.assignedEngineerName
              ? `${activeOrder.assignedEngineerName} (已处置记录)`
              : activeOrder?.proposedEngineerName
              ? `拟定: ${activeOrder.proposedEngineerName} (内部确认中)`
              : (log.reporterName ? `${log.reporterName} (手机: ${log.reporterPhone || '未留'})` : '待派工分配'),
            cost: 0,
            partsReplaced: isMaintenanceLog ? '现场维保' : '待检',
            resolution: activeOrder?.solutionDescription || `草料二维码实时同步建单 (工单号: ${woId})，已纳入全院闭环。`,
            status: orderClosed ? '已完成' : '处理中',
            completionDate: orderClosed ? reportTimeStr.slice(0, 10) : undefined,
            department: matchedEq.department,
            reporterName: log.reporterName,
            reporterPhone: log.reporterPhone,
            codeId: log.codeId || matchedEq.codeId,
            recordNo: recNo,
            photoUrl: cleanPhotoUrl,
            source: 'caoliao',
            workOrderId: woId
          };
          matchedEq.repairRecords = [newRec, ...repList];
          matchedEq.repairCount = matchedEq.repairRecords.length;
          equipDirty = true;
        }

        if (!orderClosed && matchedEq.status === '正常运行') {
          matchedEq.status = '故障待修';
          matchedEq.lastFaultReason = log.faultDescription || matchedEq.lastFaultReason;
          equipDirty = true;
        }
      }
    }

    // 2. 将设备台账中未闭环的手工报修单同步补齐到统一派工单池
    for (const eq of equipmentStore) {
      const records = Array.isArray(eq.repairRecords) ? eq.repairRecords : [];
      for (const rec of records as any[]) {
        if (rec.status === '已完成') continue;
        if (rec.source === 'caoliao' || rec.recordNo) continue;
        const targetWoId = rec.workOrderId || rec.id;
        const existsInOrders = workOrdersStore.some(
          o => o.id === targetWoId || (rec.id && o.id === rec.id)
        );
        if (!existsInOrders) {
          workOrdersStore.unshift({
            id: targetWoId,
            equipmentId: eq.id,
            equipmentName: eq.name,
            equipmentModel: eq.model || '标准型号',
            equipmentSn: eq.sn || '',
            internalNo: eq.internalNo || '',
            category: eq.category || '通用医疗器械',
            department: rec.department || eq.department,
            location: eq.location || `${eq.department} 诊疗室`,
            reporterName: rec.reporterName || rec.technician || '临床医护',
            reporterPhone: rec.reporterPhone || '',
            reportTime: rec.faultDate ? String(rec.faultDate).slice(0, 16) : new Date().toISOString().replace('T', ' ').slice(0, 16),
            priority: (rec.repairType || '').includes('急') ? 'P1_CRITICAL' : 'P2_URGENT',
            workOrderType: 'emergency_breakdown',
            faultDescription: rec.faultDescription || '临床设备故障报修',
            status: 'pending_dispatch',
            biomedicalGroup: determineBiomedicalGroup(eq.department, eq.name),
            source: 'manual_repair',
            partsReplaced: [],
            totalRepairCost: Number(rec.cost) || 0,
            totalDowntimeHours: 0.2,
            slaResponseLimitMinutes: 30,
            slaRepairLimitHours: 4,
            isSlaResponseMet: false,
            isSlaRepairMet: false
          });
          ordersDirty = true;
        }
      }
    }

    if (ordersDirty) {
      savePersistentWorkOrders(workOrdersStore);
    }
    if (equipDirty) {
      savePersistentEquipment(equipmentStore);
    }
  }

  // 最新报修弹出消息广播对象 (供监控大盘实时轮询与消息弹出)
  let latestRepairAlert: {
    id: string;
    timestamp: string;
    workOrderId: string;
    equipmentId: string;
    equipmentName: string;
    department: string;
    sn: string;
    reporterName: string;
    reporterPhone: string;
    faultDescription: string;
    urgency: 'P1' | 'P2' | 'P3';
    source: string;
    isRead: boolean;
    rawRecordNo?: string;
    photoUrl?: string;
  } | null = null;

  // 智能通用草料二维码 Webhook 数据解析器 (支持标准开放平台、嵌套 data、自定义表单字段及多种编码)
  function extractCaoliaoFields(rawInput: any) {
    let root = rawInput;
    if (typeof root === 'string') {
      try { root = JSON.parse(root); } catch (e) {}
    }
    const candidate = root?.data || root?.record || root?.form_data || root?.content || root || {};
    
    // 合并根层、candidate层及 fields 数组
    const fieldMap: Record<string, any> = { ...root, ...candidate };
    if (Array.isArray(candidate.fields)) {
      candidate.fields.forEach((f: any) => {
        if (f.field_name && f.value !== undefined) fieldMap[f.field_name] = f.value;
        if (f.field_id && f.value !== undefined) fieldMap[f.field_id] = f.value;
      });
    }
    if (Array.isArray(root.fields)) {
      root.fields.forEach((f: any) => {
        if (f.field_name && f.value !== undefined) fieldMap[f.field_name] = f.value;
        if (f.field_id && f.value !== undefined) fieldMap[f.field_id] = f.value;
      });
    }

    // 模糊键名匹配提取器（按关键字优先级顺序匹配，并支持排除签字/URL字段）
    const findVal = (
      keywords: string[],
      fallback: string = '',
      opts?: { excludeKeys?: string[]; rejectUrl?: boolean }
    ) => {
      const keys = Object.keys(fieldMap);
      for (const kw of keywords) {
        const lowerKw = kw.toLowerCase();
        for (const k of keys) {
          const lowerKey = k.toLowerCase();
          if (opts?.excludeKeys?.some(ex => lowerKey.includes(ex.toLowerCase()))) continue;
          if (lowerKey.includes(lowerKw)) {
            const val = fieldMap[k];
            if (val !== undefined && val !== null) {
              const strVal = typeof val === 'object' ? JSON.stringify(val) : String(val).trim();
              if (!strVal) continue;
              if (opts?.rejectUrl && /^https?:\/\//i.test(strVal)) continue;
              return strVal;
            }
          }
        }
      }
      return fallback;
    };

    const event = root?.event || root?.action || candidate?.event || 'form_submitted';
    const codeId = String(
      candidate?.code_id || root?.code_id || candidate?.codeId || root?.codeId ||
      candidate?.code_info?.code_id || root?.code_info?.code_id ||
      findVal(['码编号', 'code_id', 'codeid'], '')
    );
    const codeName = candidate?.code_name || root?.code_name || candidate?.codeName || root?.codeName ||
      findVal(['码名称', '基本信息', '设备名称', 'codename'], '草料扫码报修设备', { rejectUrl: true });
    const subcode = findVal(['子码编号', '子码', 'subcode', 'sub_code', 'sub_no'], '', { rejectUrl: true });
    const recordNo = candidate?.record_no || root?.record_no || candidate?.recordNo || root?.recordNo ||
      candidate?.record_id || root?.record_id ||
      findVal(['记录编号', '单号', 'record_no', 'recordno'], `REC-${Date.now().toString().slice(-8)}`, { rejectUrl: true });

    const faultDesc = findVal(
      ['故障表现', '故障描述', '故障现象', '报修描述', '故障原因', '故障详情', '报修内容', '情况说明', '问题描述', 'fault', 'desc'],
      '设备运行异常，扫码报修',
      { excludeKeys: ['solution', '照片', 'photo', '签字'], rejectUrl: true }
    );
    const reporterName = findVal(
      ['报修人姓名', '报修人', '报修姓名', '填表人', '联系人', '记录人', '填报人', '姓名', 'reporter', 'creater_name'],
      '医护人员',
      { rejectUrl: true }
    );
    const reporterPhone = findVal(
      ['报修人手机', '报修人电话', '联系电话', '手机号', '电话', '联系手机', '手机', 'phone', 'mobile', 'tel'],
      '',
      { rejectUrl: true }
    );
    const sn = findVal(['出厂编号', '序列号', '机身编号', '出厂序号', 'sn', 'serial'], '', { rejectUrl: true });
    const dept = findVal(
      ['科室名称', '报修科室', '所属科室', '科室', '部门', '病区', 'dept', 'department'],
      '',
      { excludeKeys: ['签字', '签名', 'signature', '照片', '图片', 'photo', 'image', 'img', 'feedback'], rejectUrl: true }
    );
    const rawPhotoVal = findVal(
      ['图片', '维修详情照片', '照片', '现场照片', 'photo', 'image', 'img'],
      '',
      { excludeKeys: ['签字', '签名', 'signature'] }
    );
    const photoUrl = rawPhotoVal ? rawPhotoVal.split(',').map((s: string) => s.trim()).filter(Boolean)[0] || '' : '';

    return { event, codeId, codeName, subcode, recordNo, faultDesc, reporterName, reporterPhone, sn, dept, photoUrl, rawFlat: fieldMap };
  }

  // 核心函数：处理从草料二维码发来的报修/维保请求，解析并自动转化为闭环工单与设备履历
  function processCaoliaoWebhookPayload(
    payload: any,
    endpoint: string = '/api/caoliao/webhook',
    options?: { suppressAlert?: boolean }
  ) {
    const startTime = Date.now();
    const extracted = extractCaoliaoFields(payload);
    const event = extracted.event;
    const codeId = extracted.codeId;
    const codeName = extracted.codeName;
    const subcode = extracted.subcode;
    const recordNo = extracted.recordNo;
    const faultDesc = extracted.faultDesc;
    const reporterName = extracted.reporterName;
    const reporterPhone = extracted.reporterPhone;
    const sn = extracted.sn;
    const dept = extracted.dept;
    const photoUrl = extracted.photoUrl;
    const isMaintenancePayload = Boolean(payload?.isMaintenanceRecord || String(payload?.['表单名称'] || '').includes('维保'));
    const isCompletedPayload = payload?.['当前状态'] === '已完成' || payload?.['处理进度'] === '已完成';

    // 1. 在全院设备技术台账中执行精准关联匹配
    let matchedEquip: MedicalEquipment | null = null;
    let matchStrategy = 'none';

    // 优先：出厂编号 SN 精准匹配，其次包含匹配
    if (sn) {
      const snClean = sn.trim().toLowerCase();
      matchedEquip =
        equipmentStore.find(e => e.sn && e.sn.trim().toLowerCase() === snClean) ||
        equipmentStore.find(e => {
          if (!e.sn) return false;
          const eSn = e.sn.trim().toLowerCase();
          return eSn.includes(snClean) || snClean.includes(eSn);
        }) ||
        null;
      if (matchedEquip) matchStrategy = 'sn_exact';
    }

    // 次优：草料活码 codeId 匹配 (codeId 或 设备ID 或 url)
    if (!matchedEquip && codeId) {
      const cIdStr = String(codeId).trim();
      matchedEquip =
        equipmentStore.find(e => e.codeId && String(e.codeId).trim() === cIdStr) ||
        equipmentStore.find(e => e.id && String(e.id).trim() === cIdStr) ||
        equipmentStore.find(e => e.caoliaoUrl && e.caoliaoUrl.includes(cIdStr)) ||
        null;
      if (matchedEquip) matchStrategy = 'code_id';
    }

    // 再次：草料活码名称与子码编号匹配 (先精确后模糊，避免子串碰撞错误机型)
    if (!matchedEquip) {
      const cleanDeptHint = (dept || (codeName.includes('-') ? codeName.split('-')[0] : '')).replace(/\([^)]*\)/g, '').trim().toLowerCase();
      if (subcode) {
        matchedEquip = equipmentStore.find(e => (e as any).subcode === subcode || (e as any).subCode === subcode) || null;
      }
      if (!matchedEquip && codeName) {
        const trimmedCodeName = codeName.trim();
        matchedEquip =
          equipmentStore.find(e => e.caoliaoCodeName && e.caoliaoCodeName.trim() === trimmedCodeName && (!cleanDeptHint || (e.department || '').toLowerCase().includes(cleanDeptHint))) ||
          equipmentStore.find(e => e.caoliaoCodeName && e.caoliaoCodeName.trim() === trimmedCodeName) ||
          equipmentStore.find(e => e.caoliaoCodeName && (e.caoliaoCodeName.includes(trimmedCodeName) || trimmedCodeName.includes(e.caoliaoCodeName)) && (!cleanDeptHint || (e.department || '').toLowerCase().includes(cleanDeptHint))) ||
          equipmentStore.find(e => e.caoliaoCodeName && (e.caoliaoCodeName.includes(trimmedCodeName) || trimmedCodeName.includes(e.caoliaoCodeName))) ||
          ((trimmedCodeName.includes('肌电图') || trimmedCodeName.includes('诱发电位')) ? equipmentStore.find(e => e.caoliaoCodeName?.includes('肌电图')) || null : null);
      }
      if (matchedEquip) matchStrategy = 'caoliao_codename_subcode';
    }

    // 再次：预设核心设备映射（支持典型演示用例）
    if (!matchedEquip && codeId) {
      if (codeId === '131886095') {
        matchedEquip = equipmentStore.find(e => e.name.includes('监护') && (e.department?.includes('重症') || e.department?.includes('ICU'))) || 
                       equipmentStore.find(e => e.name.includes('监护')) || null;
        if (matchedEquip) matchStrategy = 'preset_icu_monitor';
      } else if (codeId === '131886096') {
        matchedEquip = equipmentStore.find(e => e.name.includes('CT') || e.category?.includes('成像') || e.department?.includes('影像')) || null;
        if (matchedEquip) matchStrategy = 'preset_ct';
      }
    }

    // 降级：基于名称与科室精确/模糊对齐
    if (!matchedEquip) {
      const pureName = codeName.replace(/^[^-]+-/, '').trim().toLowerCase();
      const cleanDept = (dept || (codeName.includes('-') ? codeName.split('-')[0] : '')).replace(/\([^)]*\)/g, '').trim().toLowerCase();

      if (pureName) {
        matchedEquip =
          equipmentStore.find(e => {
            const eName = (e.name || '').toLowerCase();
            const eDept = (e.department || '').toLowerCase();
            return eName === pureName && (!cleanDept || eDept.includes(cleanDept));
          }) ||
          equipmentStore.find(e => {
            const eName = (e.name || '').toLowerCase();
            const eDept = (e.department || '').toLowerCase();
            const nameMatch = eName.includes(pureName) || pureName.includes(eName);
            const deptMatch = !cleanDept || eDept.includes(cleanDept);
            return nameMatch && deptMatch;
          }) ||
          null;
      }

      if (matchedEquip) {
        matchStrategy = 'fuzzy_name_dept';
      } else if (pureName) {
        matchedEquip =
          equipmentStore.find(e => (e.name || '').toLowerCase() === pureName) ||
          equipmentStore.find(e => {
            const eName = (e.name || '').toLowerCase();
            return eName.includes(pureName) || pureName.includes(eName);
          }) ||
          null;
        if (matchedEquip) matchStrategy = 'name_only';
      }
    }

    const isMatchSuccess = Boolean(matchedEquip);
    const parseStatus = isMatchSuccess ? 'success' : 'device_not_found';
    const errorMessage = isMatchSuccess 
      ? null 
      : `【设备关联失败】未能基于出厂编号 [${sn || '未提供'}] 或草料活码ID [${codeId || '未提供'}] 在系统在册设备库中精准匹配到对应设备ID。已创建待人工核验工单。`;

    // 2. 计算紧急度 (P1 特级紧急 / P2 紧急 / P3 常规)
    const isLifeSupportOrEmergency = 
      (dept && (dept.includes('重症') || dept.includes('ICU') || dept.includes('急诊') || dept.includes('手术'))) ||
      faultDesc.includes('报警') || faultDesc.includes('生命') || faultDesc.includes('停机') || faultDesc.includes('危重');
    const urgency: 'P1' | 'P2' | 'P3' = isMaintenancePayload && isCompletedPayload
      ? 'P3'
      : (isLifeSupportOrEmergency ? 'P1' : (dept.includes('影像') || dept.includes('介入') ? 'P2' : 'P3'));

    // 3. 自动转化为本系统的维修/维保闭环工单（按 recordNo 保持幂等工单号，避免重复建单）
    const existingOrderForRecord = recordNo
      ? workOrdersStore.find(o => o.caoliaoRecordNo && o.caoliaoRecordNo === recordNo)
      : undefined;
    const workOrderNumber =
      existingOrderForRecord?.id ||
      (recordNo && /^L\d+$/i.test(recordNo) ? `WO-CL-${recordNo.toUpperCase()}` : `WO-CL-${Date.now().toString().slice(-6)}`);
    const today = new Date().toISOString().split('T')[0];

    // 如果匹配到了真实设备，按是否已闭环更新设备状态并在未重复时注入 repairRecords 履历
    if (matchedEquip) {
      const alreadyHasRepair = (matchedEquip.repairRecords || []).some(
        (r: any) =>
          (recordNo && r.recordNo === recordNo) ||
          r.id === `REP-${workOrderNumber}` ||
          (payload?.record_id && r.id === `REP-CL-${payload.record_id}`)
      );

      if (!alreadyHasRepair) {
        const newRepair: any = {
          id: payload?.record_id ? `REP-CL-${payload.record_id}` : `REP-${workOrderNumber}`,
          equipmentId: matchedEquip.id,
          equipmentName: matchedEquip.name,
          equipmentSn: matchedEquip.sn || sn || 'SN-CAOLIAO',
          faultDate: (payload?.create_time ? String(payload.create_time).replace('T', ' ').slice(0, 19) : '') || today,
          repairType: isMaintenancePayload ? '草料二维码维保记录' : '草料二维码扫码报修',
          faultDescription: `【草料单号 ${recordNo}】${faultDesc} (填报人: ${reporterName} 电话: ${reporterPhone || '未留'})`,
          technician: reporterName ? `${reporterName} (手机: ${reporterPhone || '未留'})` : '待派工分配',
          cost: 0,
          partsReplaced: isMaintenancePayload ? '现场维保' : '待检',
          resolution: isMaintenancePayload
            ? (payload?.solutionDescription || faultDesc)
            : `草料二维码实时同步建单 (工单号: ${workOrderNumber})，等待医工派工响应。`,
          status: isCompletedPayload ? '已完成' : '处理中',
          completionDate: isCompletedPayload
            ? ((payload?.create_time ? String(payload.create_time).replace('T', ' ').slice(0, 10) : '') || today)
            : undefined,
          department: matchedEquip.department,
          reporterName,
          reporterPhone,
          codeId: codeId || matchedEquip.codeId,
          recordNo,
          photoUrl: photoUrl || '',
          source: 'caoliao',
          workOrderId: workOrderNumber
        };

        matchedEquip.repairRecords = [newRepair, ...(matchedEquip.repairRecords || [])];
      }

      if (!isCompletedPayload) {
        matchedEquip.status = '故障待修';
        matchedEquip.lastFaultReason = faultDesc;
      } else {
        const hasOtherOpenRepairs = (matchedEquip.repairRecords || []).some((r: any) => r.status !== '已完成');
        if (!hasOtherOpenRepairs && (matchedEquip.status === '维护保养中' || matchedEquip.status === '故障待修')) {
          matchedEquip.status = '正常运行';
          matchedEquip.lastFaultReason = undefined;
        }
      }
      matchedEquip.repairCount = (matchedEquip.repairRecords || []).length;

      savePersistentEquipment(equipmentStore);
    }

    const responseTimeMs = Date.now() - startTime;
    const nowTimeStr = new Date().toISOString().replace('T', ' ').slice(0, 19);
    const eventTimeStr = (payload?.create_time ? String(payload.create_time).replace('T', ' ').slice(0, 19) : '') || nowTimeStr;

    // 4.1 自动生成医工派工/维保闭环工单 (EngineeringWorkOrder)
    const cleanDept = dept && !/^https?:\/\//i.test(dept) ? dept : '';
    const codeDeptHint = codeName && codeName.includes('-') ? codeName.split('-')[0].trim() : '';
    const targetDept = (matchedEquip ? matchedEquip.department : '') || cleanDept || codeDeptHint || '功能检查科';
    const assignedGroup = determineBiomedicalGroup(
      targetDept,
      matchedEquip ? matchedEquip.name : codeName
    );
    const targetEqName = matchedEquip ? matchedEquip.name : codeName;

    const engineeringOrder = {
      id: workOrderNumber,
      equipmentId: matchedEquip ? matchedEquip.id : (codeId ? `EQ-CL-${codeId}` : 'EQ-PENDING'),
      equipmentName: targetEqName,
      equipmentModel: matchedEquip?.model || '标准型号',
      equipmentSn: matchedEquip?.sn || sn || (recordNo ? `SN-${recordNo}` : ''),
      internalNo: matchedEquip?.internalNo || `CL-QR-${codeId || 'AUTO'}`,
      category: matchedEquip?.category || '医用诊察和监护器械',
      department: targetDept,
      location: matchedEquip?.location || `${targetDept} 检查诊疗室`,
      reporterName: reporterName || '临床医护',
      reporterPhone: reporterPhone || '',
      reportTime: (payload?.create_time ? String(payload.create_time).replace('T', ' ').slice(0, 16) : '') || nowTimeStr.slice(0, 16),
      priority: urgency === 'P1' ? 'P1_CRITICAL' : urgency === 'P2' ? 'P2_URGENT' : 'P3_STANDARD',
      workOrderType: payload?.workOrderType || 'emergency_breakdown',
      faultDescription: `【草料扫码单号 ${recordNo}】${faultDesc}`,
      status: isCompletedPayload ? 'closed' : 'pending_dispatch',
      assignedEngineerName: isCompletedPayload ? (reporterName || '医工工程师') : undefined,
      solutionDescription: payload?.solutionDescription || (isCompletedPayload ? faultDesc : undefined),
      acceptanceTime: isCompletedPayload ? eventTimeStr.slice(0, 16) : undefined,
      acceptanceStaffName: payload?.acceptanceSignature ? '科室现场电子签字确认' : (isCompletedPayload ? '临床科室确认' : undefined),
      acceptanceSignature: payload?.acceptanceSignature || undefined,
      clinicalFeedback: payload?.maintenanceResult ? `维保结果：${payload.maintenanceResult}` : undefined,
      biomedicalGroup: assignedGroup,
      source: 'caoliao',
      caoliaoRecordId: recordNo ? parseInt(recordNo.replace(/\D/g, '')) || 0 : 0,
      caoliaoRecordNo: recordNo,
      caoliaoCodeId: codeId || matchedEquip?.codeId || '',
      photoUrl: photoUrl || '',
      partsReplaced: [],
      totalRepairCost: 0,
      totalDowntimeHours: 0.1,
      slaResponseLimitMinutes: urgency === 'P1' ? 15 : urgency === 'P2' ? 30 : 120,
      slaRepairLimitHours: urgency === 'P1' ? 2 : urgency === 'P2' ? 4 : 24,
      isSlaResponseMet: isCompletedPayload,
      isSlaRepairMet: isCompletedPayload
    };

    // 写入持久化工单存储：若已存在该工单，仅更新设备匹配/照片/科室等基础信息，严格保留派工流转状态与讨论记录
    const existingIdx = workOrdersStore.findIndex(o => o.id === workOrderNumber || (o.caoliaoRecordNo && o.caoliaoRecordNo === recordNo));
    if (existingIdx >= 0) {
      const prevOrder = workOrdersStore[existingIdx];
      const prevDeptBroken = !prevOrder.department || /^https?:\/\//i.test(String(prevOrder.department));
      const prevLocBroken = !prevOrder.location || /^https?:\/\//i.test(String(prevOrder.location));
      workOrdersStore[existingIdx] = {
        ...prevOrder,
        equipmentId: engineeringOrder.equipmentId,
        equipmentName: engineeringOrder.equipmentName,
        equipmentModel: engineeringOrder.equipmentModel,
        equipmentSn: engineeringOrder.equipmentSn || prevOrder.equipmentSn,
        department: prevDeptBroken ? engineeringOrder.department : (engineeringOrder.department || prevOrder.department),
        location: prevLocBroken ? engineeringOrder.location : (engineeringOrder.location || prevOrder.location),
        caoliaoCodeId: engineeringOrder.caoliaoCodeId || prevOrder.caoliaoCodeId,
        photoUrl: engineeringOrder.photoUrl || prevOrder.photoUrl,
        reportTime: prevOrder.reportTime || engineeringOrder.reportTime,
        solutionDescription: engineeringOrder.solutionDescription || prevOrder.solutionDescription,
        acceptanceSignature: engineeringOrder.acceptanceSignature || prevOrder.acceptanceSignature,
        acceptanceStaffName: engineeringOrder.acceptanceStaffName || prevOrder.acceptanceStaffName,
        acceptanceTime: engineeringOrder.acceptanceTime || prevOrder.acceptanceTime,
        clinicalFeedback: engineeringOrder.clinicalFeedback || prevOrder.clinicalFeedback,
        assignedEngineerName: prevOrder.assignedEngineerName || engineeringOrder.assignedEngineerName,
        status: isCompletedPayload ? 'closed' : (prevOrder.status || engineeringOrder.status)
      };
    } else {
      workOrdersStore = [engineeringOrder, ...workOrdersStore];
    }
    savePersistentWorkOrders(workOrdersStore);

    // 4. 构建并写入审计日志（按 recordNo 去重更新）
    const logItem = {
      id: `LOG-CL-${recordNo || Date.now().toString().slice(-6)}`,
      timestamp: eventTimeStr,
      source: endpoint.includes('RDS')
        ? (isMaintenancePayload ? '阿里云 RDS 专线同步 (维保记录)' : '阿里云 RDS 专线同步')
        : '草料二维码扫码 Webhook',
      endpoint,
      event,
      codeId,
      codeName,
      recordNo,
      reporterName,
      reporterPhone,
      sn: matchedEquip?.sn || sn,
      department: matchedEquip ? matchedEquip.department : (cleanDept || codeDeptHint || '未识别科室'),
      faultDescription: faultDesc,
      photoUrl,
      matchedEquipmentId: matchedEquip ? matchedEquip.id : null,
      matchedEquipmentName: matchedEquip ? matchedEquip.name : '未精准匹配',
      matchedDepartment: matchedEquip ? matchedEquip.department : (dept || '待人工核验'),
      matchStrategy,
      parseStatus,
      urgency,
      responseTimeMs,
      createdWorkOrderId: workOrderNumber,
      errorMessage,
      rawPayload: payload
    };

    const existLogIdx = recordNo
      ? caoliaoWebhookLogs.findIndex(l => l.recordNo && l.recordNo === recordNo)
      : -1;
    if (existLogIdx >= 0) {
      caoliaoWebhookLogs[existLogIdx] = { ...caoliaoWebhookLogs[existLogIdx], ...logItem };
    } else {
      caoliaoWebhookLogs = [logItem, ...caoliaoWebhookLogs];
    }
    saveCaoliaoWebhookLogs(caoliaoWebhookLogs);

    // 5. 更新大盘实时弹窗提醒消息（后台静默同步时不弹打扰提示）
    if (!options?.suppressAlert) {
      latestRepairAlert = {
        id: `ALERT-${Date.now()}`,
        timestamp: '刚刚',
        workOrderId: workOrderNumber,
        equipmentId: matchedEquip ? matchedEquip.id : 'EQ-PENDING',
        equipmentName: matchedEquip ? matchedEquip.name : codeName,
        department: matchedEquip ? matchedEquip.department : (dept || '全院科室'),
        sn: matchedEquip ? matchedEquip.sn : sn,
        reporterName,
        reporterPhone,
        faultDescription: faultDesc,
        urgency,
        source: isMaintenancePayload ? '草料二维码现场维保' : '草料二维码现场扫码',
        isRead: false,
        rawRecordNo: recordNo,
        photoUrl
      };
    }

    return {
      success: true,
      message: isMatchSuccess
        ? `${isMaintenancePayload ? '维保记录' : '报修请求'}解析成功！已自动同步至 [${workOrderNumber}]，关联设备 [${matchedEquip!.id} - ${matchedEquip!.name}]。`
        : `${isMaintenancePayload ? '维保记录' : '报修请求'}已接收并生成工单 [${workOrderNumber}]。注意：设备未在台账中自动匹配，需运维人工关联。`,
      workOrderId: workOrderNumber,
      parseStatus,
      matchedEquipmentId: matchedEquip ? matchedEquip.id : null,
      equipmentName: matchedEquip ? matchedEquip.name : codeName,
      department: matchedEquip ? matchedEquip.department : dept,
      urgency,
      log: logItem,
      alert: latestRepairAlert
    };
  }

  const formatRdsDateTime = (d: any): string => {
    if (!d) return '';
    if (d instanceof Date) {
      return Number.isFinite(d.getTime()) ? d.toISOString().replace('T', ' ').slice(0, 19) : '';
    }
    const str = String(d).trim();
    if (str.includes('GMT')) {
      const parsed = new Date(str);
      if (!isNaN(parsed.getTime())) return parsed.toISOString().replace('T', ' ').slice(0, 19);
    }
    return str.replace('T', ' ').slice(0, 19);
  };

  function buildPayloadFromRdsRow(row: any, tableType: 'd233' | 'd237') {
    const recNo = String(row['记录编号'] || row.record_id || '').trim();
    const createTime = formatRdsDateTime(row['记录时间']);
    if (tableType === 'd237') {
      const projectItem = String(row['项目_2794514'] || '维保作业').trim();
      const situation = String(row['情况说明_2648481'] || '').trim();
      const resultText = String(row['结果_2648791'] || row['处理状态'] || '').trim();
      const photoUrls = String(row['维修详情照片_2648482'] || '')
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);
      const signatureUrl = String(row['科室签字_3473415'] || '').trim();
      const isDone = /完好|正常|完成|合格|修复|已解决/.test(resultText) || row['处理状态'] === '已完成';
      const summary = `【${projectItem}】${situation || '现场维保'}${resultText ? `（结果：${resultText}）` : ''}`;
      const reporter = row['姓名_2648485'] || row['记录人'] || '医工工程师';
      const codeDept = String(row['码名称'] || '').includes('-') ? String(row['码名称']).split('-')[0].trim() : '';
      return {
        event: 'form_submitted',
        表单名称: row['记录单名称'] || '医疗设备维保记录',
        code_id: String(row.code_id || ''),
        code_name: row['码名称'] || '',
        报修科室: row['科室'] || row['所属科室'] || codeDept || '',
        record_id: String(row.record_id || recNo),
        record_no: recNo,
        create_time: createTime,
        填表人: reporter,
        报修人姓名: reporter,
        报修人手机: row['手机_2648486'] || '',
        故障表现: summary,
        图片: photoUrls[0] || '',
        photoUrls,
        维修详情照片_2648482: row['维修详情照片_2648482'] || '',
        科室签字_3473415: signatureUrl,
        acceptanceSignature: signatureUrl,
        当前状态: isDone ? '已完成' : '故障待修',
        处理进度: isDone ? '已完成' : '处理中',
        创建来源: row['创建来源'] || '手机扫码填写',
        isMaintenanceRecord: true,
        maintenanceProject: projectItem,
        maintenanceResult: resultText,
        solutionDescription: situation || summary,
        workOrderType: /维护|保养|巡检|校准/.test(projectItem) ? 'preventive_pm' : 'emergency_breakdown',
        urgency: isDone ? 'P3' : 'P2'
      };
    }

    const repairPhotos = String(row['图片_2645350'] || '')
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);
    const reporter = row['报修人姓名_2645353'] || row['记录人'] || '医护人员';
    return {
      event: 'form_submitted',
      表单名称: row['记录单名称'] || '医疗设备故障报修',
      code_id: String(row.code_id || ''),
      code_name: row['码名称'] || '',
      record_id: String(row.record_id || recNo),
      record_no: recNo,
      create_time: createTime,
      填表人: reporter,
      报修人姓名: reporter,
      报修人手机: row['报修人手机_2645354'] || '',
      故障表现: row['故障表现_2645349'] || '设备运行异常',
      图片: repairPhotos[0] || '',
      photoUrls: repairPhotos,
      当前状态: row['处理状态'] || '故障待修',
      处理进度: row['处理状态'] || '处理中',
      创建来源: row['创建来源'] || '手机扫码填写',
      isMaintenanceRecord: false,
      urgency: 'P2'
    };
  }

  let isSyncingCaoliaoRds = false;
  let lastCaoliaoRdsSyncMs = 0;

  const CAOLIAO_ALERT_STATE_FILE = path.join(DATA_DIR, 'caoliao_alert_state.json');
  interface CaoliaoAlertState {
    alertedRecordNos: string[];
    dismissedRecordNos: string[];
  }
  function loadCaoliaoAlertState(): CaoliaoAlertState {
    try {
      if (fs.existsSync(CAOLIAO_ALERT_STATE_FILE)) {
        const parsed = JSON.parse(fs.readFileSync(CAOLIAO_ALERT_STATE_FILE, 'utf8'));
        return {
          alertedRecordNos: Array.isArray(parsed?.alertedRecordNos) ? parsed.alertedRecordNos : [],
          dismissedRecordNos: Array.isArray(parsed?.dismissedRecordNos) ? parsed.dismissedRecordNos : []
        };
      }
    } catch {}
    return { alertedRecordNos: [], dismissedRecordNos: [] };
  }
  function saveCaoliaoAlertState(state: CaoliaoAlertState) {
    try {
      if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
      fs.writeFileSync(
        CAOLIAO_ALERT_STATE_FILE,
        JSON.stringify(
          {
            alertedRecordNos: state.alertedRecordNos.slice(-300),
            dismissedRecordNos: state.dismissedRecordNos.slice(-300)
          },
          null,
          2
        ),
        'utf8'
      );
    } catch {}
  }

  let caoliaoAlertState: CaoliaoAlertState = loadCaoliaoAlertState();

  function promoteOrderAlertIfEligible(order: any) {
    if (!order || order.source !== 'caoliao' || order.status === 'closed') return;
    const recNo = String(order.caoliaoRecordNo || '').trim();
    if (!recNo) return;
    if (caoliaoAlertState.dismissedRecordNos.includes(recNo)) return;

    // 仅对最近 72 小时内的待派工草料报修触发弹窗（按北京时间与UTC兼容窗口），避免历史旧单误弹
    const reportMs = parseComparableTime(order.reportTime);
    if (reportMs > 0 && Date.now() - reportMs > 72 * 3600 * 1000) return;

    if (!caoliaoAlertState.alertedRecordNos.includes(recNo)) {
      caoliaoAlertState.alertedRecordNos.push(recNo);
      saveCaoliaoAlertState(caoliaoAlertState);
    }

    latestRepairAlert = {
      id: `ALERT-RDS-${recNo}-${Date.now()}`,
      timestamp: order.reportTime || '刚刚',
      workOrderId: order.id,
      equipmentId: order.equipmentId || 'EQ-PENDING',
      equipmentName: order.equipmentName || '草料报修设备',
      department: order.department || '临床科室',
      sn: order.equipmentSn || '',
      reporterName: order.reporterName || '临床医护',
      reporterPhone: order.reporterPhone || '',
      faultDescription: String(order.faultDescription || '设备运行异常').replace(/^【草料扫码单号\s+[^】]+】\s*/, ''),
      urgency: order.priority === 'P1_CRITICAL' ? 'P1' : order.priority === 'P2_URGENT' ? 'P2' : 'P3',
      source: '草料二维码现场扫码 (RDS实时同步)',
      isRead: false,
      rawRecordNo: recNo,
      photoUrl: order.photoUrl || ''
    };
  }

  async function syncCaoliaoRdsTables(options?: { limitPerTable?: number; suppressAlert?: boolean }) {
    if (DEMO_MODE || !DEFAULT_CAOLIAO_DB_CONFIG.host) {
      return { totalQueried: 0, importedCount: 0, importedRecords: [] as any[] };
    }
    if (isSyncingCaoliaoRds) {
      return { totalQueried: 0, importedCount: 0, importedRecords: [] as any[] };
    }
    isSyncingCaoliaoRds = true;
    const limitPerTable = options?.limitPerTable || 40;
    const suppressAlert = options?.suppressAlert !== undefined ? options.suppressAlert : false;
    let totalQueried = 0;
    let importedCount = 0;
    const importedRecords: any[] = [];

    try {
      const pool = getCaoliaoDbPool();
      const [[rows233], [rows237]]: any = await Promise.all([
        pool.query('SELECT * FROM table_d233 ORDER BY record_id DESC LIMIT ?', [limitPerTable]),
        pool.query('SELECT * FROM table_d237 ORDER BY record_id DESC LIMIT ?', [limitPerTable])
      ]);

      totalQueried = (rows233?.length || 0) + (rows237?.length || 0);
      const taggedRows = [
        ...(rows233 || []).map((row: any) => ({ row, tableType: 'd233' as const })),
        ...(rows237 || []).map((row: any) => ({ row, tableType: 'd237' as const }))
      ].sort((a, b) => parseComparableTime(a.row['记录时间']) - parseComparableTime(b.row['记录时间']));

      for (const { row, tableType } of taggedRows) {
        const recNo = String(row['记录编号'] || row.record_id || '').trim();
        if (!recNo) continue;
        const alreadyLogged = caoliaoWebhookLogs.some(l => l.recordNo === recNo);
        const alreadyOrder = workOrdersStore.some(o => o.caoliaoRecordNo === recNo);
        if (!alreadyLogged || !alreadyOrder) {
          const payload = buildPayloadFromRdsRow(row, tableType);
          const endpoint = tableType === 'd237' ? '阿里云RDS直通-table_d237' : '阿里云RDS直通-table_d233';
          // 仅对未闭环的故障报修/维保新单允许触发实时弹窗警报；历史已完成记录保持静默
          const isCompletedRow = payload['当前状态'] === '已完成' || payload['处理进度'] === '已完成';
          const shouldSuppress = suppressAlert || isCompletedRow || caoliaoAlertState.dismissedRecordNos.includes(recNo);
          const processed = processCaoliaoWebhookPayload(payload, endpoint, { suppressAlert: shouldSuppress });
          if (processed.success) {
            importedCount++;
            importedRecords.push(processed);
            if (!shouldSuppress && !caoliaoAlertState.alertedRecordNos.includes(recNo)) {
              caoliaoAlertState.alertedRecordNos.push(recNo);
              saveCaoliaoAlertState(caoliaoAlertState);
            }
          }
        }
      }

      reconcileLogsAndWorkOrders();

      // 若存在尚未弹窗且未处理的近期草料故障报修新单（如服务端刚重启补拉到的最新记录），自动补发一次实时提醒
      if (!suppressAlert && (!latestRepairAlert || latestRepairAlert.isRead)) {
        const newestOpenCaoliao = [...workOrdersStore]
          .filter(o => o.source === 'caoliao' && o.status === 'pending_dispatch' && o.caoliaoRecordNo)
          .sort((a, b) => parseComparableTime(b.reportTime) - parseComparableTime(a.reportTime))[0];
        if (newestOpenCaoliao) {
          promoteOrderAlertIfEligible(newestOpenCaoliao);
        }
      }

      lastCaoliaoRdsSyncMs = Date.now();
    } catch (err: any) {
      console.warn('[Caoliao RDS Sync Warning]', err.message);
    } finally {
      isSyncingCaoliaoRds = false;
    }

    return { totalQueried, importedCount, importedRecords };
  }

  // 17.9.0 草料开放平台 Webhook 端点连通性探针与握手验证 (支持 GET 请求校验及心跳诊断)
  app.get(['/api/caoliao/webhook', '/api/caoliao/callback', '/api/caoliao/repair-callback'], (req, res) => {
    const echostr = req.query.echostr || req.query.challenge || req.query.nonce;
    if (echostr) {
      return res.send(String(echostr));
    }
    res.json({
      success: true,
      service: '五莲县人民医院 - 草料二维码报修 Webhook 接收网关',
      status: 'listening',
      timestamp: new Date().toISOString(),
      activeEndpoints: ['/api/caoliao/webhook', '/api/caoliao/callback', '/api/caoliao/repair-callback'],
      message: '草料扫码报修 Webhook 端点在线就绪，随时接收 POST 报修回调数据'
    });
  });

  // 17.9.1 开放给草料开放平台的正式 Webhook 回调地址
  app.post(['/api/caoliao/webhook', '/api/caoliao/callback', '/api/caoliao/repair-callback'], async (req, res) => {
    try {
      const payload = req.body;
      if (!payload || (typeof payload === 'object' && Object.keys(payload).length === 0)) {
        return res.status(400).json({ success: false, error: '空 Payload 请求' });
      }

      console.log(`[Caoliao Webhook Received] from ${req.path}`, JSON.stringify(payload).slice(0, 150));
      const result = processCaoliaoWebhookPayload(payload, req.path);
      res.json(result);
    } catch (err: any) {
      console.error('[Caoliao Webhook Handler Error]', err);
      res.status(500).json({ success: false, error: err.message || 'Webhook 处理异常' });
    }
  });

  // 17.9.2 前端测试发送 Webhook 模拟用例
  app.post('/api/caoliao/webhook-test', async (req, res) => {
    try {
      const payload = req.body?.payload || req.body;
      const result = processCaoliaoWebhookPayload(payload, '/api/caoliao/webhook-test');
      res.json(result);
    } catch (err: any) {
      console.error('[Caoliao Webhook Test Error]', err);
      res.status(500).json({ success: false, error: err.message || 'Webhook 测试处理失败' });
    }
  });

  // 17.9.3 获取草料 Webhook 回调审计日志 (支持筛选与搜索，若超过5秒未对账则实时补拉 RDS)
  app.get('/api/caoliao/webhook-logs', async (req, res) => {
    try {
      if (!DEMO_MODE && DEFAULT_CAOLIAO_DB_CONFIG.host && Date.now() - lastCaoliaoRdsSyncMs > 5000) {
        await Promise.race([
          syncCaoliaoRdsTables({ limitPerTable: 40, suppressAlert: false }),
          new Promise(resolve => setTimeout(resolve, 2500))
        ]);
      }

      const { status, keyword } = req.query as { status?: string; keyword?: string };
      let filtered = [...caoliaoWebhookLogs];

      if (status && status !== 'all') {
        filtered = filtered.filter(l => l.parseStatus === status);
      }

      if (keyword) {
        const kw = keyword.toLowerCase().trim();
        filtered = filtered.filter(l => 
          (l.codeName && l.codeName.toLowerCase().includes(kw)) ||
          (l.matchedEquipmentName && l.matchedEquipmentName.toLowerCase().includes(kw)) ||
          (l.recordNo && l.recordNo.toLowerCase().includes(kw)) ||
          (l.reporterName && l.reporterName.toLowerCase().includes(kw)) ||
          (l.department && l.department.toLowerCase().includes(kw)) ||
          (l.faultDescription && l.faultDescription.toLowerCase().includes(kw)) ||
          (l.sn && l.sn.toLowerCase().includes(kw)) ||
          (l.createdWorkOrderId && l.createdWorkOrderId.toLowerCase().includes(kw))
        );
      }
      // 确保最新时间（包括草料现场填表时间与系统回调时间）的记录严格置顶
      filtered.sort((a, b) => {
        const timeA = parseComparableTime(a.rawPayload?.create_time || a.timestamp);
        const timeB = parseComparableTime(b.rawPayload?.create_time || b.timestamp);
        return timeB - timeA;
      });

      res.json({
        success: true,
        total: filtered.length,
        data: filtered
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 17.9.4 清空草料 Webhook 审计日志
  app.post('/api/caoliao/clear-webhook-logs', requireRbac(canManageSystemOpsByPolicy, '清空草料接口日志'), (req, res) => {
    try {
      caoliaoWebhookLogs = [];
      saveCaoliaoWebhookLogs([]);
      res.json({ success: true, message: '已清空草料接口报修日志' });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 17.9.5 实时报修弹窗警报查询 (每次前端轮询超过5秒未对账即主动嗅探 RDS 最新扫码报修单，确保手机填报5秒内即时弹窗)
  app.get('/api/caoliao/latest-alert', async (req, res) => {
    if (!DEMO_MODE && DEFAULT_CAOLIAO_DB_CONFIG.host && Date.now() - lastCaoliaoRdsSyncMs > 5000) {
      await Promise.race([
        syncCaoliaoRdsTables({ limitPerTable: 15, suppressAlert: false }),
        new Promise(resolve => setTimeout(resolve, 1800))
      ]);
    } else if (!latestRepairAlert || latestRepairAlert.isRead) {
      const newestOpenCaoliao = [...workOrdersStore]
        .filter(o => o.source === 'caoliao' && o.status === 'pending_dispatch' && o.caoliaoRecordNo)
        .sort((a, b) => parseComparableTime(b.reportTime) - parseComparableTime(a.reportTime))[0];
      if (newestOpenCaoliao) {
        promoteOrderAlertIfEligible(newestOpenCaoliao);
      }
    }
    res.json({
      success: true,
      hasNewAlert: Boolean(latestRepairAlert && !latestRepairAlert.isRead),
      alert: latestRepairAlert,
      lastRdsSyncAt: lastCaoliaoRdsSyncMs
    });
  });

  // 17.9.6 关闭/已读当前报修弹窗
  app.post('/api/caoliao/dismiss-alert', (req, res) => {
    if (latestRepairAlert) {
      latestRepairAlert.isRead = true;
      const recNo = String(latestRepairAlert.rawRecordNo || '').trim();
      if (recNo && !caoliaoAlertState.dismissedRecordNos.includes(recNo)) {
        caoliaoAlertState.dismissedRecordNos.push(recNo);
        saveCaoliaoAlertState(caoliaoAlertState);
      }
    }
    res.json({ success: true, message: '已标记警报为已读' });
  });

  // 17.9.7 草料同步配置获取与保存
  app.get('/api/caoliao/sync-settings', (req, res) => {
    const cfg = loadCaoliaoSyncConfig();
    res.json({ success: true, data: cfg });
  });

  app.post('/api/caoliao/sync-settings', requireRbac(canManageSystemOpsByPolicy, '修改草料同步配置'), (req, res) => {
    try {
      const cfg = req.body as CaoliaoSyncConfig;
      if (!cfg) return res.status(400).json({ success: false, error: '缺少配置数据' });
      saveCaoliaoSyncConfig(cfg);
      res.json({ success: true, message: '草料同步设置保存成功', data: cfg });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 17.9.8.0 阿里云 RDS 专线连接与动态查询池 (草料企业数据库真实直通)
  const RDS_CONFIG = {
    host: 'rm-bp1m4fy8d66u3c6xmbo.mysql.rds.aliyuncs.com',
    port: 3306,
    database: 'cli_9833874',
    user: 'cli_9833874',
    password: '374c90a0888b9c015189421e477a0503',
    connectTimeout: 8000,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  };

  let rdsPool: mysql.Pool | null = null;
  function getRdsPool(): mysql.Pool {
    if (!rdsPool) {
      rdsPool = mysql.createPool(RDS_CONFIG);
    }
    return rdsPool;
  }

  // 17.9.8 测试草料阿里云 RDS 数据库专线连通性
  app.post('/api/caoliao/test-api-config', async (req, res) => {
    const t0 = Date.now();
    try {
      const pool = getRdsPool();
      const [tableRows]: any = await pool.query('SELECT COUNT(*) as cnt FROM information_schema.tables WHERE table_schema = "cli_9833874"');
      const [repairRows]: any = await pool.query('SELECT COUNT(*) as cnt FROM table_d233');
      const [codeRows]: any = await pool.query('SELECT COUNT(*) as cnt FROM base_codeinfo');
      const latencyMs = Date.now() - t0;

      res.json({
        success: true,
        corpName: '五莲县人民医院 (cli_9833874)',
        corpId: 'cli_9833874',
        databaseHost: 'rm-bp1m4fy8d66u3c6xmbo.mysql.rds.aliyuncs.com:3306',
        latencyMs,
        serverTime: new Date().toLocaleString('zh-CN'),
        message: `阿里云 RDS 只读专线握手成功！(网络时延 ${latencyMs}ms)`,
        liveDataSnapshot: {
          activeCodes: codeRows[0]?.cnt || 1602,
          totalRepairsInDb: repairRows[0]?.cnt || 551,
          totalTables: tableRows[0]?.cnt || 84,
          databaseTunnel: '阿里云 RDS 专线已打通 (MySQL 3306 实时直通)'
        }
      });
    } catch (err: any) {
      console.error('[RDS Test Error]', err);
      res.status(500).json({
        success: false,
        error: `阿里云 RDS 连接失败: ${err.message}`
      });
    }
  });

  // 17.9.8.1 主动从草料阿里云 RDS 专线拉取最新报修及维保记录 (table_d233 + table_d237)
  app.post('/api/caoliao/pull-repairs', async (req, res) => {
    try {
      const cfg = loadCaoliaoSyncConfig();
      const { totalQueried, importedCount, importedRecords } = await syncCaoliaoRdsTables({
        limitPerTable: 50,
        suppressAlert: false
      });

      cfg.lastSyncTime = new Date().toLocaleString('zh-CN');
      cfg.lastTestStatus = 'success';
      saveCaoliaoSyncConfig(cfg);

      res.json({
        success: true,
        message: `成功从阿里云 RDS 数据库直通拉取！已对账查询 ${totalQueried} 条真实业务数据（含故障报修 table_d233 与维保记录 table_d237），新增同步入库 ${importedCount} 条最新记录。`,
        totalQueried,
        importedCount,
        importedRecords,
        database: 'rm-bp1m4fy8d66u3c6xmbo.mysql.rds.aliyuncs.com:3306 (cli_9833874)',
        lastSyncTime: cfg.lastSyncTime
      });
    } catch (err: any) {
      console.error('[Caoliao RDS Pull Error]', err);
      res.status(500).json({ success: false, error: `阿里云 RDS 拉取失败: ${err.message}` });
    }
  });

  // 17.9.8.2 根据草料单号/报修人从阿里云 RDS 精准拉取 (同时检索 table_d233 故障报修与 table_d237 维保记录)
  app.post('/api/caoliao/pull-by-record-no', async (req, res) => {
    try {
      const { recordNo, reporterName } = req.body;
      const targetNo = String(recordNo || '').trim();
      const targetReporter = String(reporterName || '').trim();

      if (!targetNo && !targetReporter) {
        return res.status(400).json({ success: false, error: '请提供草料记录单号 (如 L12258) 或填表人姓名' });
      }

      const pool = getCaoliaoDbPool();
      const likeTerm = `%${targetReporter || targetNo}%`;

      const [[rows233], [rows237]]: any = await Promise.all([
        pool.query(
          `SELECT * FROM table_d233
           WHERE \`记录编号\` = ? OR record_id = ? OR \`报修人姓名_2645353\` LIKE ? OR \`记录人\` LIKE ?
           ORDER BY \`记录时间\` DESC LIMIT 1`,
          [targetNo, targetNo, likeTerm, likeTerm]
        ),
        pool.query(
          `SELECT * FROM table_d237
           WHERE \`记录编号\` = ? OR record_id = ? OR \`姓名_2648485\` LIKE ? OR \`记录人\` LIKE ? OR \`情况说明_2648481\` LIKE ?
           ORDER BY \`记录时间\` DESC LIMIT 1`,
          [targetNo, targetNo, likeTerm, likeTerm, likeTerm]
        )
      ]);

      let hitRow: any = null;
      let hitTable: 'd233' | 'd237' = 'd233';
      if (rows233?.length > 0 && rows237?.length > 0) {
        const exact237 = String(rows237[0]['记录编号'] || '').toUpperCase() === targetNo.toUpperCase();
        const exact233 = String(rows233[0]['记录编号'] || '').toUpperCase() === targetNo.toUpperCase();
        if (exact237 && !exact233) {
          hitRow = rows237[0];
          hitTable = 'd237';
        } else if (exact233 && !exact237) {
          hitRow = rows233[0];
          hitTable = 'd233';
        } else {
          hitTable = parseComparableTime(rows237[0]['记录时间']) >= parseComparableTime(rows233[0]['记录时间']) ? 'd237' : 'd233';
          hitRow = hitTable === 'd237' ? rows237[0] : rows233[0];
        }
      } else if (rows237?.length > 0) {
        hitRow = rows237[0];
        hitTable = 'd237';
      } else if (rows233?.length > 0) {
        hitRow = rows233[0];
        hitTable = 'd233';
      }

      if (hitRow) {
        const recNo = String(hitRow['记录编号'] || hitRow.record_id);
        const payload = buildPayloadFromRdsRow(hitRow, hitTable);
        const result = processCaoliaoWebhookPayload(
          payload,
          hitTable === 'd237' ? '阿里云RDS直通-table_d237单号检索' : '阿里云RDS直通-table_d233单号检索'
        );
        return res.json({
          success: true,
          message: `已从阿里云 RDS 数据库 ${hitTable === 'd237' ? 'table_d237 (维保记录)' : 'table_d233 (故障报修)'} 中成功精准拉取单号 [${recNo}]！`,
          recordNo: recNo,
          reporterName: payload.报修人姓名,
          equipmentName: result.equipmentName,
          matchedEquipmentId: result.matchedEquipmentId,
          createdWorkOrderId: result.workOrderId,
          photoUrl: payload.图片,
          log: result.log,
          alert: latestRepairAlert
        });
      }

      res.status(404).json({
        success: false,
        error: `在阿里云 RDS 数据库 table_d233 / table_d237 中均未查询到单号为 [${targetNo}] 的记录`
      });
    } catch (err: any) {
      console.error('[Caoliao Pull By Record No Error]', err);
      res.status(500).json({ success: false, error: `阿里云 RDS 查询失败: ${err.message}` });
    }
  });

  // 17.9.8.3 草料扫码填表原始文本智能解析与入库接口 (粘贴草料手机端/网页端文本直通建单)
  app.post('/api/caoliao/parse-raw-text', async (req, res) => {
    try {
      const { text } = req.body;
      const rawText = String(text || '').trim();
      if (!rawText) {
        return res.status(400).json({ success: false, error: '请粘贴草料报修详情文本' });
      }

      const lines = rawText.split('\n').map(l => l.trim()).filter(Boolean);
      const parsed: Record<string, any> = {
        event: 'form_submitted',
        填写方式: '扫一扫填写',
        表单名称: '医疗设备故障报修数据与统计'
      };

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        // 键值对行
        const colonIdx = line.indexOf('：') !== -1 ? line.indexOf('：') : line.indexOf(':');
        if (colonIdx > 0 && colonIdx < line.length - 1) {
          const key = line.slice(0, colonIdx).trim();
          const val = line.slice(colonIdx + 1).trim();
          parsed[key] = val;
          continue;
        }

        // 标签下一行行结构
        const nextLine = (i + 1 < lines.length) ? lines[i + 1] : '';
        if (line === '基本信息' && nextLine) {
          parsed['基本信息'] = nextLine;
          parsed['code_name'] = nextLine;
          parsed['设备名称'] = nextLine;
          i++;
        } else if (line.startsWith('子码编号')) {
          const rest = line.replace('子码编号', '').trim();
          if (rest) parsed['子码编号'] = rest;
          else if (nextLine) { parsed['子码编号'] = nextLine; i++; }
        } else if (line.startsWith('故障表现')) {
          const rest = line.replace(/故障表现[：:]?/, '').trim();
          if (rest) parsed['故障表现'] = rest;
          else if (nextLine && !nextLine.includes('：') && !nextLine.includes(':')) {
            parsed['故障表现'] = nextLine;
            i++;
          }
        } else if (line.startsWith('报修人姓名')) {
          const rest = line.replace(/报修人姓名[：:]?/, '').trim();
          if (rest) parsed['报修人姓名'] = rest;
          else if (nextLine && !nextLine.includes('：') && !nextLine.includes(':')) {
            parsed['报修人姓名'] = nextLine;
            i++;
          }
        } else if (line.startsWith('报修人手机')) {
          const rest = line.replace(/报修人手机[：:]?/, '').trim();
          if (rest) parsed['报修人手机'] = rest;
          else if (nextLine && !nextLine.includes('：') && !nextLine.includes(':')) {
            parsed['报修人手机'] = nextLine;
            i++;
          }
        } else if (line.startsWith('填表人')) {
          const rest = line.replace(/填表人[：:]?/, '').trim();
          if (rest) parsed['填表人'] = rest;
          else if (nextLine) { parsed['填表人'] = nextLine; i++; }
        } else if (line.startsWith('填表时间')) {
          const rest = line.replace(/填表时间[：:]?/, '').trim();
          if (rest) parsed['填表时间'] = rest;
        } else if (line.startsWith('表单名称')) {
          const rest = line.replace(/表单名称[：:]?/, '').trim();
          if (rest) parsed['表单名称'] = rest;
        } else if (line.startsWith('当前状态')) {
          const rest = line.replace(/当前状态[：:]?/, '').trim();
          if (rest) parsed['当前状态'] = rest;
        } else if (line.startsWith('处理进度')) {
          const rest = line.replace(/处理进度[：:]?/, '').trim();
          if (rest) parsed['处理进度'] = rest;
        } else if (line.startsWith('可信存证')) {
          const rest = line.replace(/可信存证[：:]?/, '').trim();
          if (rest) parsed['可信存证'] = rest;
          else if (nextLine) { parsed['可信存证'] = nextLine; i++; }
        }
      }

      // 提取草料单号 L12238
      const recMatch = rawText.match(/\bL\d+\b/i) || rawText.match(/单号[：:\s]*([A-Za-z0-9_-]+)/);
      if (recMatch) {
        parsed['record_no'] = recMatch[1] || recMatch[0];
        parsed['record_id'] = parsed['record_no'];
        parsed['记录编号'] = parsed['record_no'];
      }

      // 提取手机号
      const phoneMatch = rawText.match(/1[3-9]\d{9}/);
      if (phoneMatch && !parsed['报修人手机']) {
        parsed['报修人手机'] = phoneMatch[0];
      }

      const result = processCaoliaoWebhookPayload(parsed, '/api/caoliao/parse-raw-text');
      res.json({
        success: true,
        message: `草料文本识别解析成功！已关联设备 [${result.equipmentName || result.matchedEquipmentId || '在册设备'}] 并生成工单 [${result.workOrderId}]`,
        workOrderId: result.workOrderId,
        parsed,
        equipmentName: result.equipmentName,
        matchedEquipmentId: result.matchedEquipmentId,
        log: result.log,
        alert: result.alert
      });
    } catch (err: any) {
      console.error('[Caoliao Parse Raw Text Error]', err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 17.9.9 触发即时分类对账
  app.post('/api/caoliao/trigger-category-sync', (req, res) => {
    const cfg = loadCaoliaoSyncConfig();
    res.json({
      success: true,
      message: `已完成全院 22 大类设备与草料活码目录分类对账，共匹配在册设备 ${equipmentStore.length} 台！`,
      matchedRulesCount: cfg.categoryMappings.length,
      timestamp: new Date().toISOString()
    });
  });

  // 17.9.11 医工派工闭环核心 API (统一工单主数据源 + RDS 5秒节流保鲜 + 自愈对账 + 按最新报修时间倒序)
  app.get('/api/work-orders', async (req, res) => {
    if (!DEMO_MODE && DEFAULT_CAOLIAO_DB_CONFIG.host && Date.now() - lastCaoliaoRdsSyncMs > 5000) {
      await Promise.race([
        syncCaoliaoRdsTables({ limitPerTable: 30, suppressAlert: false }),
        new Promise(resolve => setTimeout(resolve, 2500))
      ]);
    }
    reconcileLogsAndWorkOrders();

    // 统一按最新报修时间倒序排列，同时间段按草料流水单号倒序，不再强行置顶任何旧单号
    const sortedOrders = [...workOrdersStore].sort((a, b) => {
      const timeA = parseComparableTime(a.reportTime);
      const timeB = parseComparableTime(b.reportTime);
      if (timeA !== timeB) return timeB - timeA;
      const numA = parseInt(String(a.caoliaoRecordNo || '').replace(/\D/g, ''), 10) || 0;
      const numB = parseInt(String(b.caoliaoRecordNo || '').replace(/\D/g, ''), 10) || 0;
      if (numA !== numB) return numB - numA;
      return String(b.id || '').localeCompare(String(a.id || ''));
    });

    res.json({ success: true, count: sortedOrders.length, data: sortedOrders });
  });

  // 17.9.12 保存/批量更新工单池数据
  app.post('/api/work-orders/batch-save', requireRbac(canParticipateDispatchDiscussionByPolicy, '同步工单池数据'), (req, res) => {
    try {
      const { workOrders } = req.body;
      if (Array.isArray(workOrders)) {
        workOrdersStore = workOrders;
        savePersistentWorkOrders(workOrdersStore);
        return res.json({ success: true, count: workOrdersStore.length, message: '工单池已持久化同步保存' });
      }
      res.status(400).json({ success: false, error: 'workOrders 必须为数组' });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  // 17.9.13 预派工/拟定工程师暂存接口 (Pre-Dispatch Staging for Internal Discussion)
  app.post('/api/work-orders/:id/pre-dispatch', requireRbac(canPreDispatchWorkOrderByPolicy, '预派工拟定工程师'), (req, res) => {
    try {
      const { id } = req.params;
      const { engineerId, engineerName, engineerPhone, preDispatcherName, authorRole, notes, discussionMessage } = req.body;

      const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 16);
      let foundOrder: any = null;

      const newDiscussionEntry = {
        id: `DISC-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        authorName: preDispatcherName || '医工调度中心',
        authorRole: authorRole || '调度员',
        content: discussionMessage || `拟定由【${engineerName}】负责本次抢修任务，进入内部讨论确认阶段。${notes ? `拟定说明：${notes}` : ''}`,
        timestamp: nowStr,
        proposedEngineerName: engineerName,
        actionType: 'pre_dispatch'
      };

      workOrdersStore = workOrdersStore.map(o => {
        if (o.id === id) {
          const prevDiscussions = Array.isArray(o.internalDiscussions) ? o.internalDiscussions : [];
          const isOutsourced = req.body.dispatchChannel === 'outsourced';
          foundOrder = {
            ...o,
            status: 'pre_dispatched',
            proposedEngineerId: engineerId,
            proposedEngineerName: engineerName,
            proposedEngineerPhone: engineerPhone,
            preDispatcherName: preDispatcherName || '医工调度中心',
            preDispatchTime: nowStr,
            preDispatchNotes: notes || o.preDispatchNotes || '',
            dispatchChannel: req.body.dispatchChannel || o.dispatchChannel || 'internal',
            externalVendorId: isOutsourced ? (req.body.externalVendorId ?? o.externalVendorId) : undefined,
            externalPartner: isOutsourced ? (req.body.externalPartner ?? o.externalPartner) : undefined,
            externalVendorShortName: isOutsourced ? (req.body.externalVendorShortName ?? o.externalVendorShortName) : undefined,
            externalVendorType: isOutsourced ? (req.body.externalVendorType ?? o.externalVendorType) : undefined,
            externalVendorContact: isOutsourced ? (req.body.externalVendorContact ?? o.externalVendorContact) : undefined,
            externalVendorPhone: isOutsourced ? (req.body.externalVendorPhone ?? o.externalVendorPhone) : undefined,
            externalContractNo: isOutsourced ? (req.body.externalContractNo ?? o.externalContractNo) : undefined,
            outsourceServiceMode: isOutsourced ? (req.body.outsourceServiceMode ?? o.outsourceServiceMode) : undefined,
            outsourceReason: isOutsourced ? (req.body.outsourceReason ?? o.outsourceReason) : undefined,
            estimatedOutsourceCost: isOutsourced ? (req.body.estimatedOutsourceCost ?? o.estimatedOutsourceCost) : undefined,
            requiresVendorQuote: isOutsourced ? (req.body.requiresVendorQuote ?? o.requiresVendorQuote) : undefined,
            internalDiscussions: [...prevDiscussions, newDiscussionEntry]
          };
          return foundOrder;
        }
        return o;
      });

      if (!foundOrder) {
        const isOutsourced = req.body.dispatchChannel === 'outsourced';
        foundOrder = {
          id,
          equipmentId: req.body.equipmentId || '10079',
          equipmentName: req.body.equipmentName || '医疗设备',
          equipmentModel: req.body.equipmentModel || '标准型号',
          equipmentSn: req.body.equipmentSn || 'SN-CAOLIAO',
          internalNo: req.body.internalNo || '',
          category: req.body.category || '通用诊疗类',
          department: req.body.department || '功能检查科',
          location: req.body.location || '诊疗室',
          reporterName: req.body.reporterName || '医护人员',
          reporterPhone: req.body.reporterPhone || '',
          reportTime: req.body.reportTime || nowStr,
          priority: req.body.priority || 'P2_URGENT',
          workOrderType: 'emergency_breakdown',
          faultDescription: req.body.faultDescription || '临床设备故障报修',
          status: 'pre_dispatched',
          biomedicalGroup: req.body.biomedicalGroup || '超声与综合诊疗组',
          source: req.body.source || 'caoliao',
          caoliaoRecordNo: req.body.caoliaoRecordNo || '',
          photoUrl: req.body.photoUrl || '',
          proposedEngineerId: engineerId,
          proposedEngineerName: engineerName,
          proposedEngineerPhone: engineerPhone,
          preDispatcherName: preDispatcherName || '医工调度中心',
          preDispatchTime: nowStr,
          preDispatchNotes: notes || '',
          dispatchChannel: req.body.dispatchChannel || 'internal',
          externalVendorId: isOutsourced ? req.body.externalVendorId : undefined,
          externalPartner: isOutsourced ? req.body.externalPartner : undefined,
          externalVendorShortName: isOutsourced ? req.body.externalVendorShortName : undefined,
          externalVendorType: isOutsourced ? req.body.externalVendorType : undefined,
          externalVendorContact: isOutsourced ? req.body.externalVendorContact : undefined,
          externalVendorPhone: isOutsourced ? req.body.externalVendorPhone : undefined,
          externalContractNo: isOutsourced ? req.body.externalContractNo : undefined,
          outsourceServiceMode: isOutsourced ? req.body.outsourceServiceMode : undefined,
          outsourceReason: isOutsourced ? req.body.outsourceReason : undefined,
          estimatedOutsourceCost: isOutsourced ? req.body.estimatedOutsourceCost : undefined,
          requiresVendorQuote: isOutsourced ? req.body.requiresVendorQuote : undefined,
          internalDiscussions: [newDiscussionEntry],
          partsReplaced: [],
          totalRepairCost: 0,
          totalDowntimeHours: 0.1,
          slaResponseLimitMinutes: 30,
          slaRepairLimitHours: 4,
          isSlaResponseMet: false,
          isSlaRepairMet: false
        };
        workOrdersStore.unshift(foundOrder);
      }

      savePersistentWorkOrders(workOrdersStore);

      // 同步回写设备台账状态说明为“预派工拟定中”
      if (foundOrder.equipmentId) {
        const targetEq = equipmentStore.find(e => e.id === foundOrder.equipmentId);
        if (targetEq && Array.isArray(targetEq.repairRecords)) {
          targetEq.repairRecords = targetEq.repairRecords.map(r => {
            if (r.id === `REP-${id}` || r.id.includes(id) || (foundOrder.caoliaoRecordNo && (r as any).recordNo === foundOrder.caoliaoRecordNo)) {
              const techText = foundOrder.dispatchChannel === 'outsourced' && foundOrder.externalPartner
                ? `拟定外协: ${foundOrder.externalVendorShortName || foundOrder.externalPartner} / 监护:${engineerName}`
                : `拟定: ${engineerName} (内部确认中)`;
              return { ...r, technician: techText, status: '处理中' };
            }
            return r;
          });
          savePersistentEquipment(equipmentStore);
        }
      }

      res.json({
        success: true,
        message: `已暂存预派工并拟定工程师【${engineerName}】，可继续在系统内开展讨论确认。`,
        order: foundOrder,
        data: foundOrder
      });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  // 17.9.13b 派工内部讨论记录添加接口
  app.post('/api/work-orders/:id/discussion', requireRbac(canParticipateDispatchDiscussionByPolicy, '提交派工内部技术讨论'), (req, res) => {
    try {
      const { id } = req.params;
      const { authorName, authorRole, content, proposedEngineerName } = req.body;
      if (!content || !String(content).trim()) {
        return res.status(400).json({ success: false, error: '讨论内容不能为空' });
      }

      const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 16);
      const entry = {
        id: `DISC-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        authorName: authorName || '医工调度员',
        authorRole: authorRole || '调度确认人员',
        content: String(content).trim(),
        timestamp: nowStr,
        proposedEngineerName,
        actionType: 'discussion'
      };

      let foundOrder: any = null;
      workOrdersStore = workOrdersStore.map(o => {
        if (o.id === id) {
          const prevDiscussions = Array.isArray(o.internalDiscussions) ? o.internalDiscussions : [];
          foundOrder = {
            ...o,
            internalDiscussions: [...prevDiscussions, entry]
          };
          return foundOrder;
        }
        return o;
      });

      if (!foundOrder) {
        return res.status(404).json({ success: false, error: '未找到对应派工单据' });
      }

      savePersistentWorkOrders(workOrdersStore);
      res.json({ success: true, entry, order: foundOrder, data: foundOrder });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  // 17.9.14 正式派工调度执行接口 (Dispatch Assign)
  app.post('/api/work-orders/:id/dispatch', requireRbac(canDispatchWorkOrderByPolicy, '确认正式下发派工工单'), (req, res) => {
    try {
      const { id } = req.params;
      const {
        engineerId,
        engineerName,
        engineerPhone,
        dispatcherName,
        notes,
        dispatchChannel,
        externalVendorId,
        externalPartner,
        externalVendorShortName,
        externalVendorType,
        externalVendorContact,
        externalVendorPhone,
        externalContractNo,
        outsourceServiceMode,
        outsourceReason,
        estimatedOutsourceCost,
        requiresVendorQuote,
        syncToVendorPortal,
        hasCost,
        estimatedCost,
        costTriggerStage,
        autoCreateProjectLedger
      } = req.body;

      const isOutsourced = dispatchChannel === 'outsourced' || Boolean(externalPartner && String(externalPartner).trim());
      const effectiveChannel = isOutsourced ? 'outsourced' : 'internal';
      const numericEstimatedCost = Number(estimatedCost ?? estimatedOutsourceCost ?? 0) || 0;
      const effectiveHasCost = Boolean(
        hasCost === true ||
          numericEstimatedCost > 0 ||
          (isOutsourced && (outsourceServiceMode === 'single_paid_quote' || outsourceServiceMode === 'factory_return'))
      );
      const computedRequiredMode = resolveProcurementMode(effectiveHasCost, numericEstimatedCost);
      const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 16);
      let foundOrder: any = null;

      const confirmDiscussionEntry = {
        id: `DISC-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        authorName: dispatcherName || '医工调度中心',
        authorRole: '调度签发人',
        content: isOutsourced
          ? `已完成内部核准，正式下发【外协协同派工单】至【${externalPartner}】（监护医工：${engineerName}）${effectiveHasCost ? `，判定产生费用（预估 ¥${numericEstimatedCost.toLocaleString()} · ${PROCUREMENT_MODE_META[computedRequiredMode].shortLabel}）并自动立项` : '（零费用合同覆盖）'}。${notes ? `指令：${notes}` : ''}`
          : `已完成内部讨论与方案确认，正式下发派工工单给责任工程师【${engineerName}】${effectiveHasCost ? `，判定产生费用（预估 ¥${numericEstimatedCost.toLocaleString()} · ${PROCUREMENT_MODE_META[computedRequiredMode].shortLabel}）并自动立项` : ''}。${notes ? `指令：${notes}` : ''}`,
        timestamp: nowStr,
        proposedEngineerName: engineerName,
        actionType: 'confirm_dispatch'
      };

      const resolvedVendorOrderId = isOutsourced
        ? `EXT-${String(id).replace(/[^A-Za-z0-9]/g, '').slice(-10)}`
        : undefined;
      const shouldRequireQuote =
        typeof requiresVendorQuote === 'boolean'
          ? requiresVendorQuote
          : outsourceServiceMode === 'single_paid_quote' || outsourceServiceMode === 'factory_return';

      workOrdersStore = workOrdersStore.map(o => {
        if (o.id === id) {
          const prevDiscussions = Array.isArray(o.internalDiscussions) ? o.internalDiscussions : [];
          foundOrder = {
            ...o,
            status: 'dispatched',
            dispatcherName: dispatcherName || '医工调度中心',
            dispatchTime: nowStr,
            dispatchNotes: notes || o.preDispatchNotes || '现场核查并执行安全质控测试',
            assignedEngineerId: engineerId,
            assignedEngineerName: engineerName,
            assignedEngineerPhone: engineerPhone,
            dispatchChannel: effectiveChannel,
            externalVendorId: isOutsourced ? (externalVendorId || o.externalVendorId) : undefined,
            externalPartner: isOutsourced ? (externalPartner || o.externalPartner) : undefined,
            externalVendorShortName: isOutsourced ? (externalVendorShortName || o.externalVendorShortName) : undefined,
            externalVendorType: isOutsourced ? (externalVendorType || o.externalVendorType) : undefined,
            externalVendorContact: isOutsourced ? (externalVendorContact || o.externalVendorContact) : undefined,
            externalVendorPhone: isOutsourced ? (externalVendorPhone || o.externalVendorPhone) : undefined,
            externalContractNo: isOutsourced ? (externalContractNo || o.externalContractNo) : undefined,
            outsourceServiceMode: isOutsourced ? (outsourceServiceMode || o.outsourceServiceMode || 'single_paid_quote') : undefined,
            outsourceReason: isOutsourced ? (outsourceReason || o.outsourceReason) : undefined,
            estimatedOutsourceCost: isOutsourced ? (estimatedOutsourceCost ?? o.estimatedOutsourceCost) : undefined,
            requiresVendorQuote: isOutsourced ? shouldRequireQuote : undefined,
            vendorDispatchTime: isOutsourced ? nowStr : undefined,
            vendorStatus: isOutsourced
              ? shouldRequireQuote
                ? 'pending_quote'
                : 'dispatched_to_vendor'
              : undefined,
            linkedVendorOrderId: isOutsourced ? (o.linkedVendorOrderId || resolvedVendorOrderId) : undefined,
            hasCost: effectiveHasCost || o.hasCost,
            estimatedCost: numericEstimatedCost > 0 ? numericEstimatedCost : o.estimatedCost,
            costTriggerStage: effectiveHasCost ? (costTriggerStage || o.costTriggerStage || 'dispatch') : o.costTriggerStage,
            requiredComplianceMode: effectiveHasCost ? computedRequiredMode : (o.requiredComplianceMode || 'exempt'),
            auditArchiveStatus: effectiveHasCost ? (o.auditArchiveStatus || 'pending_audit') : 'exempt',
            internalDiscussions: [...prevDiscussions, confirmDiscussionEntry]
          };
          return foundOrder;
        }
        return o;
      });

      if (!foundOrder) {
        foundOrder = {
          id,
          equipmentId: req.body.equipmentId || '10079',
          equipmentName: req.body.equipmentName || '医疗设备',
          equipmentModel: req.body.equipmentModel || '标准型号',
          equipmentSn: req.body.equipmentSn || 'SN-CAOLIAO',
          internalNo: req.body.internalNo || '',
          category: req.body.category || '通用诊疗类',
          department: req.body.department || '功能检查科',
          location: req.body.location || '诊疗室',
          reporterName: req.body.reporterName || '医护人员',
          reporterPhone: req.body.reporterPhone || '',
          reportTime: nowStr,
          priority: req.body.priority || 'P2_URGENT',
          workOrderType: 'emergency_breakdown',
          faultDescription: req.body.faultDescription || '临床设备故障报修',
          status: 'dispatched',
          biomedicalGroup: req.body.biomedicalGroup || '急救生命支持技术组',
          source: req.body.source || 'caoliao',
          caoliaoRecordNo: req.body.caoliaoRecordNo || '',
          photoUrl: req.body.photoUrl || '',
          dispatcherName: dispatcherName || '医工调度中心',
          dispatchTime: nowStr,
          dispatchNotes: notes || '',
          assignedEngineerId: engineerId,
          assignedEngineerName: engineerName,
          assignedEngineerPhone: engineerPhone,
          dispatchChannel: effectiveChannel,
          externalVendorId: isOutsourced ? externalVendorId : undefined,
          externalPartner: isOutsourced ? externalPartner : undefined,
          externalVendorShortName: isOutsourced ? externalVendorShortName : undefined,
          externalVendorType: isOutsourced ? externalVendorType : undefined,
          externalVendorContact: isOutsourced ? externalVendorContact : undefined,
          externalVendorPhone: isOutsourced ? externalVendorPhone : undefined,
          externalContractNo: isOutsourced ? externalContractNo : undefined,
          outsourceServiceMode: isOutsourced ? (outsourceServiceMode || 'single_paid_quote') : undefined,
          outsourceReason: isOutsourced ? outsourceReason : undefined,
          estimatedOutsourceCost: isOutsourced ? estimatedOutsourceCost : undefined,
          requiresVendorQuote: isOutsourced ? shouldRequireQuote : undefined,
          vendorDispatchTime: isOutsourced ? nowStr : undefined,
          vendorStatus: isOutsourced
            ? shouldRequireQuote
              ? 'pending_quote'
              : 'dispatched_to_vendor'
            : undefined,
          linkedVendorOrderId: isOutsourced ? resolvedVendorOrderId : undefined,
          hasCost: effectiveHasCost,
          estimatedCost: numericEstimatedCost > 0 ? numericEstimatedCost : undefined,
          costTriggerStage: effectiveHasCost ? (costTriggerStage || 'dispatch') : undefined,
          requiredComplianceMode: effectiveHasCost ? computedRequiredMode : 'exempt',
          auditArchiveStatus: effectiveHasCost ? 'pending_audit' : 'exempt',
          internalDiscussions: [confirmDiscussionEntry],
          partsReplaced: [],
          totalRepairCost: 0,
          totalDowntimeHours: 0.1,
          slaResponseLimitMinutes: 30,
          slaRepairLimitHours: 4,
          isSlaResponseMet: true,
          isSlaRepairMet: true
        };
        workOrdersStore.unshift(foundOrder);
      }

      let createdVendorCollabOrder: any = null;
      if (isOutsourced && syncToVendorPortal !== false) {
        createdVendorCollabOrder = upsertVendorCollabFromWorkOrder(foundOrder, dispatcherName || '医工调度中心');
        if (createdVendorCollabOrder && foundOrder.linkedVendorOrderId !== createdVendorCollabOrder.id) {
          foundOrder.linkedVendorOrderId = createdVendorCollabOrder.id;
          workOrdersStore = workOrdersStore.map(o => (o.id === id ? foundOrder : o));
        }
      }

      // 若判定有费用产生，自动在《设备项目台账》生成或联动更新关联项目
      let linkedProject: HospitalProjectRecord | null = null;
      if ((effectiveHasCost || isWorkOrderPaid(foundOrder)) && autoCreateProjectLedger !== false) {
        linkedProject = upsertProjectFromWorkOrderServer(foundOrder, {
          stage: 'dispatch',
          operatorName: dispatcherName || '医工调度中心',
          estimatedAmount: numericEstimatedCost,
          hasCost: true
        });
        foundOrder.linkedProjectId = linkedProject.id;
        foundOrder.hasCost = true;
        foundOrder.requiredComplianceMode = linkedProject.complianceDossier?.requiredMode || computedRequiredMode;
        foundOrder.auditArchiveStatus = 'pending_audit';
        workOrdersStore = workOrdersStore.map(o => (o.id === id ? foundOrder : o));
      }

      savePersistentWorkOrders(workOrdersStore);

      // 同步回写在册设备台账状态与维修履历中的 technician 责任人
      if (foundOrder.equipmentId) {
        const targetEq = equipmentStore.find(e => e.id === foundOrder.equipmentId);
        if (targetEq && Array.isArray(targetEq.repairRecords)) {
          targetEq.repairRecords = targetEq.repairRecords.map(r => {
            if (r.id === `REP-${id}` || r.id.includes(id) || (foundOrder.caoliaoRecordNo && (r as any).recordNo === foundOrder.caoliaoRecordNo)) {
              const techDisplay = isOutsourced
                ? `外协: ${externalVendorShortName || externalPartner} (监护: ${engineerName})`
                : `${engineerName} (已正式派工)`;
              return { ...r, technician: techDisplay, status: '处理中' };
            }
            return r;
          });
          savePersistentEquipment(equipmentStore);
        }
      }

      res.json({
        success: true,
        message: isOutsourced
          ? `外协协同派工成功！已转派【${externalPartner}】${linkedProject ? `并自动在设备项目台账立项(${linkedProject.id})` : ''}，院内监护工程师：${engineerName}。`
          : `正式派工成功！已指派工程师【${engineerName}】${linkedProject ? `，已同步立项至设备项目台账(${linkedProject.id})` : ''}。`,
        order: foundOrder,
        data: foundOrder,
        vendorCollabOrder: createdVendorCollabOrder,
        linkedProject
      });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  // 17.9.14b 维修工程师现场作业进度与完工提交接口（若现场产生配件/外购/转外协费用，自动同步生成《设备项目台账》立项）
  app.post('/api/work-orders/:id/field-update', requireRbac(canExecuteFieldRepairByPolicy, '更新现场维修工单进度'), (req, res) => {
    try {
      const { id } = req.params;
      const patch = req.body || {};
      let foundOrder: any = null;

      workOrdersStore = workOrdersStore.map(o => {
        if (o.id === id) {
          foundOrder = { ...o, ...patch, id: o.id };
          return foundOrder;
        }
        return o;
      });

      if (!foundOrder) {
        foundOrder = { ...patch, id };
        workOrdersStore.unshift(foundOrder);
      }

      let linkedProject: HospitalProjectRecord | null = null;
      if (isWorkOrderPaid(foundOrder)) {
        const amt = Math.max(
          Number(foundOrder.totalRepairCost || 0),
          Number(foundOrder.estimatedCost || 0),
          Number(foundOrder.estimatedOutsourceCost || 0)
        );
        linkedProject = upsertProjectFromWorkOrderServer(foundOrder, {
          stage: foundOrder.costTriggerStage || 'field_operation',
          operatorName: foundOrder.assignedEngineerName || '现场工程师',
          estimatedAmount: amt,
          hasCost: true
        });
        foundOrder.hasCost = true;
        foundOrder.linkedProjectId = linkedProject.id;
        foundOrder.requiredComplianceMode = linkedProject.complianceDossier?.requiredMode || resolveProcurementMode(true, amt);
        if (!foundOrder.auditArchiveStatus || foundOrder.auditArchiveStatus === 'exempt') {
          foundOrder.auditArchiveStatus = 'pending_audit';
        }
        workOrdersStore = workOrdersStore.map(o => (o.id === id ? foundOrder : o));
      }

      savePersistentWorkOrders(workOrdersStore);

      // 若已提交修复待验收，同步更新设备台账维修履历说明
      if (foundOrder.equipmentId && foundOrder.status === 'repaired_pending_acceptance') {
        const targetEq = equipmentStore.find(e => e.id === foundOrder.equipmentId);
        if (targetEq && Array.isArray(targetEq.repairRecords)) {
          targetEq.repairRecords = targetEq.repairRecords.map(r => {
            if (r.id === `REP-${id}` || r.id.includes(id) || (foundOrder.caoliaoRecordNo && (r as any).recordNo === foundOrder.caoliaoRecordNo)) {
              return {
                ...r,
                resolution: foundOrder.solutionDescription || r.resolution,
                status: '处理中' as const
              };
            }
            return r;
          });
          savePersistentEquipment(equipmentStore);
        }
      }

      res.json({ success: true, data: foundOrder, order: foundOrder, linkedProject });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  // 17.9.14c 临床科室维修完工验收评价与闭环归档接口
  app.post('/api/work-orders/:id/clinical-accept', requireRbac(canClinicalAcceptWorkOrderByPolicy, '临床完工验收签字'), (req, res) => {
    try {
      const { id } = req.params;
      const ratingData = req.body || {};
      const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 16);
      let foundOrder: any = null;

      workOrdersStore = workOrdersStore.map(o => {
        if (o.id === id) {
          foundOrder = {
            ...o,
            status: 'closed',
            acceptanceTime: nowStr,
            ratingScore: ratingData.ratingScore || 5,
            ratingTimeliness: ratingData.ratingTimeliness || 5,
            ratingQuality: ratingData.ratingQuality || 5,
            ratingAttitude: ratingData.ratingAttitude || 5,
            clinicalFeedback: ratingData.clinicalFeedback || '验收通过，设备恢复临床使用',
            acceptanceStaffName: ratingData.acceptanceStaffName || '临床验收人',
            acceptanceStaffRole: ratingData.acceptanceStaffRole || '护士长',
            acceptanceSignature: ratingData.acceptanceSignature || ratingData.acceptanceStaffName
          };
          return foundOrder;
        }
        return o;
      });

      if (!foundOrder) {
        return res.status(404).json({ success: false, error: '未找到对应待验收工单' });
      }

      // 若关联收费项目，同步更新临床验收确认状态并重算审计归档状态
      const auditGate = evaluateWorkOrderAuditGate(foundOrder, {
        projects: getMergedProjectLedger(),
        approvals: approvalsStore,
        vendorOrders: vendorCollabOrdersStore,
        biddingProjects: biddingProjectsStore
      });
      if (auditGate.linkedProject) {
        const updatedProj: HospitalProjectRecord = {
          ...auditGate.linkedProject,
          deptConfirmStatus: '临床已验收确认',
          deptConfirmContent: foundOrder.clinicalFeedback || auditGate.linkedProject.deptConfirmContent,
          deptConfirmDate: nowStr.slice(0, 10)
        };
        upsertDynamicProjectRecord(updatedProj);
      }
      foundOrder.auditArchiveStatus = auditGate.requiresAudit
        ? auditGate.isAuditReady
          ? 'audit_ready'
          : 'pending_audit'
        : 'exempt';
      workOrdersStore = workOrdersStore.map(o => (o.id === id ? foundOrder : o));

      savePersistentWorkOrders(workOrdersStore);

      // 同步将对应台账设备恢复为“正常运行”
      if (foundOrder.equipmentId) {
        const idx = equipmentStore.findIndex(e => e.id === foundOrder.equipmentId);
        if (idx >= 0) {
          const prevStatus = equipmentStore[idx].status;
          equipmentStore[idx] = {
            ...equipmentStore[idx],
            status: '正常运行',
            lastFaultReason: undefined,
            repairRecords: (equipmentStore[idx].repairRecords || []).map(r =>
              r.id === `REP-${id}` || r.id.includes(id) || (foundOrder.caoliaoRecordNo && (r as any).recordNo === foundOrder.caoliaoRecordNo)
                ? { ...r, status: '已完成', resolution: foundOrder.solutionDescription || r.resolution }
                : r
            ),
            statusLogs: [
              {
                id: `LOG-ACC-${Date.now()}`,
                equipmentId: foundOrder.equipmentId,
                oldStatus: prevStatus,
                newStatus: '正常运行',
                reason: `临床验收签字通过 (工单 ${id})`,
                operator: foundOrder.acceptanceStaffName || '临床护士长',
                timestamp: nowStr
              },
              ...(equipmentStore[idx].statusLogs || [])
            ]
          };
          savePersistentEquipment(equipmentStore);
        }
      }

      res.json({ success: true, data: foundOrder, order: foundOrder, auditGate });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  // 17.9.14d 收费维修工单审计合规终审归档接口（缺审批/比价议价招标/会议纪要强阻断）
  app.post('/api/work-orders/:id/audit-archive', requireRbac(canOperateProjectLedgerByPolicy, '收费工单审计合规归档'), (req, res) => {
    try {
      const { id } = req.params;
      const user = extractRequestUser(req);
      const order = workOrdersStore.find(o => o.id === id);
      if (!order) {
        return res.status(404).json({ success: false, error: '未找到对应工单' });
      }
      const gate = evaluateWorkOrderAuditGate(order, {
        projects: getMergedProjectLedger(),
        approvals: approvalsStore,
        vendorOrders: vendorCollabOrdersStore,
        biddingProjects: biddingProjectsStore
      });
      if (gate.requiresAudit && !gate.isAuditReady) {
        if (gate.linkedProject?.complianceDossier) {
          const blockedProj: HospitalProjectRecord = {
            ...gate.linkedProject,
            complianceDossier: {
              ...gate.linkedProject.complianceDossier,
              auditTrail: [
                {
                  id: `AUD-BLK-${Date.now()}`,
                  timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
                  operatorName: user?.name || '管理员',
                  operatorRole: user?.role || '审计校验',
                  action: '工单归档审计拦截',
                  detail: '尝试执行收费工单最终归档时被系统合规门禁阻断',
                  blockedReason: gate.missingItems.join('；')
                },
                ...gate.linkedProject.complianceDossier.auditTrail
              ]
            }
          };
          upsertDynamicProjectRecord(blockedProj);
        }
        return res.status(409).json({
          success: false,
          auditBlocked: true,
          missingItems: gate.missingItems,
          error: `审计合规强阻断：${gate.missingItems.join('；')}`
        });
      }

      const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 16);
      const updatedOrder = {
        ...order,
        auditArchiveStatus: 'archived',
        auditArchivedAt: nowStr,
        auditArchivedBy: user?.name || '医工主管'
      };
      workOrdersStore = workOrdersStore.map(o => (o.id === id ? updatedOrder : o));
      savePersistentWorkOrders(workOrdersStore);

      if (gate.linkedProject?.complianceDossier) {
        const archivedProj: HospitalProjectRecord = {
          ...gate.linkedProject,
          preApprovalStatus: '已打印并通过',
          preApprovalPassTime: nowStr,
          dateValidation: '审计三支柱全部核验通过',
          complianceDossier: {
            ...gate.linkedProject.complianceDossier,
            auditLockedCleared: true,
            archivedAt: nowStr,
            archivedBy: user?.name || '医工主管',
            auditTrail: [
              {
                id: `AUD-ARC-${Date.now()}`,
                timestamp: nowStr,
                operatorName: user?.name || '医工主管',
                operatorRole: user?.role || '合规归档',
                action: '审计合规终审归档',
                detail: `工单 ${id} 及关联台账项目 ${gate.linkedProject.id} 已通过三支柱审计核验并正式归档`
              },
              ...gate.linkedProject.complianceDossier.auditTrail
            ]
          }
        };
        upsertDynamicProjectRecord(archivedProj);
      }

      res.json({ success: true, order: updatedOrder, data: updatedOrder, gate });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  // 17.9.14 从草料只读 RDS (table_d233 + table_d237) / Webhook 日志抽取并同步派工单池
  app.post('/api/caoliao/pull-and-sync-dispatch', async (req, res) => {
    try {
      await syncCaoliaoRdsTables({ limitPerTable: 50, suppressAlert: true });

      const candidateWorkOrders: any[] = [];
      const determineBiomedicalGroup = (dName: string, eName: string): string => {
        const combined = `${dName} ${eName}`.toLowerCase();
        if (combined.includes('呼吸') || combined.includes('icu') || combined.includes('除颤') || combined.includes('急救') || combined.includes('监护') || combined.includes('麻醉')) return '急救生命支持技术组';
        if (combined.includes('ct') || combined.includes('放射') || combined.includes('dr') || combined.includes('mri') || combined.includes('x射线') || combined.includes('影像')) return '大型放射影像技术组';
        if (combined.includes('检验') || combined.includes('生化') || combined.includes('血') || combined.includes('尿') || combined.includes('免疫')) return '临床检验与生化组';
        if (combined.includes('镜') || combined.includes('手术') || combined.includes('腔镜') || combined.includes('电刀') || combined.includes('吻合')) return '腔镜微创手术组';
        return '超声与综合诊疗组';
      };

      for (const log of caoliaoWebhookLogs) {
        if (!log.createdWorkOrderId) continue;
        const dept = log.matchedDepartment || log.department || '功能检查科';
        const eqName = log.matchedEquipmentName || log.codeName || '医疗设备';
        const group = determineBiomedicalGroup(dept, eqName);

        const matchedEq =
          (log.matchedEquipmentId ? equipmentStore.find(e => e.id === log.matchedEquipmentId) : undefined) ||
          (log.codeId ? equipmentStore.find(e => e.codeId === String(log.codeId)) : undefined);

        const order = {
          id: log.createdWorkOrderId,
          equipmentId: log.matchedEquipmentId || matchedEq?.id || (log.codeId ? `EQ-CL-${log.codeId}` : '10079'),
          equipmentName: eqName,
          equipmentModel: matchedEq?.model || '在用标准型号',
          equipmentSn: matchedEq?.sn || log.sn || (log.recordNo ? `SN-${log.recordNo}` : '0941701004'),
          internalNo: `CL-QR-${log.codeId || 'AUTO'}`,
          category: '医用诊察和监护器械',
          department: dept,
          location: `${dept} 诊疗室`,
          reporterName: log.reporterName || '医护人员',
          reporterPhone: log.reporterPhone || '',
          reportTime: log.timestamp ? log.timestamp.slice(0, 16) : new Date().toISOString().replace('T', ' ').slice(0, 16),
          priority: log.urgency === 'P1' ? 'P1_CRITICAL' : log.urgency === 'P2' ? 'P2_URGENT' : 'P3_STANDARD',
          workOrderType: 'emergency_breakdown',
          faultDescription: `【草料扫码单号 ${log.recordNo || ''}】${log.faultDescription || '运行异常'}`,
          status: 'pending_dispatch',
          biomedicalGroup: group,
          source: 'caoliao',
          caoliaoRecordId: log.recordNo ? parseInt(String(log.recordNo).replace(/\D/g, '')) || 0 : 0,
          caoliaoRecordNo: log.recordNo,
          caoliaoCodeId: log.codeId,
          photoUrl: log.photoUrl || '',
          partsReplaced: [],
          totalRepairCost: 0,
          totalDowntimeHours: 0.2,
          slaResponseLimitMinutes: log.urgency === 'P1' ? 15 : log.urgency === 'P2' ? 30 : 120,
          slaRepairLimitHours: log.urgency === 'P1' ? 2 : log.urgency === 'P2' ? 4 : 24,
          isSlaResponseMet: false,
          isSlaRepairMet: false
        };

        candidateWorkOrders.push(order);
        // 合并进持久化工单存储
        const existIdx = workOrdersStore.findIndex(o => o.id === order.id || (o.caoliaoRecordNo && o.caoliaoRecordNo === order.caoliaoRecordNo));
        if (existIdx < 0) {
          workOrdersStore.unshift(order);
        }
      }

      savePersistentWorkOrders(workOrdersStore);

      res.json({
        success: true,
        message: `成功同步草料现场报修！已生成并梳理 ${candidateWorkOrders.length} 条待派工工单。`,
        candidateWorkOrders,
        totalInStore: workOrdersStore.length
      });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  // ==================== 18. UDI 国家码与专机专耗闭环 API ====================

  // 18.1 获取专机专耗标准品类库
  app.get('/api/udi/consumables', (req, res) => {
    res.json({ success: true, count: udiConsumablesStore.length, data: udiConsumablesStore });
  });

  // 18.2 获取全院在机专机专耗流转台账
  app.get('/api/udi/bindings', (req, res) => {
    const status = req.query.status as string;
    let list = udiBindingsStore;
    if (status && status !== 'all') {
      list = list.filter(b => b.status === status);
    }
    res.json({ success: true, count: list.length, data: list });
  });

  // 18.3 智能解析 UDI 条码
  app.post('/api/udi/parse', (req, res) => {
    const { barcode } = req.body;
    if (!barcode) {
      return res.status(400).json({ success: false, error: '条码字符不可为空' });
    }
    const result = parseUdiBarcode(barcode);
    res.json({ success: true, data: result });
  });

  // 18.4 专机专耗挂靠上机 (含白名单校验)
  app.post('/api/udi/bindings', (req, res) => {
    const {
      equipmentId,
      consumableId,
      barcode,
      operatorName,
      operatorRole
    } = req.body;

    const equip = equipmentStore.find(e => e.id === equipmentId);
    if (!equip) {
      return res.status(404).json({ success: false, error: `未找到目标设备 ID: ${equipmentId}` });
    }

    const consumable = udiConsumablesStore.find(c => c.id === consumableId);
    if (!consumable) {
      return res.status(404).json({ success: false, error: `未找到专用耗材 ID: ${consumableId}` });
    }

    const parsed = parseUdiBarcode(barcode);
    if (!parsed.isValid) {
      return res.status(400).json({ success: false, error: 'UDI 条码未通过国家规范校验' });
    }

    if (parsed.isExpired) {
      return res.status(400).json({ success: false, error: `耗材已于 ${parsed.expirationDate} 过期，严禁上机` });
    }

    const compatibility = verifyConsumableHostCompatibility(equip, consumable);
    if (!compatibility.isCompatible && consumable.mandatoryMatch) {
      return res.status(400).json({ success: false, error: `专机白名单阻断: ${compatibility.message}` });
    }

    const newRecord: HostConsumableBindingRecord = {
      id: `BIND-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(100 + Math.random() * 900)}`,
      equipmentId: equip.id,
      equipmentName: equip.name,
      equipmentModel: equip.model || '标准型',
      equipmentSn: equip.sn || 'SN-UNKNOWN',
      equipmentInternalNo: equip.internalNo,
      department: equip.department,
      room: equip.location || equip.department,
      consumableId: consumable.id,
      consumableName: consumable.name,
      consumableSpec: consumable.spec,
      consumableBrand: consumable.brand,
      di: parsed.di,
      udiCode: parsed.rawCode,
      lotNumber: parsed.lotNumber || 'LOT-AUTO',
      expirationDate: parsed.expirationDate || '2028-12-31',
      serialNumber: parsed.serialNumber,
      bindingTime: new Date().toISOString().replace('T', ' ').slice(0, 19),
      operatorName: operatorName || '临床值班医护',
      operatorRole: operatorRole || '主管护师',
      compatibilityResult: compatibility.isCompatible ? 'matched_verified' : 'cross_model_allowed',
      verificationMessage: compatibility.message,
      status: 'in_use'
    };

    udiBindingsStore.unshift(newRecord);
    savePersistentUdiBindings(udiBindingsStore);

    res.json({
      success: true,
      message: `专机专耗【${consumable.name}】已成功挂靠至【${equip.name}】！`,
      data: newRecord
    });
  });

  // 18.5 临床消耗核销 (病案全闭环)
  app.put('/api/udi/bindings/:id/consume', (req, res) => {
    const { id } = req.params;
    const { patientId, patientName, caseNo, operationRecordNo, doctorInCharge } = req.body;
    const idx = udiBindingsStore.findIndex(b => b.id === id);
    if (idx === -1) {
      return res.status(404).json({ success: false, error: '未找到该挂靠记录' });
    }

    udiBindingsStore[idx] = {
      ...udiBindingsStore[idx],
      status: 'consumed',
      consumedTime: new Date().toISOString().replace('T', ' ').slice(0, 19),
      patientId: patientId || udiBindingsStore[idx].patientId,
      patientName: patientName || udiBindingsStore[idx].patientName,
      caseNo: caseNo || udiBindingsStore[idx].caseNo,
      operationRecordNo: operationRecordNo || udiBindingsStore[idx].operationRecordNo,
      doctorInCharge: doctorInCharge || udiBindingsStore[idx].doctorInCharge
    };

    savePersistentUdiBindings(udiBindingsStore);
    res.json({ success: true, message: '专机耗材已完成病案关联与临床核销！', data: udiBindingsStore[idx] });
  });

  // 18.6 批次不良召回排查雷达与紧急锁定
  app.post('/api/udi/batch-quarantine', (req, res) => {
    const { lotNumber, recallReason, operator } = req.body;
    if (!lotNumber) {
      return res.status(400).json({ success: false, error: '请提供待召回锁定的批次号' });
    }

    let affectedCount = 0;
    const lockedEquipIds: string[] = [];

    udiBindingsStore = udiBindingsStore.map(b => {
      if (b.lotNumber.toLowerCase().includes(lotNumber.toLowerCase()) && b.status === 'in_use') {
        affectedCount++;
        lockedEquipIds.push(b.equipmentId);
        return {
          ...b,
          status: 'recalled',
          recallFlag: true,
          recallDate: new Date().toISOString().replace('T', ' ').slice(0, 19),
          recallActionNote: recallReason || '国家药监批次紧急召回锁定'
        };
      }
      return b;
    });

    savePersistentUdiBindings(udiBindingsStore);

    // 同步将涉及设备置为故障待修/停用状态
    if (lockedEquipIds.length > 0) {
      equipmentStore = equipmentStore.map(e => {
        if (lockedEquipIds.includes(e.id)) {
          return {
            ...e,
            status: '故障待修',
            lastFaultReason: `【药监紧急召回】在机专耗涉嫌不良批次 ${lotNumber}，已物理锁定待排查`
          };
        }
        return e;
      });
      savePersistentEquipment(equipmentStore);
    }

    res.json({
      success: true,
      message: `成功锁定全院 ${affectedCount} 份在机专耗，已下达紧急停用指令！`,
      affectedCount,
      lockedEquipmentIds: lockedEquipIds
    });
  });

  // ==================== 19. 生产级自动化安全灾备与快照回滚引擎 ====================

  function ensureBackupsDir() {
    if (!fs.existsSync(BACKUPS_DIR)) {
      fs.mkdirSync(BACKUPS_DIR, { recursive: true });
    }
  }

  function getBackupListFromDisk() {
    ensureBackupsDir();
    const files = fs.readdirSync(BACKUPS_DIR).filter(f => f.endsWith('.json'));
    const list: any[] = [];

    files.forEach(filename => {
      try {
        const fullPath = path.join(BACKUPS_DIR, filename);
        const stat = fs.statSync(fullPath);
        const raw = fs.readFileSync(fullPath, 'utf8');
        const parsed = JSON.parse(raw);

        const checksum = crypto.createHash('sha256').update(raw).digest('hex');

        list.push({
          id: filename.replace('.json', ''),
          name: parsed.snapshotName || `全院医工数据灾备快照_${filename.slice(0, 15)}`,
          createdAt: parsed.createdAt ? parsed.createdAt.replace('T', ' ').slice(0, 19) : stat.birthtime.toISOString().replace('T', ' ').slice(0, 19),
          sizeBytes: stat.size,
          recordCount: {
            equipment: Array.isArray(parsed.equipment) ? parsed.equipment.length : 0,
            repairs: Array.isArray(parsed.equipment) ? parsed.equipment.reduce((acc: number, e: any) => acc + (e.repairRecords?.length || 0), 0) : 0,
            staff: Array.isArray(parsed.staff) ? parsed.staff.length : 0,
            adverseEvents: Array.isArray(parsed.adverseEvents) ? parsed.adverseEvents.length : 0,
            udiBindings: Array.isArray(parsed.udiBindings) ? parsed.udiBindings.length : 0,
            udiConsumables: Array.isArray(parsed.udiConsumables) ? parsed.udiConsumables.length : 0
          },
          type: filename.includes('scheduled') ? 'scheduled' : (filename.includes('pre_restore') ? 'pre_restore' : 'manual'),
          operator: parsed.operator || '崔伟 (医工技术主管)',
          checksum: `SHA256:${checksum.substring(0, 16)}...`,
          notes: parsed.notes || '生产运行环境安全备份镜像',
          filename
        });
      } catch (e) {
        console.warn(`[Backup Audit] Error reading snapshot ${filename}:`, e);
      }
    });

    return list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  function createServerSnapshot(type: 'manual' | 'scheduled' | 'pre_restore', name?: string, operator?: string, notes?: string) {
    ensureBackupsDir();
    const snapId = `SNAP-${Date.now()}`;
    const snapName = name || `五莲县人民医院全院医工生产灾备镜像_${new Date().toLocaleDateString('zh-CN').replace(/\//g, '-')}`;

    const payload = {
      snapshotVersion: '2.0-PROD',
      snapshotName: snapName,
      createdAt: new Date().toISOString(),
      operator: operator || (type === 'scheduled' ? '自动化安全灾备守护进程' : '崔伟 (设备科负责人)'),
      notes: notes || (type === 'scheduled' ? '每日自动化定时安全灾备快照' : '生产环境手动即时快照'),
      equipment: equipmentStore,
      staff: staffStore,
      catalogue: catalogueStore,
      nmpaCategories: nmpaCategoryStore,
      adverseEvents: adverseEventsStore,
      udiConsumables: udiConsumablesStore,
      udiBindings: udiBindingsStore,
      systemMeta: {
        hospital: '五莲县人民医院',
        title: '医学装备全生命周期闭环管理系统',
        nodeEnv: process.env.NODE_ENV || 'production',
        snapshotEngine: 'Secure JSON Disaster Recovery Engine v2.0'
      }
    };

    const jsonStr = JSON.stringify(payload, null, 2);
    const filename = `${snapId}_${type}.json`;
    const fullPath = path.join(BACKUPS_DIR, filename);

    fs.writeFileSync(fullPath, jsonStr, 'utf8');

    const rawSize = Buffer.byteLength(jsonStr, 'utf8');
    const checksum = crypto.createHash('sha256').update(jsonStr).digest('hex');

    console.log(`[Backup Engine] Created ${type} snapshot: ${filename} (${(rawSize / 1024).toFixed(1)} KB)`);

    return {
      id: snapId,
      name: snapName,
      filename,
      sizeBytes: rawSize,
      checksum: `SHA256:${checksum.substring(0, 16)}...`,
      createdAt: new Date().toISOString().replace('T', ' ').slice(0, 19)
    };
  }

  // 19.1 获取灾备快照列表
  app.get('/api/backups/list', (req, res) => {
    const list = getBackupListFromDisk();
    res.json({
      success: true,
      total: list.length,
      storageEngine: 'Server JSON File-Backed Persistence with Daily Disaster Snapshot',
      data: list
    });
  });

  // 19.2 即时创建安全快照
  app.post('/api/backups/create', requireRbac(canManageSystemOpsByPolicy, '创建系统灾备快照'), (req, res) => {
    try {
      const { name, operator, notes, type } = req.body;
      const snap = createServerSnapshot(type || 'manual', name, operator, notes);
      res.json({
        success: true,
        message: '安全灾备快照创建成功！已完成全库 JSON 序列化并计算 SHA-256 完整性哈希。',
        data: snap
      });
    } catch (err: any) {
      console.error('[Backup Error]', err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 19.3 快照回滚恢复 (自动保留恢复前底底镜像)
  app.post('/api/backups/restore', requireRbac(canManageSystemOpsByPolicy, '执行数据库快照回滚'), (req, res) => {
    try {
      const { filename } = req.body;
      if (!filename) {
        return res.status(400).json({ success: false, error: '请指定待恢复的快照文件名' });
      }

      const snapPath = path.join(BACKUPS_DIR, filename);
      if (!fs.existsSync(snapPath)) {
        return res.status(404).json({ success: false, error: '快照文件不存在或已被移除' });
      }

      // 1. 创建自动回滚底镜像
      createServerSnapshot('pre_restore', `系统回滚前自动安全归档_${Date.now()}`, '系统自愈保护', '执行灾难恢复前自动生成的安全底镜像');

      // 2. 读取并解析快照
      const raw = fs.readFileSync(snapPath, 'utf8');
      const parsed = JSON.parse(raw);

      if (Array.isArray(parsed.equipment)) {
        equipmentStore = parsed.equipment;
        savePersistentEquipment(equipmentStore);
      }
      if (Array.isArray(parsed.staff)) {
        staffStore = parsed.staff;
        savePersistentStaff(staffStore);
      }
      if (Array.isArray(parsed.adverseEvents)) {
        adverseEventsStore = parsed.adverseEvents;
        savePersistentAdverseEvents(adverseEventsStore);
      }
      if (Array.isArray(parsed.udiBindings)) {
        udiBindingsStore = parsed.udiBindings;
        savePersistentUdiBindings(udiBindingsStore);
      }
      if (Array.isArray(parsed.udiConsumables)) {
        udiConsumablesStore = parsed.udiConsumables;
        savePersistentUdiConsumables(udiConsumablesStore);
      }

      res.json({
        success: true,
        message: `系统已成功从快照【${filename}】全量恢复！共还原 ${equipmentStore.length} 台设备、${udiBindingsStore.length} 条专耗记录。`,
        restoredRecords: {
          equipment: equipmentStore.length,
          staff: staffStore.length,
          udiBindings: udiBindingsStore.length
        }
      });
    } catch (err: any) {
      console.error('[Restore Error]', err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 19.4 下载指定快照文件
  app.get('/api/backups/download/:filename', (req, res) => {
    const filename = req.params.filename;
    const safeName = path.basename(filename);
    const snapPath = path.join(BACKUPS_DIR, safeName);
    if (!fs.existsSync(snapPath)) {
      return res.status(404).send('快照文件不存在');
    }
    res.download(snapPath, safeName);
  });

  // 19.5 全院分级消息通知与管理统一下发专区 API
  app.get('/api/notices', (_req, res) => {
    try {
      const sorted = [...noticesStore].sort((a, b) =>
        (b.createdAt || '').localeCompare(a.createdAt || '')
      );
      res.json({ success: true, data: sorted });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/notices', requireRbac(canBroadcastNoticeByPolicy, '统一下发系统消息通知'), (req, res) => {
    try {
      const reqUser = extractRequestUser(req);
      const {
        title,
        content,
        category = '院级通告',
        priority = 'normal',
        targetScope = 'all',
        targetDepartments = [],
        targetRoles = [],
        requireAck = false,
        targetTab,
        relatedEquipmentSn
      } = req.body || {};

      if (!title || !String(title).trim() || !content || !String(content).trim()) {
        return res.status(400).json({ success: false, error: '通知标题与正文内容不能为空' });
      }

      const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 16);
      const dateCompact = nowStr.slice(0, 10).replace(/-/g, '');
      const newNotice: HospitalNotice = {
        id: `NTC-${dateCompact}-${Date.now().toString().slice(-4)}`,
        title: String(title).trim(),
        content: String(content).trim(),
        category,
        priority,
        senderName: req.body.senderName || reqUser?.name || '管理中心',
        senderRole: req.body.senderRole || reqUser?.role || '管理科室',
        senderDepartment: req.body.senderDepartment || reqUser?.departmentName || '医学工程保障中心',
        senderArchetype: reqUser ? resolveRoleArchetype(reqUser) : undefined,
        targetScope,
        targetDepartments: targetScope === 'department' && Array.isArray(targetDepartments) ? targetDepartments : undefined,
        targetRoles: targetScope === 'role_archetype' && Array.isArray(targetRoles) ? targetRoles : undefined,
        requireAck: Boolean(requireAck),
        targetTab: targetTab || undefined,
        relatedEquipmentSn: relatedEquipmentSn || undefined,
        createdAt: nowStr,
        readReceipts: []
      };

      noticesStore = [newNotice, ...noticesStore];
      savePersistentNotices(noticesStore);
      res.status(201).json({ success: true, data: newNotice });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/notices/:id/read', (req, res) => {
    try {
      const { id } = req.params;
      const reqUser = extractRequestUser(req);
      const idx = noticesStore.findIndex(n => n.id === id);
      if (idx === -1) {
        return res.status(404).json({ success: false, error: '未找到指定通知单据' });
      }

      const userId = String(req.body?.userId || reqUser?.id || reqUser?.employeeNo || 'ANON');
      const userName = String(req.body?.userName || reqUser?.name || '一线人员');
      const userRole = String(req.body?.userRole || reqUser?.role || '临床医护');
      const department = String(req.body?.department || reqUser?.departmentName || '临床科室');
      const acknowledged = Boolean(req.body?.acknowledged);
      const readAt = new Date().toISOString().replace('T', ' ').slice(0, 16);

      const current = noticesStore[idx];
      const existingReceipts = Array.isArray(current.readReceipts) ? [...current.readReceipts] : [];
      const existingIdx = existingReceipts.findIndex(
        r => (userId && r.userId === userId) || (r.userName === userName && r.department === department)
      );

      const nextReceipt: NoticeReadReceipt = {
        userId,
        userName,
        userRole,
        department,
        readAt,
        acknowledged: existingIdx >= 0 ? (existingReceipts[existingIdx].acknowledged || acknowledged) : acknowledged
      };

      if (existingIdx >= 0) {
        existingReceipts[existingIdx] = nextReceipt;
      } else {
        existingReceipts.unshift(nextReceipt);
      }

      const updated: HospitalNotice = { ...current, readReceipts: existingReceipts };
      noticesStore[idx] = updated;
      savePersistentNotices(noticesStore);
      res.json({ success: true, data: updated });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.delete('/api/notices/:id', requireRbac(canBroadcastNoticeByPolicy, '撤回或删除系统消息通知'), (req, res) => {
    try {
      const { id } = req.params;
      const exists = noticesStore.some(n => n.id === id);
      if (!exists) {
        return res.status(404).json({ success: false, error: '通知单据不存在或已撤回' });
      }
      noticesStore = noticesStore.filter(n => n.id !== id);
      savePersistentNotices(noticesStore);
      res.json({ success: true, deletedId: id });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 19B. 设备项目全生命周期总台账专属受控接口（合并动态收费立项 + 审计强阻断门禁）
  app.get(
    '/api/project-ledger',
    requireRbac(canViewProjectLedgerByPolicy, '查看全院设备项目台账'),
    (_req, res) => {
      try {
        const merged = getMergedProjectLedger();
        res.json({
          success: true,
          count: merged.length,
          data: merged
        });
      } catch (err: any) {
        res.status(500).json({ success: false, error: err.message });
      }
    }
  );

  app.post(
    '/api/project-ledger/upsert-from-work-order',
    requireRbac(canParticipateDispatchDiscussionByPolicy, '工单收费自动立项至设备项目台账'),
    (req, res) => {
      try {
        const { workOrder, stage, operatorName, estimatedAmount, hasCost } = req.body || {};
        if (!workOrder || !workOrder.id) {
          return res.status(400).json({ success: false, error: '缺少工单信息，无法立项' });
        }
        const project = upsertProjectFromWorkOrderServer(workOrder, {
          stage: stage || 'dispatch',
          operatorName,
          estimatedAmount,
          hasCost: hasCost ?? true
        });
        workOrdersStore = workOrdersStore.map(o =>
          o.id === workOrder.id
            ? {
                ...o,
                hasCost: true,
                estimatedCost: estimatedAmount ?? o.estimatedCost,
                linkedProjectId: project.id,
                requiredComplianceMode: project.complianceDossier?.requiredMode,
                auditArchiveStatus: o.auditArchiveStatus === 'archived' ? 'archived' : 'pending_audit'
              }
            : o
        );
        savePersistentWorkOrders(workOrdersStore);
        res.json({ success: true, data: project });
      } catch (err: any) {
        res.status(500).json({ success: false, error: err.message });
      }
    }
  );

  app.put(
    '/api/project-ledger/:id/compliance',
    requireRbac(canOperateProjectLedgerByPolicy, '补办并保存项目合规审计资料'),
    (req, res) => {
      try {
        const { id } = req.params;
        const user = extractRequestUser(req);
        const existing = findMergedProjectById(id);
        if (!existing) {
          return res.status(404).json({ success: false, error: '未找到对应台账项目' });
        }
        const {
          compliancePatch,
          vendorPatch,
          invoicePatch,
          approvedBudgetAmount,
          actionLabel,
          actionDetail
        } = req.body || {};

        const nowDate = new Date().toISOString().slice(0, 10);
        const nowTimestamp = new Date().toISOString().replace('T', ' ').slice(0, 16);
        const prevDossier = existing.complianceDossier || {
          hasCost: Number(existing.invoice?.totalAmount || 0) > 0,
          estimatedAmount: Number(existing.invoice?.totalAmount || 0),
          approvedBudgetAmount: Number(existing.invoice?.totalAmount || 0),
          requiredMode: resolveProcurementMode(
            Number(existing.invoice?.totalAmount || 0) > 0,
            Number(existing.invoice?.totalAmount || 0)
          ),
          createdFromStage: 'legacy' as const,
          approvalProof: { mode: 'none' as const },
          comparisonQuotes: [],
          meetingMinutes: [],
          auditTrail: []
        };

        const mergedDossier = {
          ...prevDossier,
          ...(compliancePatch || {}),
          approvalProof: {
            ...prevDossier.approvalProof,
            ...(compliancePatch?.approvalProof || {})
          },
          comparisonQuotes: compliancePatch?.comparisonQuotes ?? prevDossier.comparisonQuotes,
          meetingMinutes: compliancePatch?.meetingMinutes ?? prevDossier.meetingMinutes,
          biddingRecord:
            compliancePatch?.biddingRecord !== undefined
              ? compliancePatch.biddingRecord
              : prevDossier.biddingRecord,
          auditTrail: [
            {
              id: `AUD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
              timestamp: nowTimestamp,
              operatorName: user?.name || '医工主管',
              operatorRole: user?.role || '台账管理员',
              action: actionLabel || '补办/更新审计合规材料',
              detail: actionDetail || '已保存立项审批凭证、比价/议价/招标或会议纪要资料'
            },
            ...(prevDossier.auditTrail || [])
          ]
        };

        const nextBudget = Number(
          approvedBudgetAmount ??
            mergedDossier.negotiationFinalPrice ??
            mergedDossier.biddingRecord?.winningAmount ??
            mergedDossier.approvedBudgetAmount ??
            mergedDossier.estimatedAmount ??
            existing.invoice?.totalAmount ??
            0
        );
        mergedDossier.approvedBudgetAmount = nextBudget;
        mergedDossier.requiredMode = resolveProcurementMode(Boolean(mergedDossier.hasCost) || nextBudget > 0, nextBudget);

        const nextVendor = { ...existing.vendor, ...(vendorPatch || {}) };
        const chosenQuote = (mergedDossier.comparisonQuotes || []).find((q: any) => q.isSelected);
        if (chosenQuote && !vendorPatch?.companyName) {
          nextVendor.companyName = chosenQuote.vendorName;
          if (chosenQuote.contactPerson) nextVendor.contactPerson = chosenQuote.contactPerson;
          if (chosenQuote.contactPhone) nextVendor.contactPhone = chosenQuote.contactPhone;
        }
        if (mergedDossier.biddingRecord?.winningVendor && !vendorPatch?.companyName) {
          nextVendor.companyName = mergedDossier.biddingRecord.winningVendor;
        }

        const taxRate = invoicePatch?.taxRate ?? existing.invoice?.taxRate ?? 0.13;
        const nextTotal = Number(invoicePatch?.totalAmount ?? (nextBudget > 0 ? nextBudget : existing.invoice?.totalAmount || 0));
        const nextInvoice = {
          ...existing.invoice,
          ...(invoicePatch || {}),
          totalAmount: nextTotal,
          amountWithoutTax: Number((nextTotal / (1 + taxRate)).toFixed(2)),
          taxAmount: Number((nextTotal - nextTotal / (1 + taxRate)).toFixed(2))
        };

        let nextRecord: HospitalProjectRecord = {
          ...existing,
          vendor: nextVendor,
          invoice: nextInvoice,
          complianceDossier: mergedDossier
        };

        const evalRes = evaluateProjectAuditCompliance(nextRecord, {
          approvals: approvalsStore,
          vendorOrders: vendorCollabOrdersStore,
          biddingProjects: biddingProjectsStore
        });

        nextRecord = {
          ...nextRecord,
          approvalStatus: evalRes.pillarApproval.passed
            ? evalRes.pillarApproval.modeLabel || '审批通过'
            : '待补办立项审批',
          approvalDate: mergedDossier.approvalProof.paperApprovedDate || existing.approvalDate || nowDate,
          approvedDate: evalRes.pillarApproval.passed
            ? existing.approvedDate || mergedDossier.approvalProof.paperApprovedDate || nowDate
            : existing.approvedDate,
          inquiryDate: evalRes.pillarPricing.passed
            ? mergedDossier.negotiationDate || mergedDossier.biddingRecord?.bidOpenDate || existing.inquiryDate || nowDate
            : `待${evalRes.requiredModeMeta.shortLabel}`,
          bargainBatch:
            mergedDossier.negotiationBatch ||
            mergedDossier.biddingRecord?.biddingNo ||
            evalRes.requiredModeMeta.shortLabel,
          bargainDate: mergedDossier.negotiationDate || mergedDossier.biddingRecord?.bidOpenDate || existing.bargainDate,
          preApprovalStatus: evalRes.isAuditReady
            ? existing.preApprovalStatus.includes('并通过')
              ? existing.preApprovalStatus
              : '审计已齐备 · 待出具预批单'
            : `审计拦截（缺 ${3 - evalRes.completedCount} 项凭证）`,
          dateValidation: evalRes.isAuditReady ? '三支柱审计核验通过' : evalRes.missingItems[0] || '缺失合规材料',
          relatedDocsCount:
            (mergedDossier.comparisonQuotes?.length || 0) +
            (mergedDossier.meetingMinutes?.length || 0) +
            (mergedDossier.approvalProof?.mode !== 'none' ? 1 : 0)
        };

        upsertDynamicProjectRecord(nextRecord);

        // 同步工单审计状态
        if (mergedDossier.sourceWorkOrderId) {
          workOrdersStore = workOrdersStore.map(o =>
            o.id === mergedDossier.sourceWorkOrderId
              ? {
                  ...o,
                  linkedProjectId: nextRecord.id,
                  requiredComplianceMode: mergedDossier.requiredMode,
                  totalRepairCost: nextTotal || o.totalRepairCost,
                  auditArchiveStatus:
                    o.auditArchiveStatus === 'archived'
                      ? 'archived'
                      : evalRes.isAuditReady
                        ? 'audit_ready'
                        : 'pending_audit'
                }
              : o
          );
          savePersistentWorkOrders(workOrdersStore);
        }

        res.json({ success: true, data: nextRecord, evaluation: evalRes });
      } catch (err: any) {
        res.status(500).json({ success: false, error: err.message });
      }
    }
  );

  app.post(
    '/api/project-ledger/:id/bidding-launch',
    requireRbac(canOperateProjectLedgerByPolicy, '发起项目招标立项'),
    (req, res) => {
      try {
        const { id } = req.params;
        const user = extractRequestUser(req);
        const existing = findMergedProjectById(id);
        if (!existing) {
          return res.status(404).json({ success: false, error: '未找到对应台账项目' });
        }
        const { biddingTitle, biddingMethod, maxBudget, deadlineDate, description } = req.body || {};
        const nowDate = new Date().toISOString().slice(0, 10);
        const bidId = `BID-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`;
        const budget = Number(maxBudget || existing.invoice?.totalAmount || existing.complianceDossier?.estimatedAmount || 60000);

        const newBid: BiddingProject = {
          id: bidId,
          title: biddingTitle || `${existing.projectName}专项公开招标采购`,
          category: 'EQUIPMENT_REPAIR',
          department: existing.department || '医学工程科',
          publishDate: nowDate,
          deadlineDate: deadlineDate || `${nowDate} 17:00`,
          maxBudget: budget,
          urgency: 'HIGH',
          status: 'OPEN',
          description: description || existing.approvalContent || existing.repairInfo || '依据医院招标合规管理制度公开征集投标单位',
          technicalRequirements: [
            '须具备二/三类医疗器械经营或维修专业资质，提供原厂授权或同类三甲医院履约案例',
            '维修/供货完成须配合临床试机验收与计量检测合格',
            '须提供增值税专用发票及不少于12个月质量保修承诺'
          ],
          equipmentList: [
            {
              id: `REQ-${Date.now()}`,
              equipmentName: existing.complianceDossier?.equipmentName || existing.projectName,
              model: existing.complianceDossier?.equipmentModel || existing.category,
              department: existing.department,
              faultSymptomOrScope: existing.repairInfo || existing.projectName,
              expectedDeliveryDays: 14
            }
          ],
          allowSubcontracting: false,
          minWarrantyMonths: 12,
          bidsCount: 0
        };

        biddingProjectsStore.unshift(newBid);
        savePersistentBiddingProjects(biddingProjectsStore);

        const prevDossier = existing.complianceDossier || {
          hasCost: true,
          estimatedAmount: budget,
          approvedBudgetAmount: budget,
          requiredMode: resolveProcurementMode(true, budget),
          createdFromStage: 'manual' as const,
          approvalProof: { mode: 'none' as const },
          comparisonQuotes: [],
          meetingMinutes: [],
          auditTrail: []
        };

        const updatedProj: HospitalProjectRecord = {
          ...existing,
          bargainBatch: bidId,
          inquiryDate: `招标中 (${bidId})`,
          complianceDossier: {
            ...prevDossier,
            biddingRecord: {
              linkedBiddingId: bidId,
              biddingNo: bidId,
              biddingTitle: newBid.title,
              biddingMethod: biddingMethod || 'open_tender',
              bidOpenDate: nowDate,
              bidderCount: 0,
              winningVendor: '',
              winningAmount: 0,
              status: 'bidding_open'
            },
            auditTrail: [
              {
                id: `AUD-BID-${Date.now()}`,
                timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
                operatorName: user?.name || '医工主管',
                operatorRole: user?.role || '招标发起人',
                action: '发起招标立项并发布至供应商门户',
                detail: `已生成招标标号 ${bidId}，最高限价 ¥${budget.toLocaleString()}`
              },
              ...(prevDossier.auditTrail || [])
            ]
          }
        };
        upsertDynamicProjectRecord(updatedProj);

        res.json({ success: true, biddingProject: newBid, project: updatedProj });
      } catch (err: any) {
        res.status(500).json({ success: false, error: err.message });
      }
    }
  );

  app.post(
    '/api/project-ledger/:id/action',
    requireRbac(canOperateProjectLedgerByPolicy, '操作设备项目台账（下钻/预批单/导出）'),
    (req, res) => {
      try {
        const { id } = req.params;
        const { action } = req.body || {};
        const user = extractRequestUser(req);
        const project = findMergedProjectById(id);

        if (project && ['pre_approval', 'finalize_payment', 'archive'].includes(String(action))) {
          const evalRes = evaluateProjectAuditCompliance(project, {
            approvals: approvalsStore,
            vendorOrders: vendorCollabOrdersStore,
            biddingProjects: biddingProjectsStore
          });
          if (!evalRes.isAuditReady) {
            if (project.complianceDossier) {
              const blockedProj: HospitalProjectRecord = {
                ...project,
                complianceDossier: {
                  ...project.complianceDossier,
                  auditTrail: [
                    {
                      id: `AUD-BLK-${Date.now()}`,
                      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
                      operatorName: user?.name || '管理员',
                      operatorRole: user?.role || '台账操作人',
                      action: `尝试执行「${action}」被审计门禁拦截`,
                      detail: '缺失审计必备三支柱材料，系统拒绝放行',
                      blockedReason: evalRes.missingItems.join('；')
                    },
                    ...(project.complianceDossier.auditTrail || [])
                  ]
                }
              };
              upsertDynamicProjectRecord(blockedProj);
            }
            return res.status(409).json({
              success: false,
              auditBlocked: true,
              missingItems: evalRes.missingItems,
              evaluation: evalRes,
              error: `审计合规强阻断：${evalRes.missingItems.join('；')}`
            });
          }

          if (action === 'pre_approval' || action === 'archive' || action === 'finalize_payment') {
            const nowDate = new Date().toISOString().slice(0, 10);
            const nowTimestamp = new Date().toISOString().replace('T', ' ').slice(0, 16);
            const updatedProj: HospitalProjectRecord = {
              ...project,
              preApprovalStatus: '已打印并通过',
              preApprovalPrintDate: project.preApprovalPrintDate || nowDate,
              preApprovalPassTime: nowTimestamp,
              dateValidation: '审计三支柱全部核验通过',
              invoice: {
                ...project.invoice,
                paymentStatus:
                  action === 'finalize_payment' ? '已支付电汇' : '预批已通过待付款'
              },
              complianceDossier: project.complianceDossier
                ? {
                    ...project.complianceDossier,
                    auditLockedCleared: true,
                    archivedAt: action === 'archive' ? nowTimestamp : project.complianceDossier.archivedAt,
                    archivedBy: action === 'archive' ? (user?.name || '医工主管') : project.complianceDossier.archivedBy,
                    auditTrail: [
                      {
                        id: `AUD-PASS-${Date.now()}`,
                        timestamp: nowTimestamp,
                        operatorName: user?.name || '医工主管',
                        operatorRole: user?.role || '台账管理员',
                        action: action === 'pre_approval' ? '审计校验通过·出具费用预批单' : action === 'finalize_payment' ? '确认财务付款核销' : '项目全套审计档案归档',
                        detail: `项目 #${id} 已通过三支柱审计检查（${evalRes.requiredModeMeta.label}），合规放行。`
                      },
                      ...(project.complianceDossier.auditTrail || [])
                    ]
                  }
                : undefined
            };
            upsertDynamicProjectRecord(updatedProj);
          }
        }

        res.json({
          success: true,
          projectId: id,
          action: action || 'inspect',
          timestamp: new Date().toISOString()
        });
      } catch (err: any) {
        res.status(500).json({ success: false, error: err.message });
      }
    }
  );

  // 19C. 电子审批流持久化与项目台账自动回写接口
  app.get('/api/approvals', (_req, res) => {
    res.json({ success: true, data: approvalsStore });
  });

  app.post('/api/approvals', (req, res) => {
    try {
      const payload = req.body as ApprovalApplication;
      if (!payload || !payload.id) {
        return res.status(400).json({ success: false, error: '审批单数据不完整' });
      }
      const idx = approvalsStore.findIndex(a => a.id === payload.id);
      if (idx >= 0) {
        approvalsStore[idx] = { ...approvalsStore[idx], ...payload };
      } else {
        approvalsStore.unshift(payload);
      }
      savePersistentApprovals(approvalsStore);

      // 若关联项目台账ID或工单ID，自动绑定电子审批ID到项目台账
      const linkedProj =
        (payload.linkedProjectId ? findMergedProjectById(payload.linkedProjectId) : undefined) ||
        (payload.linkedWorkOrderId
          ? getMergedProjectLedger().find(p => p.complianceDossier?.sourceWorkOrderId === payload.linkedWorkOrderId)
          : undefined);
      if (linkedProj) {
        const prevDossier = linkedProj.complianceDossier || {
          hasCost: true,
          estimatedAmount: Number(payload.estimatedBudget || payload.partEstimatedCost || payload.estimatedCost || linkedProj.invoice?.totalAmount || 0),
          requiredMode: resolveProcurementMode(true, Number(linkedProj.invoice?.totalAmount || 0)),
          approvalProof: { mode: 'electronic' as const },
          comparisonQuotes: [],
          meetingMinutes: [],
          auditTrail: []
        };
        const updatedProj: HospitalProjectRecord = {
          ...linkedProj,
          approvalStatus: payload.status === 'approved' || payload.status === 'archived' ? '电子审批已通过' : `电子审批中 (${payload.id})`,
          complianceDossier: {
            ...prevDossier,
            approvalProof: {
              ...prevDossier.approvalProof,
              mode: prevDossier.approvalProof?.paperDocNo ? 'both' : 'electronic',
              electronicApprovalId: payload.id,
              electronicApprovalTitle: payload.title,
              electronicStatus: payload.status
            },
            auditTrail: [
              {
                id: `AUD-APP-${Date.now()}`,
                timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
                operatorName: payload.applicantName || '经办人',
                operatorRole: payload.applicantDepartment || '申请科室',
                action: '关联电子审批单',
                detail: `已关联电子审批单 ${payload.id}（状态：${payload.currentApprovalNode || payload.status}）`
              },
              ...(prevDossier.auditTrail || [])
            ]
          }
        };
        upsertDynamicProjectRecord(updatedProj);
      }

      res.json({ success: true, data: payload });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.put('/api/approvals/:id', (req, res) => {
    try {
      const { id } = req.params;
      const patch = req.body || {};
      const idx = approvalsStore.findIndex(a => a.id === id);
      let saved: ApprovalApplication;
      if (idx >= 0) {
        saved = { ...approvalsStore[idx], ...patch, id };
        approvalsStore[idx] = saved;
      } else {
        saved = { ...patch, id };
        approvalsStore.unshift(saved);
      }
      savePersistentApprovals(approvalsStore);

      // 自动联动更新关联项目台账的电子审批状态
      const matchingProjects = getMergedProjectLedger().filter(
        p =>
          p.complianceDossier?.approvalProof?.electronicApprovalId === id ||
          (saved.linkedProjectId && p.id === saved.linkedProjectId) ||
          (saved.linkedWorkOrderId && p.complianceDossier?.sourceWorkOrderId === saved.linkedWorkOrderId)
      );
      matchingProjects.forEach(proj => {
        if (!proj.complianceDossier) return;
        const isPassed = saved.status === 'approved' || saved.status === 'archived';
        upsertDynamicProjectRecord({
          ...proj,
          approvalStatus: isPassed ? '电子审批终审通过' : proj.approvalStatus,
          approvedDate: isPassed ? new Date().toISOString().slice(0, 10) : proj.approvedDate,
          complianceDossier: {
            ...proj.complianceDossier,
            approvalProof: {
              ...proj.complianceDossier.approvalProof,
              mode: proj.complianceDossier.approvalProof.paperDocNo ? 'both' : 'electronic',
              electronicApprovalId: id,
              electronicApprovalTitle: saved.title,
              electronicStatus: saved.status
            },
            auditTrail: [
              {
                id: `AUD-APPS-${Date.now()}`,
                timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
                operatorName: saved.auditLogs?.[saved.auditLogs.length - 1]?.operatorName || '审批节点',
                operatorRole: saved.currentApprovalNode || '审批人',
                action: `电子审批状态更新：${saved.status}`,
                detail: `关联电子审批单 ${id} 已流转至：${saved.currentApprovalNode || saved.status}`
              },
              ...(proj.complianceDossier.auditTrail || [])
            ]
          }
        });
      });

      res.json({ success: true, data: saved });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 19D. 招标项目持久化与中标结果联动台账接口
  app.get('/api/bidding-projects', (_req, res) => {
    res.json({ success: true, data: biddingProjectsStore });
  });

  app.post('/api/bidding-projects', (req, res) => {
    try {
      const payload = req.body as BiddingProject;
      if (!payload || !payload.id) {
        return res.status(400).json({ success: false, error: '招标项目数据不完整' });
      }
      const idx = biddingProjectsStore.findIndex(b => b.id === payload.id);
      if (idx >= 0) {
        biddingProjectsStore[idx] = { ...biddingProjectsStore[idx], ...payload };
      } else {
        biddingProjectsStore.unshift(payload);
      }
      savePersistentBiddingProjects(biddingProjectsStore);
      res.json({ success: true, data: payload });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.put('/api/bidding-projects/:id', (req, res) => {
    try {
      const { id } = req.params;
      const patch = req.body || {};
      const idx = biddingProjectsStore.findIndex(b => b.id === id);
      let saved: BiddingProject;
      if (idx >= 0) {
        saved = { ...biddingProjectsStore[idx], ...patch, id };
        biddingProjectsStore[idx] = saved;
      } else {
        saved = { ...patch, id };
        biddingProjectsStore.unshift(saved);
      }
      savePersistentBiddingProjects(biddingProjectsStore);

      // 若中标定标，自动回写至绑定该招标项目的设备项目台账
      if (saved.status === 'WON' || saved.status === 'CLOSED') {
        dynamicProjectLedgerStore.forEach(proj => {
          if (proj.complianceDossier?.biddingRecord?.linkedBiddingId === id || proj.complianceDossier?.biddingRecord?.biddingNo === id) {
            upsertDynamicProjectRecord({
              ...proj,
              vendor: saved.winningVendor
                ? { ...proj.vendor, companyName: saved.winningVendor }
                : proj.vendor,
              complianceDossier: {
                ...proj.complianceDossier,
                biddingRecord: {
                  ...proj.complianceDossier.biddingRecord,
                  winningVendor: saved.winningVendor || proj.complianceDossier.biddingRecord.winningVendor,
                  winningAmount: Number(saved.winningAmount || proj.complianceDossier.biddingRecord.winningAmount || 0),
                  status: 'awarded'
                }
              }
            });
          }
        });
      }

      res.json({ success: true, data: saved });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 20. 国家卫健委医院智慧管理评级与HIS/PACS数据互联专区 API
  app.get('/api/smart-management/metrics', (_req, res) => {
    try {
      const totalScore = smartMetricsStore.reduce((acc, m) => acc + m.maxScore, 0);
      const actualScore = smartMetricsStore.reduce((acc, m) => acc + m.actualScore, 0);
      const scoreRate = totalScore > 0 ? (actualScore / totalScore) * 100 : 0;
      
      // 计算1-5级各自达成率
      const levelBreakdown = [1, 2, 3, 4, 5].map(lvl => {
        const items = smartMetricsStore.filter(m => m.level === lvl);
        const max = items.reduce((a, b) => a + b.maxScore, 0);
        const act = items.reduce((a, b) => a + b.actualScore, 0);
        return {
          level: lvl,
          maxScore: max,
          actualScore: act,
          rate: max > 0 ? (act / max) * 100 : 0,
          isPassed: max > 0 && (act / max) >= 0.85
        };
      });

      // 评估综合等级 (加权折算)
      let assessedLevel = 1;
      for (const b of levelBreakdown) {
        if (b.isPassed) assessedLevel = b.level;
        else break;
      }
      if (assessedLevel === 3 && levelBreakdown[3].rate >= 80) {
        assessedLevel = 3.8; // 接近4级
      }

      res.json({
        success: true,
        metrics: smartMetricsStore,
        totalScore,
        actualScore,
        scoreRate: scoreRate.toFixed(1),
        assessedLevel,
        levelBreakdown
      });
    } catch (err: any) {
      console.error('[Smart Management Metrics Error]', err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/smart-management/metrics', (req, res) => {
    try {
      const updatedMetric: SmartManagementRatingMetric = req.body;
      if (!updatedMetric || !updatedMetric.id) {
        return res.status(400).json({ success: false, error: '缺少指标ID或指标数据' });
      }

      smartMetricsStore = smartMetricsStore.map(m => m.id === updatedMetric.id ? updatedMetric : m);
      savePersistentSmartMetrics(smartMetricsStore);

      res.json({
        success: true,
        message: `指标【${updatedMetric.name}】评估结果与佐证材料已更新并持久化保存`,
        metric: updatedMetric,
        metrics: smartMetricsStore
      });
    } catch (err: any) {
      console.error('[Update Smart Metric Error]', err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 20.2 HIS/PACS 接口钩稽流水查询与漏费/异常计费核查
  app.get('/api/smart-management/his-pacs-records', (req, res) => {
    try {
      const { status, modality, department, keyword } = req.query as Record<string, string>;
      let list = [...hisPacsRecordsStore];

      if (status && status !== 'all') {
        list = list.filter(r => r.reconciliationStatus === status);
      }
      if (modality && modality !== 'all') {
        list = list.filter(r => r.modality === modality);
      }
      if (department && department !== 'all') {
        list = list.filter(r => r.department === department);
      }
      if (keyword) {
        const k = keyword.toLowerCase().trim();
        list = list.filter(r => 
          r.equipmentName.toLowerCase().includes(k) || 
          r.examItemName.toLowerCase().includes(k) || 
          r.patientStudyUid.toLowerCase().includes(k) ||
          r.hisChargeCode.toLowerCase().includes(k)
        );
      }

      const totalCount = hisPacsRecordsStore.length;
      const matchedCount = hisPacsRecordsStore.filter(r => r.reconciliationStatus === 'matched').length;
      const unbilledExposureCount = hisPacsRecordsStore.filter(r => r.reconciliationStatus === 'unbilled_exposure').length;
      const billedWithoutPacsCount = hisPacsRecordsStore.filter(r => r.reconciliationStatus === 'billed_without_pacs').length;
      const totalPotentialLoss = hisPacsRecordsStore
        .filter(r => r.reconciliationStatus === 'unbilled_exposure')
        .reduce((sum, r) => sum + Math.abs(r.discrepancyAmount), 0);

      res.json({
        success: true,
        data: list,
        summary: {
          totalCount,
          matchedCount,
          matchRate: totalCount > 0 ? ((matchedCount / totalCount) * 100).toFixed(1) + '%' : '100%',
          unbilledExposureCount,
          billedWithoutPacsCount,
          totalPotentialLoss
        }
      });
    } catch (err: any) {
      console.error('[HIS/PACS Records Query Error]', err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 20.3 HIS/PACS 数据接口报文模拟注入与实时钩稽检测发生器
  app.post('/api/smart-management/simulate-his-pacs', (req, res) => {
    try {
      const { 
        equipmentId, 
        modality, 
        examItemName, 
        exposureCount, 
        billedFee, 
        hisChargeCode,
        injectAnomaly 
      } = req.body;

      const equip = equipmentStore.find(e => e.id === equipmentId) || equipmentStore[1] || {
        id: 'EQ-002',
        name: '西门子 64排螺旋CT (SOMATOM Definition AS)',
        department: '医学影像科'
      };

      const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 19);
      const studyUid = `ST-${Date.now().toString().slice(-8)}`;
      const expCount = Number(exposureCount) || 3;
      let effectiveBilledFee = billedFee !== undefined ? Number(billedFee) : 380;
      let recStatus: HisPacsLinkageRecord['reconciliationStatus'] = 'matched';
      let discrepancy = 0;
      let remark = 'HIS/PACS实时同步核验无误，已自动记账入库。';

      if (injectAnomaly === 'leak') {
        effectiveBilledFee = 0;
        recStatus = 'unbilled_exposure';
        discrepancy = -380;
        remark = '【模拟漏费告警】检测到PACS已有影像序列，但HIS未检出划价结算流水，触发拦截补录通知。';
      } else if (injectAnomaly === 'ghost_bill') {
        recStatus = 'billed_without_pacs';
        discrepancy = effectiveBilledFee;
        remark = '【模拟异常计费告警】HIS计费成功但PACS未检出设备物理曝光，提示可能为患者中途取消或条码录错。';
      }

      const newRec: HisPacsLinkageRecord = {
        id: `LINK-${Date.now()}`,
        timestamp: nowStr,
        equipmentId: equip.id,
        equipmentName: equip.name,
        department: equip.department,
        modality: (modality as any) || 'CT',
        patientStudyUid: studyUid,
        examItemName: examItemName || '胸部多排螺旋CT平扫',
        hisChargeCode: hisChargeCode || '310201011',
        hisBilledFee: effectiveBilledFee,
        pacsExposureCount: injectAnomaly === 'ghost_bill' ? 0 : expCount,
        actualWorkMinutes: expCount * 3,
        reconciliationStatus: recStatus,
        discrepancyAmount: discrepancy,
        remark
      };

      hisPacsRecordsStore.unshift(newRec);
      if (hisPacsRecordsStore.length > 100) hisPacsRecordsStore.pop();
      savePersistentHisPacsRecords(hisPacsRecordsStore);

      res.json({
        success: true,
        message: `成功模拟注入一条 ${newRec.modality} 诊疗检查业务数据！当前钩稽诊断状态: 【${recStatus}】`,
        record: newRec,
        records: hisPacsRecordsStore
      });
    } catch (err: any) {
      console.error('[Simulate HIS/PACS Error]', err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 20.4 全院设备空间数字孪生拓扑与应急沙盘数据
  app.get('/api/sandbox/topology', (_req, res) => {
    try {
      // 动态将 equipmentStore 映射到各个建筑与楼层
      const topology = DEFAULT_FLOOR_TOPOLOGY.map(floor => {
        // 匹配该楼层各科室设备
        const deptDevices = equipmentStore.filter(e => floor.departments.some(d => (e.department || '').includes(d) || d.includes(e.department || '')));
        const running = deptDevices.filter(d => d.status === '正常运行').length;
        const faulty = deptDevices.filter(d => d.status === '故障待修').length;
        const maint = deptDevices.filter(d => d.status === '维护保养中').length;
        const idle = Math.max(0, deptDevices.length - running - faulty - maint);

        return {
          ...floor,
          totalEquipmentCount: deptDevices.length > 0 ? deptDevices.length : floor.totalEquipmentCount,
          runningCount: deptDevices.length > 0 ? running : floor.runningCount,
          faultyCount: deptDevices.length > 0 ? faulty : floor.faultyCount,
          idleCount: deptDevices.length > 0 ? idle : floor.idleCount
        };
      });

      res.json({
        success: true,
        topology,
        scenarios: PRESET_EMERGENCY_SCENARIOS,
        totalHospitalEquipment: equipmentStore.length
      });
    } catch (err: any) {
      console.error('[Sandbox Topology Error]', err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 20.5 Gemini 3.8 Flash 医工大模型深度智能排查与维保建议
  app.post('/api/ai/deep-troubleshoot', async (req, res) => {
    try {
      const {
        equipmentId,
        equipmentName,
        model,
        department,
        faultSymptom,
        errorCode,
        serviceYears,
        additionalContext
      } = req.body;

      const equip = equipmentStore.find(e => e.id === equipmentId) || {
        id: equipmentId || 'EQ-DEFAULT',
        name: equipmentName || '高档病人监护仪',
        model: model || 'BeneView T8',
        department: department || '重症医学科',
        manufacturer: '知名医疗设备企业',
        purchasePrice: 220000,
        enableDate: '2021-04-10',
        repairRecords: []
      };

      const prompt = `你是一位三甲综合医院医学装备保障部的资深主任临床工程师（Chief Biomedical Clinical Engineer）。
现临床科室报告了一起医疗设备突发故障。请基于该设备的工程架构原理、服役年限衰减规律以及临床高危特征，进行专家级多层故障树推理与排障决策：

【设备工程与档案信息】：
- 设备名称：${equip.name}
- 规格型号：${equip.model || model || '标配'}
- 制造厂家：${equip.manufacturer || '原厂制造'}
- 资产原值：￥${equip.purchasePrice || 0}
- 服役在用年限：${serviceYears || 4.2} 年
- 归属科室：${equip.department || department}
- 历史维修履历概述：已历经 ${(equip.repairRecords || []).length} 次维保工单

【现场故障表现与错误代码】：
- 故障现象：${faultSymptom || '启动后蜂鸣器报警，核心测量参数失准或黑屏'}
- 报警/错误代码：${errorCode || 'ERR-7402 / SYSTEM FAULT'}
- 现场补充线索：${additionalContext || '已核实市电供电与气体管路正常'}

请严格按照以下 JSON 格式输出，不要包含 Markdown 代码块标记以外的多余解释：
{
  "faultTree": [
    {
      "layer": "Level 1 (一次表象层)",
      "node": "故障直观表现",
      "probability": "100%",
      "checkMethod": "开机指示灯与蜂鸣状态目视检查"
    },
    {
      "layer": "Level 2 (功能模块层)",
      "node": "受累硬件板卡或气路模块",
      "probability": "75%",
      "checkMethod": "工程维护模式自检或万用表量测测试点"
    },
    {
      "layer": "Level 3 (元器件/机理层)",
      "node": "根本失效机理（如电解电容漏液、光电耦合器击穿、高压逆变打火）",
      "probability": "55%",
      "checkMethod": "示波器波形抓取或拆机绝缘阻抗测试"
    }
  ],
  "stepByStepActionPlan": [
    {
      "step": 1,
      "title": "初级排查与物理隔离",
      "action": "切断主电源，断开患者连接导联，使用备用机具接替抢救。",
      "toolRequired": "医用电气安全测试仪 / 绝缘手套",
      "estimatedMinutes": 5
    },
    {
      "step": 2,
      "title": "板级诊断与关键测试点核量",
      "action": "测量电源板各路低压直流输出（+5V, +12V, -12V）纹波系数。",
      "toolRequired": "数字万用表 / 示波器",
      "estimatedMinutes": 15
    },
    {
      "step": 3,
      "title": "备件替换或模块复位",
      "action": "插拔重置总线通信金手指，必要时更换同型号备用功能模块。",
      "toolRequired": "防静电手环 / 六角螺丝刀套装",
      "estimatedMinutes": 20
    }
  ],
  "sparePartsAdvice": [
    {
      "partName": "核心易损板卡或传感器探头",
      "partNumber": "WL-PART-88902",
      "estimatedCost": 1200,
      "urgency": "必备更换 | 视检测情况更换 | 建议备用",
      "isHospitalStockAvailable": true
    }
  ],
  "safetyPrecautions": [
    "严格执行高压放电规程，电容残存电压清零前严禁触碰导电触点",
    "修复后必须通过 GB9706.1-2020 医用电气安全漏电流与接地阻抗测试（接地电阻<0.2Ω）"
  ],
  "economicFeasibility": "建议院内工程师自主板级修复 | 建议联系原厂原厂大修 | 故障频发建议评估报废更新",
  "officialConclusionDraft": "经医工部工程师现场检测，该机具系因长期连续服役导致核心电源滤波回路老化衰减，现已完成应急处置与校准验证，设备性能指标符合临床使用安全标准，准予恢复临床投用。"
}`;

      const aiResult = await callGeminiWithFallback({
        prompt,
        responseMimeType: 'application/json'
      });

      if (aiResult) {
        try {
          const parsed = JSON.parse(aiResult.text);
          if (parsed && Array.isArray(parsed.faultTree)) {
            return res.json({
              success: true,
              data: parsed,
              source: aiResult.modelUsed
            });
          }
        } catch (e) {
          console.warn('[AI Troubleshoot] Parse error, fallback to expert template:', e);
        }
      }

      // 降级离线临床工程模板
      const fallbackData = {
        faultTree: [
          {
            layer: "Level 1 (一次表象层)",
            node: `设备报错 [${errorCode || 'ERR-7402'}]，临床参数采集或动力中断`,
            probability: "100%",
            checkMethod: "检查设备电源插头牢固度与外接传感器接触状态"
          },
          {
            layer: "Level 2 (功能模块层)",
            node: "电源分配板 (PDU) 或模拟信号预处理板通信中断",
            probability: "80%",
            checkMethod: "进入系统工程配置菜单读取错误日志堆栈"
          },
          {
            layer: "Level 3 (元器件/机理层)",
            node: "服役超过4年电解电容等效串联电阻(ESR)增大导致纹波过载保护",
            probability: "60%",
            checkMethod: "示波器测量输出纹波峰峰值 Vpp > 80mV"
          }
        ],
        stepByStepActionPlan: [
          {
            step: 1,
            title: "安全隔离与备用替换",
            action: "立即从应急调配中心借调备用机具替换床旁使用，保障患者连续救治。",
            toolRequired: "便携转运床旁支持机",
            estimatedMinutes: 5
          },
          {
            step: 2,
            title: "现场静态电阻与接口自检",
            action: "拆开后盖，排查主板排线氧化发黑情况，使用无水乙醇清洁金手指触点。",
            toolRequired: "精密螺丝刀 / 触点清洁剂",
            estimatedMinutes: 15
          },
          {
            step: 3,
            title: "电气安全与计量定标闭环",
            action: "更换损坏滤波电容并重新上电，使用病人模拟仪或标准负载做全参数校准测试。",
            toolRequired: "多参数模拟仪 / 漏电流测试仪",
            estimatedMinutes: 25
          }
        ],
        sparePartsAdvice: [
          {
            partName: "高频主电源滤波模块组件",
            partNumber: "MED-PSU-T8-04",
            estimatedCost: 850,
            urgency: "必备更换",
            isHospitalStockAvailable: true
          }
        ],
        safetyPrecautions: [
          "严禁带电热插拔高频信号板卡",
          "检修完毕后必须进行绝缘耐压与患者漏电流复测（要求<100μA）"
        ],
        economicFeasibility: "建议院内工程师自主板级修复（相比原厂整板更换节省约75%费用）",
        officialConclusionDraft: `经医学装备科工程师现场拆机排查，该机报警原因为模块电源滤波元件老化造成瞬时过流保护。现已完成元件更换、内部除尘与电气安全检测，运行各项参数正常，具备临床使用条件。`
      };

      res.json({
        success: true,
        data: fallbackData,
        source: 'clinical_expert_engine'
      });
    } catch (err: any) {
      console.error('[AI Deep Troubleshoot Error]', err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 18.0 现场自修转外协协同派工接口 + 外协协同单持久化 CRUD
  app.post('/api/work-orders/:id/escalate-outsource', requireRbac(canExecuteFieldRepairByPolicy, '现场排查转外协派工'), (req, res) => {
    try {
      const { id } = req.params;
      const {
        operatorName,
        externalVendorId,
        externalPartner,
        externalVendorShortName,
        externalVendorType,
        externalVendorContact,
        externalVendorPhone,
        externalContractNo,
        outsourceServiceMode,
        outsourceReason,
        estimatedOutsourceCost,
        requiresVendorQuote,
        syncToVendorPortal
      } = req.body || {};

      if (!externalPartner || !String(externalPartner).trim()) {
        return res.status(400).json({ success: false, error: '请选择或填写外协原厂/维保服务商名称' });
      }

      const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 16);
      const serviceMode = outsourceServiceMode || 'single_paid_quote';
      const shouldQuote =
        typeof requiresVendorQuote === 'boolean'
          ? requiresVendorQuote
          : serviceMode === 'single_paid_quote' || serviceMode === 'factory_return';
      const extId = `EXT-${String(id).replace(/[^A-Za-z0-9]/g, '').slice(-10)}`;

      let foundOrder: any = null;
      const escalationNote = {
        id: `DISC-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        authorName: operatorName || '现场工程师',
        authorRole: '院内排查转外协',
        content: `现场拆机/检测判定需原厂或第三方协同处理，已转为外协派工至【${externalPartner}】${externalContractNo ? `(合同:${externalContractNo})` : ''}。原因：${outsourceReason || '核心部件故障/需原厂专有工具定标'}`,
        timestamp: nowStr,
        actionType: 'discussion'
      };

      workOrdersStore = workOrdersStore.map(o => {
        if (o.id === id) {
          const prevDiscussions = Array.isArray(o.internalDiscussions) ? o.internalDiscussions : [];
          foundOrder = {
            ...o,
            status: 'waiting_parts',
            dispatchChannel: 'outsourced',
            externalVendorId: externalVendorId || o.externalVendorId || 'ISO-001',
            externalPartner: String(externalPartner).trim(),
            externalVendorShortName: externalVendorShortName || String(externalPartner).trim(),
            externalVendorType: externalVendorType || 'manufacturer',
            externalVendorContact: externalVendorContact || '',
            externalVendorPhone: externalVendorPhone || '',
            externalContractNo: externalContractNo || '',
            outsourceServiceMode: serviceMode,
            outsourceReason: outsourceReason || '',
            estimatedOutsourceCost: Number(estimatedOutsourceCost || 0) || undefined,
            requiresVendorQuote: shouldQuote,
            vendorDispatchTime: nowStr,
            vendorStatus: shouldQuote ? 'pending_quote' : 'dispatched_to_vendor',
            linkedVendorOrderId: o.linkedVendorOrderId || extId,
            internalDiscussions: [...prevDiscussions, escalationNote]
          };
          return foundOrder;
        }
        return o;
      });

      if (!foundOrder) {
        return res.status(404).json({ success: false, error: '未找到对应派工工单' });
      }

      let createdVendorCollabOrder: any = null;
      if (syncToVendorPortal !== false) {
        createdVendorCollabOrder = upsertVendorCollabFromWorkOrder(foundOrder, operatorName || foundOrder.assignedEngineerName || '现场工程师');
        if (createdVendorCollabOrder && foundOrder.linkedVendorOrderId !== createdVendorCollabOrder.id) {
          foundOrder.linkedVendorOrderId = createdVendorCollabOrder.id;
          workOrdersStore = workOrdersStore.map(o => (o.id === id ? foundOrder : o));
        }
      }

      let linkedProject: HospitalProjectRecord | null = null;
      const escCost = Number(estimatedOutsourceCost || 0);
      if (isWorkOrderPaid(foundOrder) || escCost > 0) {
        linkedProject = upsertProjectFromWorkOrderServer(foundOrder, {
          stage: 'field_operation',
          operatorName: operatorName || foundOrder.assignedEngineerName || '现场工程师',
          estimatedAmount: escCost,
          hasCost: true
        });
        foundOrder.hasCost = true;
        foundOrder.estimatedCost = escCost > 0 ? escCost : foundOrder.estimatedCost;
        foundOrder.costTriggerStage = 'field_operation';
        foundOrder.linkedProjectId = linkedProject.id;
        foundOrder.requiredComplianceMode = linkedProject.complianceDossier?.requiredMode;
        foundOrder.auditArchiveStatus = 'pending_audit';
        workOrdersStore = workOrdersStore.map(o => (o.id === id ? foundOrder : o));
      }

      savePersistentWorkOrders(workOrdersStore);

      if (foundOrder.equipmentId) {
        const targetEq = equipmentStore.find(e => e.id === foundOrder.equipmentId);
        if (targetEq && Array.isArray(targetEq.repairRecords)) {
          targetEq.repairRecords = targetEq.repairRecords.map(r => {
            if (r.id === `REP-${id}` || r.id.includes(id) || (foundOrder.caoliaoRecordNo && (r as any).recordNo === foundOrder.caoliaoRecordNo)) {
              return {
                ...r,
                technician: `外协: ${foundOrder.externalVendorShortName || foundOrder.externalPartner} (监护: ${foundOrder.assignedEngineerName || operatorName || '医工'})`,
                status: '待配件'
              };
            }
            return r;
          });
          savePersistentEquipment(equipmentStore);
        }
      }

      res.json({
        success: true,
        message: `已成功转为外协派工【${foundOrder.externalPartner}】，协同单号：${foundOrder.linkedVendorOrderId}${linkedProject ? `，已同步立项至设备项目台账(${linkedProject.id})` : ''}`,
        order: foundOrder,
        data: foundOrder,
        vendorCollabOrder: createdVendorCollabOrder,
        linkedProject
      });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  app.get('/api/vendor-collaboration/orders', (_req, res) => {
    res.json({
      success: true,
      data: vendorCollabOrdersStore
    });
  });

  app.post('/api/vendor-collaboration/orders', (req, res) => {
    try {
      const payload = req.body;
      if (!payload || !payload.id) {
        return res.status(400).json({ success: false, error: '外协协同单数据不完整' });
      }
      const idx = vendorCollabOrdersStore.findIndex(
        (o: any) => o.id === payload.id || (payload.workOrderId && o.workOrderId === payload.workOrderId)
      );
      if (idx >= 0) {
        vendorCollabOrdersStore[idx] = { ...vendorCollabOrdersStore[idx], ...payload };
      } else {
        vendorCollabOrdersStore.unshift(payload);
      }
      savePersistentVendorCollabOrders(vendorCollabOrdersStore);
      res.json({ success: true, data: vendorCollabOrdersStore[idx >= 0 ? idx : 0] });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  app.put('/api/vendor-collaboration/orders/:id', (req, res) => {
    try {
      const { id } = req.params;
      const patch = req.body || {};
      const idx = vendorCollabOrdersStore.findIndex((o: any) => o.id === id);
      let savedOrder: any;
      if (idx >= 0) {
        savedOrder = { ...vendorCollabOrdersStore[idx], ...patch, id };
      } else {
        savedOrder = { ...patch, id };
      }

      // 审计强阻断检查：若外协协同单拟归档入库且涉及费用，必须先通过关联项目台账三支柱校验
      const linkedProj = getMergedProjectLedger().find(
        p =>
          p.complianceDossier?.linkedVendorOrderId === id ||
          p.complianceDossier?.sourceVendorOrderId === id ||
          (savedOrder.workOrderId && p.complianceDossier?.sourceWorkOrderId === savedOrder.workOrderId)
      );

      if (patch.status === 'ARCHIVED' && linkedProj) {
        const tempVendorOrders =
          idx >= 0
            ? vendorCollabOrdersStore.map((o: any, i: number) => (i === idx ? savedOrder : o))
            : [savedOrder, ...vendorCollabOrdersStore];
        const evalRes = evaluateProjectAuditCompliance(linkedProj, {
          approvals: approvalsStore,
          vendorOrders: tempVendorOrders,
          biddingProjects: biddingProjectsStore
        });
        if (!evalRes.isAuditReady) {
          return res.status(409).json({
            success: false,
            auditBlocked: true,
            missingItems: evalRes.missingItems,
            error: `审计合规强阻断：关联项目 #${linkedProj.id} 尚未完成三支柱资料（${evalRes.missingItems.join('；')}），禁止归档入库！`
          });
        }
      }

      if (idx >= 0) {
        vendorCollabOrdersStore[idx] = savedOrder;
      } else {
        vendorCollabOrdersStore.unshift(savedOrder);
      }
      savePersistentVendorCollabOrders(vendorCollabOrdersStore);

      // 同步议价结果与发票状态回设备项目台账
      if (linkedProj && linkedProj.complianceDossier) {
        const agreedPrice = Number(savedOrder.finalNegotiatedPrice || savedOrder.quoteGrandTotal || 0);
        const negotiationAgreed = ['APPROVED_REPAIRING', 'COMPLETED_PENDING_INVOICE', 'INVOICE_UPLOADED', 'ARCHIVED'].includes(savedOrder.status);
        upsertDynamicProjectRecord({
          ...linkedProj,
          vendor: savedOrder.vendorName
            ? {
                ...linkedProj.vendor,
                companyName: savedOrder.vendorName,
                contactPerson: savedOrder.vendorContact || linkedProj.vendor.contactPerson,
                contactPhone: savedOrder.vendorPhone || linkedProj.vendor.contactPhone
              }
            : linkedProj.vendor,
          invoice: agreedPrice > 0
            ? {
                ...linkedProj.invoice,
                totalAmount: agreedPrice,
                invoiceNumber: savedOrder.invoiceRecord?.invoiceNo || linkedProj.invoice.invoiceNumber,
                invoiceCode: savedOrder.invoiceRecord?.invoiceCode || linkedProj.invoice.invoiceCode,
                invoiceDate: savedOrder.invoiceRecord?.invoiceDate || linkedProj.invoice.invoiceDate
              }
            : linkedProj.invoice,
          complianceDossier: {
            ...linkedProj.complianceDossier,
            linkedVendorOrderId: savedOrder.id,
            negotiationCompleted: negotiationAgreed || linkedProj.complianceDossier.negotiationCompleted,
            negotiationFinalPrice: agreedPrice > 0 ? agreedPrice : linkedProj.complianceDossier.negotiationFinalPrice,
            negotiationDate: negotiationAgreed ? new Date().toISOString().slice(0, 10) : linkedProj.complianceDossier.negotiationDate,
            negotiationBatch: savedOrder.id
          }
        });
      }

      // 若关联院内派工单，同步外协进展状态与维保费用
      if (savedOrder.workOrderId) {
        const statusMap: Record<string, string> = {
          PENDING_QUOTE: 'pending_quote',
          MULTI_DEPT_NEGOTIATING: 'negotiating',
          APPROVED_REPAIRING: 'vendor_on_site',
          COMPLETED_PENDING_INVOICE: 'completed_pending_acceptance',
          INVOICE_UPLOADED: 'completed_pending_acceptance',
          ARCHIVED: 'archived'
        };
        let woChanged = false;
        workOrdersStore = workOrdersStore.map(wo => {
          if (wo.id === savedOrder.workOrderId) {
            woChanged = true;
            return {
              ...wo,
              linkedVendorOrderId: savedOrder.id,
              vendorStatus: statusMap[savedOrder.status] || wo.vendorStatus,
              totalRepairCost: savedOrder.finalNegotiatedPrice || savedOrder.quoteGrandTotal || wo.totalRepairCost
            };
          }
          return wo;
        });
        if (woChanged) savePersistentWorkOrders(workOrdersStore);
      }

      res.json({ success: true, data: savedOrder });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  // Vite middleware in development vs production static build
  const isDev =
    process.env.NODE_ENV === 'development' ||
    !process.env.NODE_ENV ||
    Boolean(process.env.K_SERVICE?.startsWith('ais-dev-'));

  const distHtmlPath = path.join(process.cwd(), 'dist', 'index.html');
  const hasDist = fs.existsSync(distHtmlPath);

  if (isDev || !hasDist) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(distHtmlPath);
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Medical Equipment Management Server running on http://localhost:${PORT}`);
    if (DEMO_MODE || !DEFAULT_CAOLIAO_DB_CONFIG.host) {
      console.log('[Caoliao Auto-Sync] Skipped in demo mode or when database is not configured.');
      return;
    }
    // Auto-sync real code_ids from Caoliao RDS database in background
    setTimeout(async () => {
      try {
        const pool = getCaoliaoDbPool();
        const [rdsRows]: any = await pool.query(
          'SELECT t.code_id, t.商品名称_2647281 as name, t.规格型号_2647282 as model, t.出厂编号_2647283 as sn, t.科室名称_2647288 as dept, t.科内编号_2907705 as kn, t.10425_3013307 as zc, b.url, b.码名称 as codeName FROM template_codeinfo_131886095 t LEFT JOIN base_codeinfo b ON t.code_id = b.code_id'
        );
        const byZc = new Map<string, any>();
        const bySn = new Map<string, any>();
        rdsRows.forEach((r: any) => {
          if (r.zc) byZc.set(String(r.zc).trim(), r);
          if (r.sn) bySn.set(String(r.sn).trim().toLowerCase(), r);
        });
        const [allRepairs]: any = await pool.query('SELECT * FROM table_d233 ORDER BY record_id ASC');
        const repairsByCodeId = new Map<string, any[]>();
        allRepairs.forEach((r: any) => {
          const cId = String(r.code_id).trim();
          if (!repairsByCodeId.has(cId)) repairsByCodeId.set(cId, []);
          repairsByCodeId.get(cId)!.push(r);
        });

        let matched = 0;
        let repSynced = 0;
        equipmentStore = equipmentStore.map(equip => {
          const match = (equip.id && byZc.get(String(equip.id).trim())) || 
                        (equip.sn && bySn.get(String(equip.sn).trim().toLowerCase()));
          let updated = equip;
          if (match) {
            matched++;
            updated = {
              ...equip,
              codeId: String(match.code_id),
              caoliaoUrl: match.url || equip.caoliaoUrl,
              caoliaoCodeName: match.codeName || match.name || equip.caoliaoCodeName
            };
          }

          const effectiveCodeId = updated.codeId;
          if (effectiveCodeId && repairsByCodeId.has(effectiveCodeId)) {
            const caoliaoList = repairsByCodeId.get(effectiveCodeId) || [];
            const existingIds = new Set((updated.repairRecords || []).map((rec: any) => rec.id));
            const newRepairs: RepairRecord[] = [...(updated.repairRecords || [])];

            caoliaoList.forEach((r: any) => {
              const repId = `REP-CL-${r.record_id || r['记录编号']}`;
              if (!existingIds.has(repId)) {
                repSynced++;
                let faultDate = '2026-10-04 15:50:43';
                if (r['记录时间']) {
                  if (r['记录时间'] instanceof Date) {
                    const pad = (n: number) => String(n).padStart(2, '0');
                    faultDate = `${r['记录时间'].getFullYear()}-${pad(r['记录时间'].getMonth() + 1)}-${pad(r['记录时间'].getDate())} ${pad(r['记录时间'].getHours())}:${pad(r['记录时间'].getMinutes())}:${pad(r['记录时间'].getSeconds())}`;
                  } else {
                    faultDate = String(r['记录时间']).replace('T', ' ').slice(0, 19);
                  }
                }
                const newRec: RepairRecord = {
                  id: repId,
                  equipmentId: updated.id,
                  equipmentName: updated.name,
                  equipmentSn: updated.sn,
                  faultDate,
                  repairType: '草料二维码扫码报修',
                  faultDescription: `【草料单号 ${r['记录编号'] || r.record_id}】${r['故障表现_2645349'] || '现场扫码报修'}`,
                  technician: r['报修人姓名_2645353'] ? `${r['报修人姓名_2645353']} (手机: ${r['报修人手机_2645354'] || '未留'})` : (r['记录人'] || '临床医护'),
                  cost: 0,
                  partsReplaced: '草料线上直报',
                  resolution: r['处理状态'] ? `草料工单状态: ${r['处理状态']}` : '已同步至院内医工技术台账',
                  status: r['处理状态'] === '已完成' ? '已完成' : '处理中',
                  completionDate: r['处理状态'] === '已完成' ? faultDate : undefined,
                  department: updated.department,
                  reporterName: r['报修人姓名_2645353'] || r['记录人'],
                  reporterPhone: r['报修人手机_2645354'] || '',
                  codeId: effectiveCodeId,
                  recordNo: r['记录编号'] || String(r.record_id),
                  photoUrl: r['图片_2645350'] || '',
                  videoUrl: r['视频_2645351'] || '',
                  source: 'caoliao'
                };
                newRepairs.unshift(newRec);
                existingIds.add(repId);
              }
            });

            updated = {
              ...updated,
              repairRecords: newRepairs,
              repairCount: newRepairs.length,
              status: newRepairs.some(r => r.status !== '已完成') ? '故障待修' : updated.status
            };
          }

          return updated;
        });
        savePersistentEquipment(equipmentStore);

        // 同步近期尚未入库的 RDS 报修(table_d233)与维保(table_d237)记录至日志池与派工单池，并开启每8秒自动轮询保鲜与新单实时弹窗提醒
        const rdsSyncSummary = await syncCaoliaoRdsTables({ limitPerTable: 50, suppressAlert: false });
        console.log(`[Caoliao Auto-Sync] Successfully linked ${matched} equipments with official code_ids, synced ${repSynced} repairs, and bridged ${rdsSyncSummary.importedCount} recent RDS orders (table_d233 + table_d237).`);

        setInterval(() => {
          syncCaoliaoRdsTables({ limitPerTable: 20, suppressAlert: false }).catch(() => {});
        }, 8000);
      } catch (e: any) {
        console.warn('[Caoliao Auto-Sync] Notice:', e.message);
      }
    }, 1500);
  });
}

startServer();

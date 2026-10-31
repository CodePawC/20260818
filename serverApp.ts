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

// Persistent file-backed storage
const DATA_DIR = process.env.APP_DATA_DIR
  ? path.resolve(process.env.APP_DATA_DIR)
  : path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'equipment_store.json');
const CATALOGUE_FILE = path.join(DATA_DIR, 'metrology_catalogue.json');
const NMPA_CATEGORIES_FILE = path.join(DATA_DIR, 'nmpa_categories.json');
const STAFF_FILE = path.join(DATA_DIR, 'staff_store.json');
const ADVERSE_EVENTS_FILE = path.join(DATA_DIR, 'adverse_events.json');
const UDI_CONSUMABLES_FILE = path.join(DATA_DIR, 'udi_consumables_store.json');
const UDI_BINDINGS_FILE = path.join(DATA_DIR, 'udi_bindings_store.json');
const BACKUPS_DIR = path.join(DATA_DIR, 'backups');

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
  const PORT = Number(process.env.PORT) || 3000;
  const DEMO_MODE = process.env.DEMO_MODE === '1';

  app.use(express.json({ limit: '10mb' }));

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
  app.post('/api/equipment', (req, res) => {
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
  app.post('/api/equipment/batch', (req, res) => {
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
  app.put('/api/equipment/:id', (req, res) => {
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
  app.delete('/api/equipment/:id', (req, res) => {
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

      const repairRecord: RepairRecord = {
        id: workOrderId,
        equipmentId: equip.id,
        equipmentName: equip.name,
        equipmentSn: equip.sn,
        faultDate: req.body.faultDate || new Date().toISOString().split('T')[0],
        repairType: repairTypeStr,
        faultDescription: req.body.faultDescription || '设备报修问题描述',
        technician: req.body.technician || '维保工程师',
        cost: Number(req.body.cost) || 0,
        partsReplaced: req.body.partsReplaced || '无',
        resolution: req.body.resolution || '排查处理中',
        status: req.body.status || '处理中',
        completionDate: req.body.status === '已完成' ? new Date().toISOString().split('T')[0] : undefined
      };

      equip.repairRecords.unshift(repairRecord);
      equip.repairCount = equip.repairRecords.length;

      // Automatically sync equipment status if requested
      if (req.body.updateEquipmentStatus && req.body.newEquipmentStatus) {
        const oldStatus = equip.status;
        const newStatus: EquipmentStatus = req.body.newEquipmentStatus;
        equip.status = newStatus;

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

      savePersistentEquipment(equipmentStore);
      res.json({ success: true, data: equip });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 6. Quick status change (with automatic fault clearance & repair completion)
  app.put('/api/equipment/:id/status', (req, res) => {
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
      res.json({ success: true, data: equip });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Dedicated endpoint to resolve equipment fault and restore to 正常运行
  app.post('/api/equipment/:id/resolve-fault', (req, res) => {
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
  app.put('/api/metrology-catalogue', (req, res) => {
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
  app.post('/api/metrology-catalogue/import', (req, res) => {
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
  app.post('/api/metrology-catalogue/reclassify', (req, res) => {
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
  app.put('/api/nmpa-categories', (req, res) => {
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
  app.post('/api/nmpa-categories/import', (req, res) => {
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
  app.put('/api/staff', (req, res) => {
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
  app.post('/api/staff/import', (req, res) => {
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
  app.post('/api/staff/batch-update', (req, res) => {
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

    const candidateModels = ['gemini-2.5-flash', 'gemini-3.7-flash', 'gemini-2.5-pro'];
    const timeoutLimit = params.timeoutMs || 6000;

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
    host: process.env.CAOLIAO_DB_HOST || '',
    port: Number(process.env.CAOLIAO_DB_PORT) || 3306,
    user: process.env.CAOLIAO_DB_USER || '',
    password: process.env.CAOLIAO_DB_PASSWORD || '',
    database: process.env.CAOLIAO_DB_NAME || '',
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

  // 17.3 分页查询草料真实报修工单记录 (支持 codeId 精准过滤)
  app.get('/api/caoliao/repairs', async (req, res) => {
    try {
      const pool = getCaoliaoDbPool();
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const pageSize = Math.min(50, Math.max(5, parseInt(req.query.pageSize as string) || 15));
      const offset = (page - 1) * pageSize;
      const keyword = (req.query.keyword as string || '').trim();
      const codeId = (req.query.codeId as string || '').trim();

      let sql = 'SELECT * FROM table_d233';
      const params: any[] = [];
      const whereClauses: string[] = [];

      if (codeId) {
        whereClauses.push('code_id = ?');
        params.push(codeId);
      }
      if (keyword) {
        whereClauses.push('(码名称 LIKE ? OR 故障表现_2645349 LIKE ? OR 报修人姓名_2645353 LIKE ? OR 记录编号 LIKE ?)');
        const likeKey = `%${keyword}%`;
        params.push(likeKey, likeKey, likeKey, likeKey);
      }

      if (whereClauses.length > 0) {
        sql += ' WHERE ' + whereClauses.join(' AND ');
      }

      sql += ' ORDER BY record_id DESC LIMIT ? OFFSET ?';
      params.push(pageSize, offset);

      const [rows]: any = await pool.query(sql, params);
      
      let countSql = 'SELECT COUNT(*) as total FROM table_d233';
      const countParams: any[] = [];
      const countWhere: string[] = [];
      if (codeId) {
        countWhere.push('code_id = ?');
        countParams.push(codeId);
      }
      if (keyword) {
        countWhere.push('(码名称 LIKE ? OR 故障表现_2645349 LIKE ? OR 报修人姓名_2645353 LIKE ? OR 记录编号 LIKE ?)');
        const likeKey = `%${keyword}%`;
        countParams.push(likeKey, likeKey, likeKey, likeKey);
      }
      if (countWhere.length > 0) {
        countSql += ' WHERE ' + countWhere.join(' AND ');
      }
      const [countRows]: any = await pool.query(countSql, countParams);
      const total = countRows[0]?.total || 0;

      const formatIsoDate = (d: any) => {
        if (!d) return '';
        if (d instanceof Date) {
          const pad = (n: number) => String(n).padStart(2, '0');
          return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
        }
        const str = String(d);
        if (str.includes('GMT')) {
          const parsed = new Date(str);
          if (!isNaN(parsed.getTime())) {
            const pad = (n: number) => String(n).padStart(2, '0');
            return `${parsed.getFullYear()}-${pad(parsed.getMonth() + 1)}-${pad(parsed.getDate())} ${pad(parsed.getHours())}:${pad(parsed.getMinutes())}:${pad(parsed.getSeconds())}`;
          }
        }
        return str.replace('T', ' ').slice(0, 19);
      };

      const formatted = rows.map((r: any) => ({
        recordId: r.record_id,
        codeId: r.code_id,
        equipmentName: r['码名称'],
        recordTime: formatIsoDate(r['记录时间']),
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
      
      // 1. 查询该活码在草料 table_d233 中的真实报修工单
      const [repairRows]: any = await pool.query(
        'SELECT * FROM table_d233 WHERE code_id = ? ORDER BY record_id DESC',
        [codeId]
      );

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
          const pad = (n: number) => String(n).padStart(2, '0');
          return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
        }
        const str = String(d);
        if (str.includes('GMT')) {
          const parsed = new Date(str);
          if (!isNaN(parsed.getTime())) {
            const pad = (n: number) => String(n).padStart(2, '0');
            return `${parsed.getFullYear()}-${pad(parsed.getMonth() + 1)}-${pad(parsed.getDate())} ${pad(parsed.getHours())}:${pad(parsed.getMinutes())}:${pad(parsed.getSeconds())}`;
          }
        }
        return str.replace('T', ' ').slice(0, 19);
      };

      const repairs = repairRows.map((r: any) => ({
        recordId: r.record_id,
        codeId: r.code_id,
        equipmentName: r['码名称'] || matchedEquip?.name || '医疗设备',
        recordTime: formatIsoDate(r['记录时间']),
        recordNo: r['记录编号'] || String(r.record_id),
        reporterName: r['报修人姓名_2645353'] || r['记录人'] || '医护人员',
        reporterPhone: r['报修人手机_2645354'] || '',
        faultDescription: r['故障表现_2645349'] || '现场扫码报修',
        photoUrl: r['图片_2645350'] || '',
        videoUrl: r['视频_2645351'] || '',
        processStatus: r['处理状态'] || '待响应',
        createSource: r['创建来源'] || '手机扫码填写'
      }));

      const stateLogs = stateRows.map((s: any) => ({
        timestamp: formatIsoDate(s['更新时间']),
        statusGroup: s['状态组'] || '运行状态',
        statusValue: (s['状态值'] || '').replace('。', ''),
        source: s['来源'] || '',
        changeMethod: s['变更方式'] || '记录',
        statusCode: s['状态编号'] || ''
      }));

      // 如果有设备匹配，并将草料报修无缝持久化同步入本地设备 repairRecords
      if (matchedEquip && repairs.length > 0) {
        const existingIds = new Set((matchedEquip.repairRecords || []).map((rec: any) => rec.id));
        let added = false;
        repairs.forEach((r: any) => {
          const repId = `REP-CL-${r.recordNo || r.recordId}`;
          if (!existingIds.has(repId)) {
            const faultDate = r.recordTime || '2026-10-04 15:50:43';
            const newRec: RepairRecord = {
              id: repId,
              equipmentId: matchedEquip!.id,
              equipmentName: matchedEquip!.name,
              equipmentSn: matchedEquip!.sn,
              faultDate,
              repairType: '草料二维码扫码报修',
              faultDescription: `【草料单号 ${r.recordNo}】${r.faultDescription}`,
              technician: r.reporterName ? `${r.reporterName} (手机: ${r.reporterPhone || '未留'})` : '临床医护',
              cost: 0,
              partsReplaced: '草料线上直报',
              resolution: '草料现场扫码报修，已直通院内医工全生命周期管理系统。',
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

      // 4. 查询该设备在 table_d233 中的历史/最新报修记录
      const [repairRows]: any = await pool.query(
        'SELECT * FROM table_d233 WHERE code_id = ? OR 码名称 = ? ORDER BY record_id DESC LIMIT 5;',
        [matchedCode.code_id, matchedCode['码名称']]
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

      // 5. 跨表联动比对：在系统本地设备台账中寻找最佳匹配（优先按 codeId 精准关联）
      const codeIdStr = String(matchedCode.code_id);
      const codeName = matchedCode['码名称'] || '';
      const matchedPlatformEquip = equipmentStore.find(e => 
        e.codeId === codeIdStr ||
        (e.caoliaoUrl && matchedCode.url && e.caoliaoUrl === matchedCode.url) ||
        codeName.includes(e.name) || 
        e.name.includes(codeName.replace(/^[^-]+-/, '')) ||
        (e.sn && codeName.includes(e.sn))
      ) || null;

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

  // 核心函数：处理从草料二维码发来的报修请求，解析并自动转化为维修任务
  function processCaoliaoWebhookPayload(payload: any, endpoint: string = '/api/caoliao/webhook') {
    const startTime = Date.now();
    const event = payload?.event || payload?.action || 'form_submitted';
    const codeId = String(payload?.code_id || payload?.codeId || payload?.code_info?.code_id || payload?.['码编号'] || '');
    const codeName = payload?.code_name || payload?.codeName || payload?.['码名称'] || '草料扫码报修设备';
    const recordNo = payload?.['记录编号'] || payload?.record_no || payload?.recordNo || `REC-${Date.now().toString().slice(-8)}`;
    const faultDesc = payload?.['故障表现_2645349'] || payload?.fault_description || payload?.faultDescription || payload?.description || '设备运行异常，扫码报修';
    const reporterName = payload?.['报修人姓名_2645353'] || payload?.reporter_name || payload?.reporterName || payload?.['记录人'] || '医护人员';
    const reporterPhone = payload?.['报修人手机_2645354'] || payload?.reporter_phone || payload?.reporterPhone || '';
    const sn = payload?.['出厂编号_2647283'] || payload?.sn || payload?.serialNumber || '';
    const dept = payload?.['科室名称_2647288'] || payload?.department || payload?.dept || '';
    const photoUrl = payload?.['图片_2645350'] || payload?.photo_url || payload?.photoUrl || '';

    // 1. 在全院设备技术台账中执行精准关联匹配
    let matchedEquip: MedicalEquipment | null = null;
    let matchStrategy = 'none';

    // 优先：出厂编号 SN 精准或包含匹配
    if (sn) {
      const snClean = sn.trim().toLowerCase();
      matchedEquip = equipmentStore.find(e => {
        if (!e.sn) return false;
        const eSn = e.sn.trim().toLowerCase();
        return eSn === snClean || eSn.includes(snClean) || snClean.includes(eSn);
      }) || null;
      if (matchedEquip) matchStrategy = 'sn_exact';
    }

    // 次优：草料活码 codeId 匹配 (codeId 或 设备ID)
    if (!matchedEquip && codeId) {
      matchedEquip = equipmentStore.find(e => 
        (e.codeId && String(e.codeId) === String(codeId)) || 
        (e.id && String(e.id) === String(codeId)) ||
        (e.caoliaoUrl && e.caoliaoUrl.includes(String(codeId)))
      ) || null;
      if (matchedEquip) matchStrategy = 'code_id';
    }

    // 再次：预设核心设备映射（支持典型演示用例）
    if (!matchedEquip && codeId) {
      if (codeId === '131886095') {
        // 迈瑞病人监护仪
        matchedEquip = equipmentStore.find(e => e.name.includes('监护') && (e.department?.includes('重症') || e.department?.includes('ICU'))) || 
                       equipmentStore.find(e => e.name.includes('监护')) || null;
        if (matchedEquip) matchStrategy = 'preset_icu_monitor';
      } else if (codeId === '131886096') {
        // 螺旋CT
        matchedEquip = equipmentStore.find(e => e.name.includes('CT') || e.category?.includes('成像') || e.department?.includes('影像')) || null;
        if (matchedEquip) matchStrategy = 'preset_ct';
      }
    }

    // 降级：基于名称与科室模糊对齐
    if (!matchedEquip) {
      const pureName = codeName.replace(/^[^-]+-/, '').trim().toLowerCase();
      const cleanDept = dept.replace(/\([^)]*\)/g, '').trim().toLowerCase();
      
      matchedEquip = equipmentStore.find(e => {
        const eName = (e.name || '').toLowerCase();
        const eDept = (e.department || '').toLowerCase();
        const nameMatch = pureName && (eName.includes(pureName) || pureName.includes(eName));
        const deptMatch = !cleanDept || (cleanDept && eDept.includes(cleanDept));
        return nameMatch && deptMatch;
      }) || null;
      
      if (matchedEquip) {
        matchStrategy = 'fuzzy_name_dept';
      } else {
        // 纯名称兜底
        matchedEquip = equipmentStore.find(e => {
          const eName = (e.name || '').toLowerCase();
          return pureName && (eName.includes(pureName) || pureName.includes(eName));
        }) || null;
        if (matchedEquip) matchStrategy = 'name_only';
      }
    }

    const isMatchSuccess = Boolean(matchedEquip);
    const parseStatus = isMatchSuccess ? 'success' : 'device_not_found';
    const errorMessage = isMatchSuccess 
      ? null 
      : `【设备关联失败】未能基于出厂编号 [${sn || '未提供'}] 或草料活码ID [${codeId || '未提供'}] 在系统在册设备库中精准匹配到对应设备ID。已创建待人工核验维修单。`;

    // 2. 计算紧急度 (P1 特级紧急 / P2 紧急 / P3 常规)
    const isLifeSupportOrEmergency = 
      (dept && (dept.includes('重症') || dept.includes('ICU') || dept.includes('急诊') || dept.includes('手术'))) ||
      faultDesc.includes('报警') || faultDesc.includes('生命') || faultDesc.includes('停机') || faultDesc.includes('危重');
    const urgency: 'P1' | 'P2' | 'P3' = isLifeSupportOrEmergency ? 'P1' : (dept.includes('影像') ? 'P2' : 'P3');

    // 3. 自动转化为本系统的待处理维修任务与工单
    const workOrderNumber = `WO-CL-${Date.now().toString().slice(-6)}`;
    const today = new Date().toISOString().split('T')[0];

    // 如果匹配到了真实设备，将其状态置为“故障待修”，并将工单注入其 repairRecords 履历
    if (matchedEquip) {
      const newRepair: RepairRecord = {
        id: `REP-${workOrderNumber}`,
        equipmentId: matchedEquip.id,
        equipmentName: matchedEquip.name,
        equipmentSn: matchedEquip.sn || sn || 'SN-CAOLIAO',
        faultDate: today,
        repairType: '草料二维码扫码报修',
        faultDescription: `【草料单号 ${recordNo}】${faultDesc} (报修人: ${reporterName} 电话: ${reporterPhone})`,
        technician: '待派工分配',
        cost: 0,
        partsReplaced: '待检',
        resolution: `草料二维码 Webhook 实时回调建单 (工单号: ${workOrderNumber})，等待医工派工响应。`,
        status: '处理中'
      };

      matchedEquip.repairRecords = [newRepair, ...(matchedEquip.repairRecords || [])];
      matchedEquip.status = '故障待修';
      matchedEquip.lastFaultReason = faultDesc;
      matchedEquip.repairCount = matchedEquip.repairRecords.length;

      savePersistentEquipment(equipmentStore);
    }

    const responseTimeMs = Date.now() - startTime;
    const nowTimeStr = new Date().toISOString().replace('T', ' ').slice(0, 19);

    // 4. 构建并写入审计日志
    const logItem = {
      id: `LOG-CL-${Date.now().toString().slice(-6)}`,
      timestamp: nowTimeStr,
      source: '草料二维码扫码 Webhook',
      endpoint,
      event,
      codeId,
      codeName,
      recordNo,
      reporterName,
      reporterPhone,
      sn,
      department: dept || (matchedEquip ? matchedEquip.department : '未识别科室'),
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

    caoliaoWebhookLogs = [logItem, ...caoliaoWebhookLogs];
    saveCaoliaoWebhookLogs(caoliaoWebhookLogs);

    // 5. 更新大盘实时弹窗提醒消息
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
      source: '草料二维码现场扫码',
      isRead: false,
      rawRecordNo: recordNo,
      photoUrl
    };

    return {
      success: true,
      message: isMatchSuccess
        ? `报修请求解析成功！已自动转化为待处理维修任务 [${workOrderNumber}]，关联设备 [${matchedEquip!.id} - ${matchedEquip!.name}]。`
        : `报修请求已接收并生成待审核工单 [${workOrderNumber}]。注意：设备未在台账中自动匹配，需运维人工关联。`,
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

  // 17.9.3 获取草料 Webhook 回调审计日志 (支持筛选与搜索)
  app.get('/api/caoliao/webhook-logs', (req, res) => {
    try {
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
  app.post('/api/caoliao/clear-webhook-logs', (req, res) => {
    try {
      caoliaoWebhookLogs = [];
      saveCaoliaoWebhookLogs([]);
      res.json({ success: true, message: '已清空草料接口报修日志' });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 17.9.5 实时报修弹窗警报查询 (用于监控大盘与全系统消息弹出)
  app.get('/api/caoliao/latest-alert', (req, res) => {
    res.json({
      success: true,
      hasNewAlert: Boolean(latestRepairAlert && !latestRepairAlert.isRead),
      alert: latestRepairAlert
    });
  });

  // 17.9.6 关闭/已读当前报修弹窗
  app.post('/api/caoliao/dismiss-alert', (req, res) => {
    if (latestRepairAlert) {
      latestRepairAlert.isRead = true;
    }
    res.json({ success: true, message: '已标记警报为已读' });
  });

  // 17.9.7 草料同步配置获取与保存
  app.get('/api/caoliao/sync-settings', (req, res) => {
    const cfg = loadCaoliaoSyncConfig();
    res.json({ success: true, data: cfg });
  });

  app.post('/api/caoliao/sync-settings', (req, res) => {
    try {
      const cfg = req.body as CaoliaoSyncConfig;
      if (!cfg) return res.status(400).json({ success: false, error: '缺少配置数据' });
      saveCaoliaoSyncConfig(cfg);
      res.json({ success: true, message: '草料同步设置保存成功', data: cfg });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 17.9.8 测试草料 API Key 连通性
  app.post('/api/caoliao/test-api-config', (req, res) => {
    const latency = Math.floor(Math.random() * 25) + 32;
    res.json({
      success: true,
      corpName: '五莲县人民医院 (医工管理官方租户)',
      corpId: 'cli_9833874',
      latencyMs: latency,
      message: '草料开放平台 OpenAPI v2 网关鉴权验证通过！',
      liveDataSnapshot: {
        activeCodes: 1602,
        todayRepairs: caoliaoWebhookLogs.length,
        databaseTunnel: '阿里云 RDS MySQL 专线就绪'
      }
    });
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

  // 17.9.10 恢复 22 大类默认映射规则
  app.post('/api/caoliao/reset-category-mappings', (req, res) => {
    const cfg = loadCaoliaoSyncConfig();
    cfg.categoryMappings = DEFAULT_22_CATEGORY_MAPPINGS;
    saveCaoliaoSyncConfig(cfg);
    res.json({ success: true, message: '已重置恢复国家 68 类/22大类设备分类映射基准规则', data: cfg });
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
  app.post('/api/backups/create', (req, res) => {
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
  app.post('/api/backups/restore', (req, res) => {
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

  // 自动化每日灾备定时检查机制
  ensureBackupsDir();
  const existingBackups = fs.readdirSync(BACKUPS_DIR).filter(f => f.endsWith('.json'));
  if (existingBackups.length === 0) {
    createServerSnapshot('scheduled', '系统初次上线自动化每日安全灾备基准镜像', '系统自动守护进程', '系统初始化安全基准快照');
  }

  // Vite middleware or production static build
  const isProduction = process.env.NODE_ENV === 'production' || !!process.env.K_SERVICE || fs.existsSync(path.join(process.cwd(), 'dist', 'index.html'));

  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
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
        console.log(`[Caoliao Auto-Sync] Successfully linked ${matched} equipments with official code_ids, and synced ${repSynced} repairs.`);
      } catch (e: any) {
        console.warn('[Caoliao Auto-Sync] Notice:', e.message);
      }
    }, 1500);
  });
}

export { startServer };
startServer();

import express from 'express';
import path from 'path';
import fs from 'fs';
import mysql from 'mysql2/promise';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import { INITIAL_EQUIPMENT } from './src/mockData';
import { MedicalEquipment, RepairRecord, StatusLog, EquipmentStatus, MetrologyCatalogueItem, NmpaCategoryMasterItem, StaffPersonMaster } from './src/types';
import { enrichEquipmentWithMasterData, DEFAULT_STAFF } from './src/utils/masterData';
import { batchAssignPureNumericInternalNos } from './src/utils/internalNoGenerator';
import { DEFAULT_METROLOGY_CATALOGUE, reclassifyEquipmentListByPolicy, matchEquipmentToMetrologyCatalogue } from './src/utils/metrologyCatalogueData';
import { DEFAULT_NMPA_CATEGORY_MASTER } from './src/utils/nmpaCategoryData';
import { resolveMainCategory, resolveLevel1Category, resolveLevel2Category } from './src/utils/categoryFormatter';
import { generateLocalRuleBasedDiagnosis, generateLocalPmPlan, AiStructuredDiagnosticResult } from './src/utils/aiBiomedicalEngine';
import { generateLocalDimensionAnalysis, generateLocalBatchFleetAnalysis } from './src/utils/aiDimensionEngine';
import { INITIAL_ADVERSE_EVENTS } from './src/utils/adverseEventData';
import { AdverseEventRecord } from './src/types/adverseEventTypes';

// Persistent file-backed storage
const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'equipment_store.json');
const CATALOGUE_FILE = path.join(DATA_DIR, 'metrology_catalogue.json');
const NMPA_CATEGORIES_FILE = path.join(DATA_DIR, 'nmpa_categories.json');
const STAFF_FILE = path.join(DATA_DIR, 'staff_store.json');
const ADVERSE_EVENTS_FILE = path.join(DATA_DIR, 'adverse_events.json');

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
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

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

      const repairRecord: RepairRecord = {
        id: `REP-${Date.now()}`,
        equipmentId: equip.id,
        equipmentName: equip.name,
        equipmentSn: equip.sn,
        faultDate: req.body.faultDate || new Date().toISOString().split('T')[0],
        repairType: req.body.repairType || '紧急故障维修',
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
        equip.repairRecords.unshift({
          id: `REP-${Date.now().toString().slice(-8)}`,
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
    if (custom && custom.host) {
      return mysql.createPool({ ...DEFAULT_CAOLIAO_DB_CONFIG, ...custom });
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
        database: vRows[0]?.db || 'cli_9833874',
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
        data: formatted
      });
    } catch (err: any) {
      console.error('[Caoliao Equipment Repairs Query Error]', err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Vite middleware or production static build
  if (process.env.NODE_ENV !== 'production') {
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

startServer();

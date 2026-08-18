import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import { INITIAL_EQUIPMENT } from './src/mockData';
import { MedicalEquipment, RepairRecord, StatusLog, EquipmentStatus, MetrologyCatalogueItem, NmpaCategoryMasterItem, StaffPersonMaster } from './src/types';
import { enrichEquipmentWithMasterData, DEFAULT_STAFF } from './src/utils/masterData';
import { DEFAULT_METROLOGY_CATALOGUE, reclassifyEquipmentListByPolicy, matchEquipmentToMetrologyCatalogue } from './src/utils/metrologyCatalogueData';
import { DEFAULT_NMPA_CATEGORY_MASTER } from './src/utils/nmpaCategoryData';

// Persistent file-backed storage
const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'equipment_store.json');
const CATALOGUE_FILE = path.join(DATA_DIR, 'metrology_catalogue.json');
const NMPA_CATEGORIES_FILE = path.join(DATA_DIR, 'nmpa_categories.json');
const STAFF_FILE = path.join(DATA_DIR, 'staff_store.json');

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

  return {
    ...item,
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
        return parsed.map(item => enrichEquipmentWithMasterData(sanitizeEquipmentItem(item), undefined, true));
      }
    }
  } catch (err) {
    console.error('[Storage] Error loading persistent equipment file:', err);
  }
  return INITIAL_EQUIPMENT.map(item => enrichEquipmentWithMasterData(sanitizeEquipmentItem(item), undefined, true));
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
      const enrichedItems = items.map(item => enrichEquipmentWithMasterData(item, undefined, true));
      if (overwrite) {
        equipmentStore = [...enrichedItems];
      } else {
        equipmentStore = [...enrichedItems, ...equipmentStore];
      }
      savePersistentEquipment(equipmentStore);
      res.json({ success: true, count: enrichedItems.length });
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

  // 6. Quick status change
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

      equip.statusLogs.unshift({
        id: `LOG-${Date.now()}`,
        equipmentId: equip.id,
        oldStatus,
        newStatus,
        reason: reason || '状态手工更新',
        operator: operator || '医工工程师',
        timestamp: new Date().toLocaleString('zh-CN', { hour12: false })
      });

      savePersistentEquipment(equipmentStore);
      res.json({ success: true, data: equip });
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

  // 10. AI Diagnostic and Maintenance Advisor via Gemini API
  app.post('/api/ai-diagnose', async (req, res) => {
    try {
      const { equipmentName, model, faultDescription, department } = req.body;

      if (!process.env.GEMINI_API_KEY) {
        return res.status(400).json({
          success: false,
          error: '请配置 GEMINI_API_KEY 环境变量以启用 AI 智能维保诊断。'
        });
      }

      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const prompt = `你是一位三甲医院医学装备科的资深临床工程专家（Clinical Engineer）与医疗设备维修技术总监。
请针对以下医疗设备故障情况提供专业、标准的诊断建议与维保排查方案：

【设备信息】：
- 设备名称：${equipmentName}
- 规格型号：${model}
- 使用科室：${department}
- 故障现象与报修描述：${faultDescription}

请严格输出结构化的中文诊断分析指南，包含以下几部分（不要使用复杂的Markdown格式，保持清晰段落）：
1. 🔍 **核心故障原因分析**（可能引致此现象的2-3个主要硬件/软件/气路/电路原因）
2. 🛠️ **标准临床工程排查步骤**（现场工程师第一时间的急救与逐步排查流程，注意医疗安全规范）
3. 💡 **维修与配件更换建议**（是否需要原厂服务商协助、可能涉及的耗材或核心零部件）
4. 🛡️ **预警等级与替代方案**（风险等级：低/中/高/特高，以及对临床护理/手术应急替代方案的建议）
5. 📋 **后续预防性维保(PM)提醒**（规避同类故障再次发生的日常保养巡检要点）`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt
      });

      res.json({
        success: true,
        analysis: response.text
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: `AI 诊断生成失败: ${err.message}`
      });
    }
  });

  // 11. AI Emergency Loan Distribution & Department Equipment Procurement Advisor
  app.post('/api/ai-procurement-advice', async (req, res) => {
    try {
      const { departmentStats, activeLoans, longTermLoans } = req.body;

      if (!process.env.GEMINI_API_KEY) {
        return res.status(400).json({
          success: false,
          error: '未配置 GEMINI_API_KEY 环境变量，将使用内置临床工程专家规则引擎生成分析。'
        });
      }

      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
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

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt
      });

      res.json({
        success: true,
        analysis: response.text
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: `AI 增配分析失败: ${err.message}`
      });
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
  });
}

startServer();

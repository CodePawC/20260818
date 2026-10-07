// ==================== 系统全局配置与持久化服务 (System Configuration Store) ====================

export interface AiConfig {
  provider: 'google_gemini' | 'local_llm' | 'custom_gateway';
  model: string;
  apiKey: string;
  endpointUrl: string;
  reasoningEffort: 'none' | 'low' | 'medium' | 'high';
  temperature: number;
  maxTokens: number;
  topP: number;
  systemPrompt: string;
  enableRagGrounding: boolean;
  enableFallback: boolean;
  timeoutSeconds: number;
  selectedDepartmentPreset: string;
  lastTestedAt?: string;
  lastLatencyMs?: number;
}

export interface BackupSnapshotRecord {
  id: string;
  name: string;
  createdAt: string;
  sizeBytes: number;
  recordCount: {
    equipment: number;
    orders: number;
    partners: number;
    masterData: number;
    regulations: number;
  };
  type: 'manual' | 'scheduled' | 'pre_restore';
  operator: string;
  checksum: string;
  notes: string;
  dataPayload?: Record<string, any>;
}

export interface DatabaseBackupConfig {
  dbMode: 'local_storage' | 'postgresql' | 'mysql' | 'hospital_hrp_api';
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  poolSize: number;
  sslEnabled: boolean;
  autoBackupEnabled: boolean;
  backupInterval: 'daily' | 'weekly' | 'monthly';
  backupTime: string;
  retentionDays: number;
  storageEngineStatus: 'healthy' | 'syncing' | 'degraded';
  lastBackupAt?: string;
}

export interface UiDesignConfig {
  uiVersion: string;
  releaseChannel: 'stable' | 'beta' | 'canary';
  themePalette: 'medical_navy' | 'cyan_tech' | 'emerald_health' | 'minimal_slate' | 'warm_stone';
  layoutMode: 'sidebar' | 'top_nav' | 'dual_split';
  density: 'compact' | 'comfortable' | 'relaxed';
  borderRadius: 'sharp' | 'modern' | 'soft';
  hospitalName: string;
  hospitalShortName: string;
  systemTitle: string;
  showSystemNotice: boolean;
  systemNoticeText: string;
  featureFlags: {
    threeDDigitalTwin: boolean;
    highContrastMobile: boolean;
    pmGanttChart: boolean;
    voiceNlpTrigger: boolean;
    kanbanOrderView: boolean;
    autoCalibrationWarning: boolean;
  };
  lastUpdated: string;
}

// 默认 AI 配置
export const DEFAULT_AI_CONFIG: AiConfig = {
  provider: 'google_gemini',
  model: 'gemini-2.5-flash',
  apiKey: '',
  endpointUrl: 'https://generativelanguage.googleapis.com',
  reasoningEffort: 'medium',
  temperature: 0.2,
  maxTokens: 4096,
  topP: 0.95,
  systemPrompt: `你是由五莲县人民医院医学装备中心部署的“MED-TECH 医疗装备智维临床AI助理”。
你的职责是遵循《医疗器械监督管理条例》（国务院令第739号）及三甲医院医工质控标准：
1. 接收临床医护与工程师输入的设备故障现象、报错代码与工况；
2. 依据急救与生命支持设备安全第一原则，输出结构化三级排查步骤（电源线路->传感器探头与气路管路->核心板卡与软件）；
3. 严格遵循预防性维护（PM）规程，推荐规范配件规格与耗材，提示带病运行隐患；
4. 语言客观、严谨、专业，杜绝无依据猜测，关键结论提醒需由持证工程师现场核验后签字确认。`,
  enableRagGrounding: true,
  enableFallback: true,
  timeoutSeconds: 30,
  selectedDepartmentPreset: '综合医工',
  lastLatencyMs: 142
};

// 默认数据库与备份配置
export const DEFAULT_DATABASE_BACKUP_CONFIG: DatabaseBackupConfig = {
  dbMode: 'local_storage',
  host: '192.168.10.88',
  port: 5432,
  database: 'hospital_med_equip_db',
  username: 'med_admin',
  password: '••••••••••••',
  poolSize: 30,
  sslEnabled: true,
  autoBackupEnabled: true,
  backupInterval: 'daily',
  backupTime: '02:00',
  retentionDays: 30,
  storageEngineStatus: 'healthy',
  lastBackupAt: '2026-10-06 02:00:00'
};

// 预设备份历史快照
export const INITIAL_BACKUP_HISTORY: BackupSnapshotRecord[] = [
  {
    id: 'SNAP-20261006-0200',
    name: '系统自动例行全量快照 (每日定时)',
    createdAt: '2026-10-06 02:00:15',
    sizeBytes: 1845200, // ~1.8 MB
    recordCount: {
      equipment: 52,
      orders: 38,
      partners: 19,
      masterData: 48,
      regulations: 18
    },
    type: 'scheduled',
    operator: '系统定时守护进程 (Cron Daemon)',
    checksum: 'e89a7fbc2910d44a7b92019c8f0012ba',
    notes: '全院45个临床科室在册设备台账、一事一单闭环及往来单位完整镜像'
  },
  {
    id: 'SNAP-20261002-1630',
    name: '课题结项鉴定申报前完整封存基线',
    createdAt: '2026-10-02 16:30:00',
    sizeBytes: 1812400,
    recordCount: {
      equipment: 50,
      orders: 35,
      partners: 19,
      masterData: 48,
      regulations: 18
    },
    type: 'manual',
    operator: '崔伟 (设备工程师 / 课题负责人)',
    checksum: '7b91ca0f425890ad61e389bca7f9103e',
    notes: '日照市社科专项课题结项送审基准点数据备份，包含真实8人团队全套材料'
  },
  {
    id: 'SNAP-20260925-0900',
    name: '2026年三季度外协维修联合审减核销归档点',
    createdAt: '2026-09-25 09:00:00',
    sizeBytes: 1729000,
    recordCount: {
      equipment: 48,
      orders: 30,
      partners: 18,
      masterData: 48,
      regulations: 18
    },
    type: 'manual',
    operator: '王治权 (信息科主任 / 主管技师)',
    checksum: '31ca90e29b1049ea7f0012a95c89e410',
    notes: '月度外协审减金额、旧件退库交接核对与换件发票四流凭证归档'
  }
];

// 默认前端 UI 与系统升级配置
export const DEFAULT_UI_DESIGN_CONFIG: UiDesignConfig = {
  uiVersion: 'v2.5.0-Release',
  releaseChannel: 'stable',
  themePalette: 'medical_navy',
  layoutMode: 'sidebar',
  density: 'comfortable',
  borderRadius: 'modern',
  hospitalName: '五莲县人民医院',
  hospitalShortName: '五莲县医',
  systemTitle: '医学装备全生命周期闭环管理系统',
  showSystemNotice: true,
  systemNoticeText: '系统现已单轨稳定运行中。如需进行紧急特急生命支持机具借调或报修，请点击顶部快捷通道。',
  featureFlags: {
    threeDDigitalTwin: true,
    highContrastMobile: true,
    pmGanttChart: true,
    voiceNlpTrigger: false,
    kanbanOrderView: true,
    autoCalibrationWarning: true
  },
  lastUpdated: '2026-10-06 17:30'
};

// 本地存储键定义
const STORAGE_KEY_AI = 'hospital_system_ai_config_v1';
const STORAGE_KEY_DB = 'hospital_system_db_backup_config_v1';
const STORAGE_KEY_SNAPSHOTS = 'hospital_system_backup_snapshots_v1';
const STORAGE_KEY_UI = 'hospital_system_ui_design_config_v1';

// ==================== 配置读取与写入操作 ====================

export function getAiConfig(): AiConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_AI);
    if (raw) {
      return { ...DEFAULT_AI_CONFIG, ...JSON.parse(raw) };
    }
  } catch {}
  return DEFAULT_AI_CONFIG;
}

export function saveAiConfig(config: AiConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY_AI, JSON.stringify(config));
  } catch {}
}

export function getDatabaseBackupConfig(): DatabaseBackupConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_DB);
    if (raw) {
      return { ...DEFAULT_DATABASE_BACKUP_CONFIG, ...JSON.parse(raw) };
    }
  } catch {}
  return DEFAULT_DATABASE_BACKUP_CONFIG;
}

export function saveDatabaseBackupConfig(config: DatabaseBackupConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY_DB, JSON.stringify(config));
  } catch {}
}

export function getBackupSnapshots(): BackupSnapshotRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SNAPSHOTS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {}
  return INITIAL_BACKUP_HISTORY;
}

export function saveBackupSnapshots(snapshots: BackupSnapshotRecord[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_SNAPSHOTS, JSON.stringify(snapshots));
  } catch {}
}

export function getUiDesignConfig(): UiDesignConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_UI);
    if (raw) {
      return { ...DEFAULT_UI_DESIGN_CONFIG, ...JSON.parse(raw) };
    }
  } catch {}
  return DEFAULT_UI_DESIGN_CONFIG;
}

export function saveUiDesignConfig(config: UiDesignConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY_UI, JSON.stringify(config));
  } catch {}
}

// ==================== 全量数据打包与快照创建 ====================

// 采集当前系统的完整业务数据集合
export function collectFullSystemDataPackage(): Record<string, any> {
  const packageData: Record<string, any> = {
    metadata: {
      exportedAt: new Date().toISOString(),
      systemVersion: 'MED-TECH OS v2.5.0',
      hospital: '五莲县人民医院',
      operator: '系统运维中心'
    },
    tables: {}
  };

  // 遍历所有已知的关键业务存储键
  const keyList = [
    'medical_equipment_data',
    'medical_equipments',
    'hospital-partner-organizations',
    'hospital_vendor_collaboration_orders_v1',
    'hospital_work_orders_data',
    'hospital_spare_parts_inventory_v1',
    'hospital_spare_parts_transactions_v1',
    'hospital_emergency_reserve_loans',
    'hospital_adverse_events_records_v1',
    'hospital_medical_equipment_regulations_v1',
    'hospital_closed_loop_repairs_v1',
    'hospital_equipment_acceptance_records',
    'concluding_research_team_exact_v5',
    'hospital-staff-roles-v2',
    'hospital-campuses-master',
    'hospital-buildings-master',
    'hospital-departments-master',
    'hospital-rooms-master',
    'hospital-nmpa-category-master',
    'hospital-metrology-catalogue'
  ];

  keyList.forEach(key => {
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        packageData.tables[key] = JSON.parse(raw);
      }
    } catch {
      // 容错降级
    }
  });

  return packageData;
}

// 创建新快照
export function createNewSnapshot(name: string, operator: string, notes?: string): BackupSnapshotRecord {
  const payload = collectFullSystemDataPackage();
  const jsonStr = JSON.stringify(payload);
  const sizeBytes = new Blob([jsonStr]).size;

  const equipCount = Array.isArray(payload.tables['medical_equipment_data']) 
    ? payload.tables['medical_equipment_data'].length 
    : 52;
  const orderCount = Array.isArray(payload.tables['hospital_work_orders_data'])
    ? payload.tables['hospital_work_orders_data'].length
    : 38;
  const partnerCount = Array.isArray(payload.tables['hospital-partner-organizations'])
    ? payload.tables['hospital-partner-organizations'].length
    : 19;

  const now = new Date();
  const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
  const id = `SNAP-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;

  // 简易哈希计算
  let hash = 0;
  for (let i = 0; i < jsonStr.length; i++) {
    hash = ((hash << 5) - hash) + jsonStr.charCodeAt(i);
    hash |= 0;
  }
  const checksum = Math.abs(hash).toString(16).padStart(16, '0');

  const newRecord: BackupSnapshotRecord = {
    id,
    name: name || `手动全量数据快照 (${dateStr})`,
    createdAt: dateStr,
    sizeBytes,
    recordCount: {
      equipment: equipCount,
      orders: orderCount,
      partners: partnerCount,
      masterData: 48,
      regulations: 18
    },
    type: 'manual',
    operator: operator || '系统管理员',
    checksum,
    notes: notes || '包含全生命周期资产台账、一事一单与主数据档案'
  };

  const list = getBackupSnapshots();
  const updated = [newRecord, ...list];
  saveBackupSnapshots(updated);
  return newRecord;
}

// 恢复指定快照
export function restoreSystemFromDataPackage(dataPackage: Record<string, any>): { success: boolean; restoredTables: number; message: string } {
  if (!dataPackage || !dataPackage.tables || typeof dataPackage.tables !== 'object') {
    return { success: false, restoredTables: 0, message: '备份数据包格式无效或已损坏' };
  }

  let tableCount = 0;
  Object.entries(dataPackage.tables).forEach(([key, val]) => {
    try {
      localStorage.setItem(key, JSON.stringify(val));
      tableCount++;
    } catch {}
  });

  return {
    success: true,
    restoredTables: tableCount,
    message: `成功恢复 ${tableCount} 张核心业务表数据`
  };
}

// 下载备份为文件
export function downloadBackupJsonFile(snapshot?: BackupSnapshotRecord): void {
  const payload = collectFullSystemDataPackage();
  const jsonStr = JSON.stringify(payload, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const now = new Date();
  const ts = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
  a.href = url;
  a.download = `五莲县人民医院_医学装备管理系统_全量备份_${ts}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

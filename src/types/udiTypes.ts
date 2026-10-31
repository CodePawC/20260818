// ==================== UDI 国家码与专机专耗全生命周期追溯模型 ====================

export type UdiStandardType = 'GS1' | 'MA' | 'AHM' | 'CUSTOM' | 'UNKNOWN';

export interface UdiParsedResult {
  rawCode: string;
  standard: UdiStandardType;
  isValid: boolean;
  di: string; // (01) 医疗器械唯一标识 / 14位 GTIN
  lotNumber?: string; // (10) 生产批号 (LOT)
  expirationDate?: string; // (17) 失效日期 YYYY-MM-DD
  manufacturingDate?: string; // (11) 生产日期 YYYY-MM-DD
  serialNumber?: string; // (21) 单件序列号 (SN)
  softwareVersion?: string; // (8012) 软件版本
  rawParsedFields: {
    ai: string;
    label: string;
    value: string;
  }[];
  validationErrors?: string[];
  isExpired?: boolean;
}

export type ConsumableCategory = 
  | '高值专机耗材'
  | '专机配套试剂'
  | '呼吸/麻醉专用管路'
  | '内窥镜诊疗附件'
  | '透析穿刺与滤器'
  | '专机超声/穿刺导引'
  | '急救除颤专用电极';

export interface DedicatedConsumableMaster {
  id: string; // e.g. "CON-OLY-001"
  name: string; // e.g. "奥林巴斯一次性活检取样钳"
  spec: string; // e.g. "FB-230U (开幅2.8mm)"
  brand: string; // e.g. "Olympus 奥林巴斯"
  registrationNo: string; // 国械注进20213020089
  diCode: string; // 14位 DI 码, e.g. "04547628001293"
  category: ConsumableCategory;
  unit: string; // e.g. "把", "套", "盒"
  unitPrice: number; // 单价 (元)
  storageRequirement: string; // 常温干燥 / 2-8℃冷藏 / 避光
  sterilizationType: '环氧乙烷灭菌' | '辐照灭菌' | '非无菌供货' | '高温高压' | '高压蒸汽灭菌';
  shelfLifeMonths: number; // 货架有效期 (月)
  stockCount: number; // 院内当前中央总库存
  warningThreshold: number; // 缺货预警水位
  
  // 专机专耗配伍规则白名单
  compatibleEquipmentModels: string[]; // 适配主机型号 e.g. ["CV-290", "GIF-HQ290", "CF-HQ290I"]
  compatibleEquipmentNames: string[]; // 适配设备名称 e.g. ["电子胃镜", "电子结肠镜", "内窥镜图像处理系统"]
  mandatoryMatch: boolean; // 是否强制白名单校验拦截 (true=不符则阻断上机)
  notes?: string;
}

export type ConsumableBindingStatus = 
  | 'in_use'        // 在机运行中
  | 'consumed'      // 已消耗核销 (已用于病患)
  | 'discarded'     // 报废损耗
  | 'recalled'      // 批次不良召回封存
  | 'returned';     // 换货退回

export interface HostConsumableBindingRecord {
  id: string; // e.g. "BIND-20261025-001"
  equipmentId: string; // 目标设备台账ID
  equipmentName: string;
  equipmentModel: string;
  equipmentSn: string;
  equipmentInternalNo?: string;
  department: string;
  room?: string;
  
  consumableId: string;
  consumableName: string;
  consumableSpec: string;
  consumableBrand: string;
  di: string;
  udiCode: string; // 完整扫描条码
  lotNumber: string; // 生产批次 LOT
  expirationDate: string; // 有效期 YYYY-MM-DD
  serialNumber?: string;
  
  bindingTime: string; // 上机时间
  operatorName: string; // 操作经手人 (护士/工程师)
  operatorRole: string; // e.g. "手术室专科护士" / "临床主管"
  
  // 配伍校验反馈
  compatibilityResult: 'matched_verified' | 'cross_model_allowed' | 'strict_mismatched' | 'expired_blocked';
  verificationMessage: string;
  
  // 临床消耗与病案联动 (DRG/病案全闭环)
  status: ConsumableBindingStatus;
  consumedTime?: string;
  patientId?: string; // 住院号 / 门诊号
  patientName?: string; // 患者姓名 (脱敏如 "王*平")
  caseNo?: string; // 电子病历号
  operationRecordNo?: string; // 手术麻醉记录单号
  doctorInCharge?: string; // 主刀 / 主管医生
  
  // 召回处置追踪
  recallFlag?: boolean;
  recallDate?: string;
  recallActionNote?: string;
}

export interface BatchRecallAlert {
  id: string; // e.g. "RCL-2026-NMPA-092"
  recallNoticeNo: string; // 监管或召回函号 e.g. "食药监械召认字[2026]第088号"
  alertSource: '国家药监局NMPA' | '山东省药监局' | '厂家官方召回' | '院内质控风险上报';
  severity: '一级召回 (严重健康威胁)' | '二级召回 (可逆性风险)' | '三级召回 (包装/标签标识瑕疵)';
  targetDi: string;
  targetLotNumber: string; // 召回批次号
  consumableName: string;
  consumableSpec: string;
  manufacturer: string;
  publishDate: string; // YYYY-MM-DD
  recallReason: string;
  actionRequired: string; // 处理指引
  status: 'intercepting' | 'partially_quarantined' | 'completed' | 'closed';
  
  // 穿透统计
  penetrationStats: {
    totalScannedHospitalWide: number;
    activeOnHostsCount: number;
    affectedEquipments: {
      equipmentId: string;
      equipmentName: string;
      equipmentModel: string;
      department: string;
      bindingId: string;
      bindingTime: string;
      status: ConsumableBindingStatus;
    }[];
    inStockCount: number;
    consumedPatientCount: number;
  };
}

// 临床端 10 秒极速流常用动作类型
export type ClinicalQuickActionType = 
  | 'quick_repair'      // 10秒快速报修
  | 'quick_loan'        // 10秒应急借调
  | 'quick_udi_mount'   // 10秒专耗上机
  | 'quick_inspection'  // 10秒极速点检打卡
  | 'quick_recall_check';// 10秒扫码查召回

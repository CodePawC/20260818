import { 
  ThreeWayAuditRecord, 
  OldPartReturnRecord, 
  PartWarrantyRecord, 
  VendorQuarterlyEvaluation 
} from '../types/vendorCollaborationTypes';

const STORAGE_KEY_AUDIT = 'wulian_vendor_three_way_audit';
const STORAGE_KEY_OLD_PARTS = 'wulian_vendor_old_parts';
const STORAGE_KEY_WARRANTY = 'wulian_vendor_parts_warranty';
const STORAGE_KEY_EVALUATION = 'wulian_vendor_quarterly_eval';

// 初始三单勾稽核验底稿数据
export const INITIAL_THREE_WAY_AUDIT_RECORDS: ThreeWayAuditRecord[] = [
  {
    id: 'AUD-2026-0901',
    orderId: 'EXT-202609-001',
    workOrderId: 'WO-2026-0902',
    equipmentName: '西门子 MAGNETOM Prisma 3.0T 磁共振',
    equipmentDept: '医学影像科',
    invoiceNo: '037002300111-88492019',
    invoiceAmount: 68500,
    quotationAmount: 68500,
    reportPartsAmount: 68500,
    discrepancyAmount: 0,
    auditStatus: 'PERFECT_MATCH',
    complianceDocNo: 'AUDIT-WLH-2026-0819',
    auditorName: '李医工 (医学装备部审计专班)',
    auditedAt: '2026-09-17 16:30',
    itemsCheck: [
      { ruleName: '发票价税合计与审定报价单一致性', status: 'PASS', actualValue: '¥68,500.00', standardValue: '¥68,500.00', remark: '完全勾稽一致，无差额' },
      { ruleName: '现场维修报告所换配件与原厂物料编码对应', status: 'PASS', actualValue: 'SIEMENS 10423982 射频功放板', standardValue: 'SIEMENS 10423982', remark: '原厂备件序列号防伪核验无误' },
      { ruleName: '增值税专用发票税控码与销货清单匹配', status: 'PASS', actualValue: '税率13% 专票', standardValue: '医疗设备修理修配劳务13%', remark: '金税系统发票真伪查验通过' },
      { ruleName: '旧件原物退库核验条码', status: 'PASS', actualValue: 'RET-OLD-2026-001', standardValue: '必须退库留痕', remark: '医院中心库房已收讫' }
    ]
  },
  {
    id: 'AUD-2026-0902',
    orderId: 'EXT-202609-002',
    workOrderId: 'WO-2026-0908',
    equipmentName: '瓦里安 Clinac iX 医用直线加速器',
    equipmentDept: '肿瘤放疗中心',
    invoiceNo: '037002300222-99381023',
    invoiceAmount: 182000,
    quotationAmount: 180000,
    reportPartsAmount: 180000,
    discrepancyAmount: 2000,
    auditStatus: 'MINOR_DISCREPANCY',
    complianceDocNo: 'AUDIT-WLH-2026-0824',
    auditorName: '张主任 (医学装备处审价组)',
    auditedAt: '2026-09-18 10:15',
    itemsCheck: [
      { ruleName: '发票价税合计与审定报价单一致性', status: 'WARN', actualValue: '¥182,000.00', standardValue: '¥180,000.00', remark: '发票多出加急调运特快航空运杂费 ¥2,000，已补充联签确认函' },
      { ruleName: '现场维修报告所换配件与原厂物料编码对应', status: 'PASS', actualValue: 'VARIAN 8234-RF 闸流管及组件', standardValue: 'VARIAN 8234-RF', remark: '进口报关单与合格证已查验' },
      { ruleName: '增值税专用发票税控码与销货清单匹配', status: 'PASS', actualValue: '税率13% 专票', standardValue: '13%', remark: '查验通过' },
      { ruleName: '旧件原物退库核验条码', status: 'PASS', actualValue: 'RET-OLD-2026-002', standardValue: '必须退库留痕', remark: '已入设备科铅封报废留存区' }
    ]
  },
  {
    id: 'AUD-2026-0903',
    orderId: 'EXT-202609-003',
    workOrderId: 'WO-2026-0912',
    equipmentName: '奥林巴斯 CV-290 电子胃肠镜系统',
    equipmentDept: '消化内镜中心',
    invoiceNo: '待开票上传',
    invoiceAmount: 0,
    quotationAmount: 42000,
    reportPartsAmount: 42000,
    discrepancyAmount: 0,
    auditStatus: 'PERFECT_MATCH',
    complianceDocNo: 'AUDIT-WLH-2026-0830',
    auditorName: '王工 (设备质控科)',
    auditedAt: '2026-09-18 14:00',
    itemsCheck: [
      { ruleName: '发票价税合计与审定报价单一致性', status: 'PASS', actualValue: '开票流程中', standardValue: '¥42,000.00', remark: '待供应商开具电子专票回传' },
      { ruleName: '现场维修报告所换配件与原厂物料编码对应', status: 'PASS', actualValue: 'OLYMPUS 弯曲橡皮/插入管管路组件', standardValue: '原厂密封件', remark: '水密检测合格' },
      { ruleName: '增值税专用发票税控码与销货清单匹配', status: 'PASS', actualValue: '待验', standardValue: '待验', remark: '待上传后自动秒验' },
      { ruleName: '旧件原物退库核验条码', status: 'PASS', actualValue: 'RET-OLD-2026-003', standardValue: '必须退库留痕', remark: '已移交内镜洗消质控室' }
    ]
  }
];

// 初始旧件退库台账数据
export const INITIAL_OLD_PARTS_RECORDS: OldPartReturnRecord[] = [
  {
    id: 'OLD-PART-001',
    orderId: 'EXT-202609-001',
    workOrderId: 'WO-2026-0902',
    equipmentName: '西门子 3.0T 磁共振 (Prisma)',
    partName: '高频射频功放板 (RF Power Amplifier Board)',
    oldPartBarcode: 'BC-OLD-202609-0018',
    serialNumber: 'SN-RF-202108-DE8892',
    replacedDate: '2026-09-15',
    faultSymptom: '射频发射阻抗漂移，激发脉冲告警导致图像伪影严重，内部管脚烧蚀',
    returnStatus: 'WAREHOUSE_RECEIVED',
    returnDate: '2026-09-16 11:20',
    receivedWarehouse: '医院医学装备部备件库（北区3号精密货架）',
    receiverStaffName: '赵仓管 (工号 6012)',
    shelfLocation: 'A区-03架-02层 (旧件留存封存箱)',
    securitySealCode: 'SEAL-202609-8831'
  },
  {
    id: 'OLD-PART-002',
    orderId: 'EXT-202609-002',
    workOrderId: 'WO-2026-0908',
    equipmentName: '瓦里安直线加速器 (Clinac iX)',
    partName: '陶瓷氢闸流管及脉冲形成网络组件',
    oldPartBarcode: 'BC-OLD-202609-0039',
    serialNumber: 'SN-VAR-THY-2019-9921',
    replacedDate: '2026-09-16',
    faultSymptom: '闸流管高压点火失败率超标，阴极耗尽，微波功率不足',
    returnStatus: 'WAREHOUSE_RECEIVED',
    returnDate: '2026-09-17 15:40',
    receivedWarehouse: '放疗设备备品备件库 (铅封专用柜)',
    receiverStaffName: '孙工 (医学物理师)',
    shelfLocation: '放疗专柜-RAD-B01',
    securitySealCode: 'SEAL-202609-9022'
  },
  {
    id: 'OLD-PART-003',
    orderId: 'EXT-202609-003',
    workOrderId: 'WO-2026-0912',
    equipmentName: '奥林巴斯 CV-290 胃镜系统',
    partName: '老化破损内镜插入管及弯曲网管组件',
    oldPartBarcode: 'BC-OLD-202609-0052',
    serialNumber: 'SN-OLY-INS-2022-019',
    replacedDate: '2026-09-17',
    faultSymptom: '测漏微渗，钳道管轻度折痕，角度钢丝张力衰减',
    returnStatus: 'PENDING_RETURN',
    receivedWarehouse: '内镜中心器械清洗交接室',
    securitySealCode: 'SEAL-PENDING-003'
  },
  {
    id: 'OLD-PART-004',
    orderId: 'EXT-202609-004',
    workOrderId: 'WO-2026-0918',
    equipmentName: '迈瑞 SV800 呼吸机',
    partName: '呼气阀驱动模块及双向压差传感器',
    oldPartBarcode: 'BC-OLD-202609-0077',
    serialNumber: 'SN-MR-FLOW-2023-441',
    replacedDate: '2026-09-18',
    faultSymptom: '流量漂移，定标超时，膜片老化破损',
    returnStatus: 'PENDING_RETURN',
    receivedWarehouse: '重症医学科(ICU)仪器暂存室',
    securitySealCode: 'SEAL-PENDING-004'
  }
];

// 初始配件质保台账与返修预警数据
export const INITIAL_PART_WARRANTY_RECORDS: PartWarrantyRecord[] = [
  {
    id: 'WAR-2026-001',
    orderId: 'EXT-202609-001',
    equipmentName: '西门子 3.0T 磁共振 (Prisma)',
    equipmentDept: '医学影像科',
    partName: '原厂射频功放模块 RF-PA-3.0T',
    partModel: '10423982-S2',
    installDate: '2026-09-15',
    warrantyPeriodMonths: 12,
    warrantyEndDate: '2027-09-14',
    remainingDays: 361,
    status: 'IN_WARRANTY',
    hasReFaultAlarm: false,
    freeReworkEligible: true,
    engineerName: '陈伟 (资深原厂高工)'
  },
  {
    id: 'WAR-2026-002',
    orderId: 'EXT-202609-002',
    equipmentName: '瓦里安直线加速器 (Clinac iX)',
    equipmentDept: '肿瘤放疗中心',
    partName: '高压脉冲调制氢闸流管',
    partModel: 'VAR-8234-X',
    installDate: '2026-09-16',
    warrantyPeriodMonths: 6,
    warrantyEndDate: '2027-03-15',
    remainingDays: 178,
    status: 'IN_WARRANTY',
    hasReFaultAlarm: false,
    freeReworkEligible: true,
    engineerName: '马工 (放疗专机工程师)'
  },
  {
    id: 'WAR-2026-003',
    orderId: 'EXT-202605-018',
    equipmentName: 'GE 64排128层 CT (Optima 660)',
    equipmentDept: '放射科 (CT二室)',
    partName: '探测器数据采集卡 DAS 板卡',
    partModel: 'GE-DAS-2104-E',
    installDate: '2025-10-10',
    warrantyPeriodMonths: 12,
    warrantyEndDate: '2026-10-09',
    remainingDays: 21,
    status: 'EXPIRING_SOON',
    hasReFaultAlarm: false,
    freeReworkEligible: true,
    engineerName: '周工 (影像维护组)'
  },
  {
    id: 'WAR-2026-004',
    orderId: 'EXT-202608-012',
    equipmentName: '飞利浦 EPIQ 7C 心脏彩色多普勒超声',
    equipmentDept: '心血管超声科',
    partName: 'S5-1 单晶体相控阵心脏探头声透镜及线缆',
    partModel: 'PHI-S5-1-C',
    installDate: '2026-08-01',
    warrantyPeriodMonths: 6,
    warrantyEndDate: '2027-01-31',
    remainingDays: 135,
    status: 'IN_WARRANTY',
    hasReFaultAlarm: true, // 触发返修告警测试
    freeReworkEligible: true,
    engineerName: '张明 (超声特约专家)'
  }
];

// 初始供应商季度绩效评价数据 (98.6分，卓越AAA服务商)
export const INITIAL_VENDOR_EVALUATION: VendorQuarterlyEvaluation = {
  vendorId: 'P001',
  quarter: '2026年度第三季度',
  overallScore: 98.6,
  rank: 1,
  totalVendors: 18,
  ratingGrade: 'AAA',
  hospitalAuditSummary: '该单位响应迅速，磁共振及放疗重大故障可在2小时内到场。旧件退库与防伪条码贴附100%合规，三单勾稽无虚假报销，科室满意度高达99.2%。给予下季度竞标免缴投标保证金、技术标免初审加分特权。',
  biddingPrivilege: '免收投标保证金 • 技术标评估+3分 • 紧急大修优先直接议价权',
  verifiedAt: '2026-09-18 10:00 (医学装备处考评办签批)',
  dimensions: [
    { dimension: '紧急响应与到达时效', score: 99.0, fullScore: 100, weight: '25%', evaluationDetail: '平均到场时间1.4小时，优于合同约定的2小时承诺，夜间紧急响应率100%' },
    { dimension: '一次性维修修复率', score: 98.0, fullScore: 100, weight: '25%', evaluationDetail: '30日内无重复同故障发生，修复质量稳定，原厂零备件抽检合格率100%' },
    { dimension: '旧件原样退库合规率', score: 100.0, fullScore: 100, weight: '15%', evaluationDetail: '坏件100%原件装箱扫码入库，序列号与报关单完全吻合，无流失风险' },
    { dimension: '单据发票三单勾稽一致率', score: 99.2, fullScore: 100, weight: '15%', evaluationDetail: '发票、维修报告、审定报价单金额相符，金税税控明细真实合规' },
    { dimension: '临床科室综合满意度', score: 97.5, fullScore: 100, weight: '20%', evaluationDetail: '影像科、放疗中心、急诊ICU护士长及主任无一差评，服务规范礼貌' }
  ]
};

// LocalStorage 读写辅助函数
export function getThreeWayAuditRecords(): ThreeWayAuditRecord[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_AUDIT);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.error('Failed to parse audit records', e);
  }
  return INITIAL_THREE_WAY_AUDIT_RECORDS;
}

export function saveThreeWayAuditRecords(records: ThreeWayAuditRecord[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_AUDIT, JSON.stringify(records));
  } catch (e) {
    console.error('Failed to save audit records', e);
  }
}

export function getOldPartReturnRecords(): OldPartReturnRecord[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_OLD_PARTS);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.error('Failed to parse old parts records', e);
  }
  return INITIAL_OLD_PARTS_RECORDS;
}

export function saveOldPartReturnRecords(records: OldPartReturnRecord[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_OLD_PARTS, JSON.stringify(records));
  } catch (e) {
    console.error('Failed to save old parts records', e);
  }
}

export function getPartWarrantyRecords(): PartWarrantyRecord[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_WARRANTY);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.error('Failed to parse part warranty records', e);
  }
  return INITIAL_PART_WARRANTY_RECORDS;
}

export function savePartWarrantyRecords(records: PartWarrantyRecord[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_WARRANTY, JSON.stringify(records));
  } catch (e) {
    console.error('Failed to save part warranty records', e);
  }
}

export function getVendorQuarterlyEvaluation(): VendorQuarterlyEvaluation {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_EVALUATION);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.error('Failed to parse vendor evaluation', e);
  }
  return INITIAL_VENDOR_EVALUATION;
}

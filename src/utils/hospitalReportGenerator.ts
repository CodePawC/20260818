/**
 * 五莲县人民医院请示报告单 (Hospital Official Request Report) 自动生成与数据管理引擎
 * 针对医院公文体制标准规范，实现维修、采购、大修、报废等业务事项的公文自动起草、数据绑定与印制归档
 * 
 * 核心规范：
 * 1. 工单号复合体系：全量系统码（如 WO-FAC-2026-0546）保证跨年度唯一与业务溯源，
 *    纸质请示报告单显示对应年度工单序列号（如 NO. 546），二者 1:1 双向映射。
 * 2. 科室名称严格调用全院主数据 (Master Data) 中的标准科室名称，严禁擅自修改。
 * 3. 严格遵循真实公文原件排版，纸张底端无额外非公文水印。
 */

import { MedicalEquipment, RepairRecord, AuthUser } from '../types';
import { ApprovalApplication } from '../types/approvalTypes';
import { loadMasterData, DEFAULT_DEPARTMENTS, resolveMasterDepartment } from './masterData';
import { 
  parseWorkOrderCode, 
  formatWorkOrderCode, 
  inferWorkOrderPrefix, 
  WorkOrderPrefixType,
  PREFIX_LABEL_MAP
} from './workOrderCodeGenerator';

export interface SignatureBlockData {
  signed: boolean;
  name?: string;
  role?: string;
  date?: string;
  opinion?: string;
}

export interface HospitalOfficialReportData {
  id: string;                      // 唯一标识 e.g. "REP-DOC-546"
  docNo: string;                   // 顶部文号，对应维修/报修工单号 e.g. "NO. 546"
  workOrderNo?: string;            // 对应的维修/报修工单流水号 (如 "546", "545")
  fullWorkOrderCode?: string;      // 系统标准唯一工单全码 e.g. "WO-FAC-2026-0546"
  workOrderTypeLabel?: string;     // 工单业务类型名称 e.g. "返厂大修工单"
  hospitalName: string;            // 医院抬头 e.g. "五莲县人民医院"
  title: string;                   // 标题 e.g. "五莲县人民医院请示报告单"
  department: string;              // 申报科室 (严格调用主数据中科室名称) e.g. "麻醉手术科"
  subjectUnderlined: string;       // 下划线公文主题 e.g. "麻醉手术科输尿管镜（SN: 826993）维修申请"
  recipient: string;               // 呈报对象 e.g. "院领导："
  body: string;                    // 请示正文 (首行缩进两字符)
  applyDate: string;               // 申报日期 e.g. "2026年08月17日"
  
  // 关联业务系统主体
  equipmentId?: string;
  equipmentName?: string;
  equipmentSn?: string;
  equipmentModel?: string;
  repairId?: string;
  approvalId?: string;
  estimatedCost?: number;
  urgency?: 'normal' | 'urgent' | 'critical';
  category?: 'repair' | 'factory_overhaul' | 'part_replacement' | 'scrap' | 'procurement' | 'other';

  // 四级审签意见区 (对应公文原件版式)
  deptSignature: SignatureBlockData;       // 科室签字：
  vpSignature: SignatureBlockData;         // 分管领导意见：
  presidentSignature: SignatureBlockData;  // 院长意见：
  reviewerSignature: SignatureBlockData;   // 阅办人：

  // 电子防伪与归档
  digitalSealEnabled?: boolean;            // 盖章预览开关
  digitalSealCertNo?: string;              // 电子公文验证哈希
  createdAt: string;
  updatedAt: string;
}

const STORAGE_KEY = 'hospital_official_reports_v1';

/**
 * 校验并获取全院主数据中已定义的合法标准科室名称
 */
export function getCanonicalMasterDepartmentName(rawName?: string): string {
  if (!rawName) return '麻醉手术科';
  const clean = rawName.trim();
  const allDepts = loadMasterData().departments || DEFAULT_DEPARTMENTS;
  const matched = resolveMasterDepartment(clean, allDepts);
  if (matched) return matched.name;
  
  const fallback = DEFAULT_DEPARTMENTS.find(d => d.name === clean);
  return fallback ? fallback.name : clean;
}

/**
 * 将维修工单/报修工单编号映射为公文对应的编号及标准全量编码
 */
export function resolveWorkOrderDocNo(
  workOrderIdOrNumber?: string, 
  fallbackNo: number = 546,
  prefix: WorkOrderPrefixType = 'FAC',
  useFullCodeInDoc: boolean = true
): { docNo: string; workOrderNo: string; fullWorkOrderCode: string; workOrderTypeLabel: string; shortDocNo: string } {
  const parsed = parseWorkOrderCode(workOrderIdOrNumber || String(fallbackNo), prefix, 2026, useFullCodeInDoc);
  return {
    docNo: parsed.paperDocNo, // 规范全码格式 e.g. "NO. WO-FAC-2026-0546"
    workOrderNo: parsed.fullCode,
    fullWorkOrderCode: parsed.fullCode,
    workOrderTypeLabel: parsed.prefixLabel,
    shortDocNo: parsed.shortDocNo
  };
}

/**
 * 对应维修工单 546 (全码 WO-FAC-2026-0546) 的请示报告单种子数据
 * 采用专业规范全码，清晰区分业务类别 (返厂大修/抢修/换件等)
 */
export const SEED_REPORT_546: HospitalOfficialReportData = {
  id: 'REP-DOC-546',
  docNo: 'NO. WO-FAC-2026-0546',
  workOrderNo: 'WO-FAC-2026-0546',
  fullWorkOrderCode: 'WO-FAC-2026-0546',
  workOrderTypeLabel: '返厂大修',
  hospitalName: '五莲县人民医院',
  title: '五莲县人民医院请示报告单',
  department: '麻醉手术科', // 严格调用主数据科室名称
  subjectUnderlined: '麻醉手术科输尿管镜（SN: 826993）维修申请',
  recipient: '院领导：',
  body: '输尿管镜（SN: 826993）视向模糊且插入部卡顿，无法开展泌尿外科微创碎石手术，申请联系专业维修并更换配件，以恢复手术正常周转。恳请审批！',
  applyDate: '2026年08月17日',
  equipmentId: 'EQ-2023-09855',
  equipmentName: '德国狼牌输尿管硬镜',
  equipmentSn: '826993',
  equipmentModel: 'Richard Wolf 8703.534',
  estimatedCost: 14200,
  urgency: 'critical',
  category: 'factory_overhaul',
  deptSignature: {
    signed: true,
    name: '黄晓彤 (护士长/科主任)',
    role: '麻醉手术科主任',
    date: '2026-08-17',
    opinion: '情况属实，该输尿管镜为泌尿外科急症手术核心器械，停机将直接影响手术周转，同意提请院领导审批返厂大修。'
  },
  vpSignature: {
    signed: true,
    name: '李建军 (副院长)',
    role: '分管医疗副院长',
    date: '2026-08-18',
    opinion: '同意麻醉科申请。请医学装备科核实外修资质与比价方案，确保临床救治需求。'
  },
  presidentSignature: {
    signed: false,
    name: '',
    role: '院长',
    date: '',
    opinion: ''
  },
  reviewerSignature: {
    signed: true,
    name: '崔伟 (医学装备科)',
    role: '阅办工程师',
    date: '2026-08-18'
  },
  digitalSealEnabled: false,
  digitalSealCertNo: 'WLH-DOC-2026-0817-0546',
  createdAt: '2026-08-17T08:30:00.000Z',
  updatedAt: '2026-08-18T10:15:00.000Z'
};

/**
 * 对应维修工单 545 的原版请示报告单种子数据
 */
export const SEED_REPORT_545: HospitalOfficialReportData = {
  ...SEED_REPORT_546,
  id: 'REP-DOC-545',
  docNo: 'NO. WO-FAC-2026-0545',
  workOrderNo: 'WO-FAC-2026-0545',
  fullWorkOrderCode: 'WO-FAC-2026-0545',
  digitalSealCertNo: 'WLH-DOC-2026-0817-0545'
};

/**
 * 读取本地存储的所有请示报告单
 */
export function loadHospitalOfficialReports(): HospitalOfficialReportData[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([SEED_REPORT_546, SEED_REPORT_545]));
      return [SEED_REPORT_546, SEED_REPORT_545];
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return [SEED_REPORT_546, SEED_REPORT_545];
  } catch (err) {
    console.error('Failed to load hospital official reports', err);
    return [SEED_REPORT_546, SEED_REPORT_545];
  }
}

/**
 * 保存请示报告单列表
 */
export function saveHospitalOfficialReports(reports: HospitalOfficialReportData[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(reports));
  } catch (err) {
    console.error('Failed to save hospital official reports', err);
  }
}

/**
 * 自动生成下一个维修工单对应的公文文号，例如 "NO. 547"
 */
export function generateNextDocNo(existingReports: HospitalOfficialReportData[]): string {
  let maxNo = 546;
  existingReports.forEach(r => {
    const match = r.docNo.match(/\d+/);
    if (match) {
      const num = parseInt(match[0], 10);
      if (num > maxNo) maxNo = num;
    }
  });
  return `NO. ${maxNo + 1}`;
}

/**
 * 从设备档案自动生成规范公文
 * 保证科室名称完全采用主数据名称，且编号对应报修工单号
 */
export function generateReportFromEquipment(
  equipment: MedicalEquipment,
  customReason?: string,
  category: HospitalOfficialReportData['category'] = 'repair',
  currentUser?: AuthUser | null,
  workOrderNo?: string
): HospitalOfficialReportData {
  const dept = getCanonicalMasterDepartmentName(equipment.department);
  const snDisplay = equipment.sn || equipment.id;
  const nameDisplay = equipment.name;

  const prefix = inferWorkOrderPrefix(category, undefined, nameDisplay);
  const activeRepair = equipment.repairRecords && equipment.repairRecords.length > 0 ? equipment.repairRecords[0] : null;
  const resolved = resolveWorkOrderDocNo(workOrderNo || activeRepair?.id, 546, prefix);

  let bodyText = '';
  let subjectText = '';

  const isEndoscope = 
    nameDisplay.includes('镜') || 
    nameDisplay.includes('腔镜') || 
    equipment.category.includes('内窥镜') || 
    equipment.categoryNo === '06';

  if (isEndoscope) {
    subjectText = `${dept}${nameDisplay}（SN: ${snDisplay}）维修申请`;
    bodyText = customReason 
      ? `${nameDisplay}（SN: ${snDisplay}）${customReason}，无法开展临床正常微创手术，申请联系专业维修并更换配件，以恢复手术正常周转。恳请审批！`
      : `${nameDisplay}（SN: ${snDisplay}）视向模糊且插入部卡顿，无法开展微创腔镜手术，申请联系专业原厂/授权机构维修并更换配件，以恢复科室手术正常周转。恳请审批！`;
  } else if (nameDisplay.includes('CT') || nameDisplay.includes('磁共振') || nameDisplay.includes('DSA')) {
    subjectText = `${dept}${nameDisplay}（SN: ${snDisplay}）核心配件更换与维保请示`;
    bodyText = customReason
      ? `${nameDisplay}（SN: ${snDisplay}）${customReason}。该大型影像设备为医院临床诊断重要支撑，申请批准实施抢修并更换配件，确保急诊与住院检查平稳运行。恳请审批！`
      : `${nameDisplay}（SN: ${snDisplay}）球管/高压发生器出现严重伪影与报错，系统带载异常无法出诊。申请联系专业工程师进场检测并更换配件，以恢复日常检查接诊能力。恳请审批！`;
  } else if (nameDisplay.includes('呼吸机') || nameDisplay.includes('除颤') || nameDisplay.includes('监护')) {
    subjectText = `${dept}${nameDisplay}（SN: ${snDisplay}）急救生命支持设备抢修请示`;
    bodyText = customReason
      ? `${nameDisplay}（SN: ${snDisplay}）${customReason}。该设备为生命支持抢救器械，申请开辟绿色通道紧急维修并置换备件，确保医疗安全。恳请审批！`
      : `${nameDisplay}（SN: ${snDisplay}）传感器与通气回路压力报警，自检未通过无法继续临床使用。申请联系专业维保并加急处理，恢复急危重症抢救待命状态。恳请审批！`;
  } else {
    subjectText = `${dept}${nameDisplay}（SN: ${snDisplay}）设备维修与维护请示`;
    bodyText = customReason
      ? `${nameDisplay}（SN: ${snDisplay}）${customReason}，为确保临床诊疗正常运转，申请联系专业维修并更换相应配件。恳请审批！`
      : `${nameDisplay}（SN: ${snDisplay}）近期出现硬件故障停机，无法满足科室日常诊疗业务需求，申请联系专业维修并更换故障备件，恢复正常运行。恳请审批！`;
  }

  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const dateStr = `${year}年${month}月${day}日`;
  const dateIso = `${year}-${month}-${day}`;

  const report: HospitalOfficialReportData = {
    id: `REP-DOC-${resolved.workOrderNo}`,
    docNo: resolved.docNo,
    workOrderNo: resolved.workOrderNo,
    fullWorkOrderCode: resolved.fullWorkOrderCode,
    workOrderTypeLabel: resolved.workOrderTypeLabel,
    hospitalName: '五莲县人民医院',
    title: '五莲县人民医院请示报告单',
    department: dept,
    subjectUnderlined: subjectText,
    recipient: '院领导：',
    body: bodyText,
    applyDate: dateStr,
    equipmentId: equipment.id,
    equipmentName: equipment.name,
    equipmentSn: equipment.sn,
    equipmentModel: equipment.model,
    estimatedCost: equipment.purchasePrice > 100000 ? 15000 : 3500,
    urgency: 'urgent',
    category,
    deptSignature: {
      signed: Boolean(currentUser),
      name: currentUser ? `${currentUser.name} (${currentUser.role})` : `${dept}责任人`,
      role: currentUser?.role || '科室负责人',
      date: dateIso,
      opinion: '情况属实，急需修复以保障科室正常临床诊疗工作，同意提请院领导审批。'
    },
    vpSignature: {
      signed: false,
      name: '',
      role: '分管院长',
      date: '',
      opinion: ''
    },
    presidentSignature: {
      signed: false,
      name: '',
      role: '院长',
      date: '',
      opinion: ''
    },
    reviewerSignature: {
      signed: false,
      name: '',
      role: '阅办人',
      date: ''
    },
    digitalSealEnabled: false,
    digitalSealCertNo: `WLH-DOC-${year}${month}${day}-${resolved.workOrderNo}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  return report;
}

/**
 * 从报修工单自动生成请示报告单
 * 编号直接对应维修工单/报修工单号
 */
export function generateReportFromRepair(
  repair: RepairRecord,
  equipment?: MedicalEquipment,
  currentUser?: AuthUser | null
): HospitalOfficialReportData {
  const dept = getCanonicalMasterDepartmentName(repair.department || equipment?.department);
  const snDisplay = repair.equipmentSn || equipment?.sn || '826993';
  const nameDisplay = repair.equipmentName || equipment?.name || '医疗器械';

  const prefix = inferWorkOrderPrefix('repair', undefined, nameDisplay);
  const resolved = resolveWorkOrderDocNo(repair.id, 546, prefix);

  const subjectText = `${dept}${nameDisplay}（SN: ${snDisplay}）维修申请`;
  const faultDesc = repair.faultDescription || '视向模糊且插入部卡顿，无法开展正常手术';
  const bodyText = `${nameDisplay}（SN: ${snDisplay}）${faultDesc}，无法开展正常临床业务，申请联系专业维修并更换配件，以恢复科室正常周转。恳请审批！`;

  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');

  return {
    id: `REP-DOC-${resolved.workOrderNo}`,
    docNo: resolved.docNo,
    workOrderNo: resolved.workOrderNo,
    fullWorkOrderCode: resolved.fullWorkOrderCode,
    workOrderTypeLabel: resolved.workOrderTypeLabel,
    hospitalName: '五莲县人民医院',
    title: '五莲县人民医院请示报告单',
    department: dept,
    subjectUnderlined: subjectText,
    recipient: '院领导：',
    body: bodyText,
    applyDate: `${year}年${month}月${day}日`,
    equipmentId: repair.equipmentId,
    equipmentName: nameDisplay,
    equipmentSn: snDisplay,
    equipmentModel: equipment?.model,
    repairId: repair.id,
    estimatedCost: repair.cost || 12000,
    urgency: 'urgent',
    category: 'repair',
    deptSignature: {
      signed: true,
      name: currentUser ? `${currentUser.name} (${currentUser.role})` : `${dept}负责人`,
      role: '科室主任',
      date: `${year}-${month}-${day}`,
      opinion: '故障影响临床诊疗，申请加急外修处理。'
    },
    vpSignature: { signed: false },
    presidentSignature: { signed: false },
    reviewerSignature: { signed: false },
    digitalSealEnabled: false,
    digitalSealCertNo: `WLH-DOC-${year}${month}${day}-${resolved.workOrderNo}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

/**
 * 从审批单 (ApprovalApplication) 自动生成请示报告单
 */
export function generateReportFromApproval(
  approval: ApprovalApplication,
  equipment?: MedicalEquipment,
  currentUser?: AuthUser | null
): HospitalOfficialReportData {
  const dept = getCanonicalMasterDepartmentName(approval.applicantDepartment || equipment?.department);
  const snDisplay = approval.equipmentSn || equipment?.sn || '826993';
  const nameDisplay = approval.equipmentName || equipment?.name || '医疗器械';

  const prefix = inferWorkOrderPrefix(undefined, approval.type, nameDisplay);
  const resolved = resolveWorkOrderDocNo(approval.id, 546, prefix);

  let subjectText = `${dept}${nameDisplay}（SN: ${snDisplay}）维修申请`;
  if (approval.type === 'return_factory_repair') {
    subjectText = `${dept}${nameDisplay}（SN: ${snDisplay}）返厂大修与配件更换申请`;
  } else if (approval.type === 'part_replacement') {
    subjectText = `${dept}${nameDisplay}（SN: ${snDisplay}）核心配件更换请示`;
  } else if (approval.type === 'scrap_disposal') {
    subjectText = `${dept}${nameDisplay}（SN: ${snDisplay}）技术鉴定与报废处置请示`;
  }

  const faultDesc = approval.faultSymptoms || approval.technicalAssessment || approval.technicalEvaluation || approval.clinicalNecessityReason || '出现机械卡顿与光学异常，无法满足临床手术需求';
  const bodyText = `${nameDisplay}（SN: ${snDisplay}）${faultDesc}，无法开展临床手术与检查，申请联系专业维修并更换配件，以恢复手术正常周转。恳请审批！`;

  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');

  const auditLogs = approval.auditLogs || [];
  const deptAudit = auditLogs.find(a => a.nodeName.includes('科室') && a.action === 'agreed');
  const engAudit = auditLogs.find(a => (a.nodeName.includes('医工') || a.nodeName.includes('论证')) && a.action === 'agreed');
  const vpAudit = auditLogs.find(a => (a.nodeName.includes('副院长') || a.nodeName.includes('分管')) && a.action === 'agreed');
  const presAudit = auditLogs.find(a => (a.nodeName.includes('院长') || a.nodeName.includes('终审')) && a.action === 'agreed');

  return {
    id: `REP-DOC-${resolved.workOrderNo}`,
    docNo: resolved.docNo,
    workOrderNo: resolved.workOrderNo,
    fullWorkOrderCode: resolved.fullWorkOrderCode,
    workOrderTypeLabel: resolved.workOrderTypeLabel,
    hospitalName: '五莲县人民医院',
    title: '五莲县人民医院请示报告单',
    department: dept,
    subjectUnderlined: subjectText,
    recipient: '院领导：',
    body: bodyText,
    applyDate: `${year}年${month}月${day}日`,
    equipmentId: approval.equipmentId,
    equipmentName: nameDisplay,
    equipmentSn: snDisplay,
    approvalId: approval.id,
    estimatedCost: approval.estimatedBudget || 14200,
    urgency: approval.urgency === 'critical' ? 'critical' : 'urgent',
    category: approval.type === 'return_factory_repair' ? 'factory_overhaul' : 'repair',
    deptSignature: {
      signed: Boolean(deptAudit),
      name: deptAudit ? `${deptAudit.operatorName} (${deptAudit.operatorRole})` : (currentUser ? `${currentUser.name}` : ''),
      role: '科室主任',
      date: deptAudit ? deptAudit.operatedAt.split('T')[0] : `${year}-${month}-${day}`,
      opinion: deptAudit?.comment || '情况属实，急需修复以保障科室正常临床诊疗工作。'
    },
    vpSignature: {
      signed: Boolean(vpAudit),
      name: vpAudit ? `${vpAudit.operatorName} (${vpAudit.operatorRole})` : '',
      role: '分管领导',
      date: vpAudit ? vpAudit.operatedAt.split('T')[0] : '',
      opinion: vpAudit?.comment || ''
    },
    presidentSignature: {
      signed: Boolean(presAudit),
      name: presAudit ? `${presAudit.operatorName} (${presAudit.operatorRole})` : '',
      role: '院长',
      date: presAudit ? presAudit.operatedAt.split('T')[0] : '',
      opinion: presAudit?.comment || ''
    },
    reviewerSignature: {
      signed: Boolean(engAudit),
      name: engAudit ? `${engAudit.operatorName}` : '',
      role: '阅办人',
      date: engAudit ? engAudit.operatedAt.split('T')[0] : ''
    },
    digitalSealEnabled: Boolean(presAudit && vpAudit),
    digitalSealCertNo: `WLH-DOC-${year}${month}${day}-${resolved.workOrderNo}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

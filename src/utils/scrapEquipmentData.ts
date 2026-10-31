import { EquipmentScrapOrder, ScrapReasonType, ScrapWorkflowStage } from '../types/scrapTypes';
import { MedicalEquipment } from '../types';

const SCRAP_STORAGE_KEY = 'med_equipment_scrap_orders_v1';

export const INITIAL_SCRAP_ORDERS: EquipmentScrapOrder[] = [
  {
    id: 'SCRAP-2026-001',
    applicationNo: 'BF-202610-003',
    equipmentId: 'eq-scrap-old-ct-01',
    assetNumber: 'ZC-2013-0881',
    equipmentName: '单螺旋16层计算机断层扫描仪 (CT)',
    model: 'Somatom Emotion 16',
    department: '医学影像科',
    purchaseDate: '2013-05-18',
    originalValue: 3200000,
    netBookValue: 120000,
    accumulatedDepreciation: 3080000,
    accumulatedRepairCost: 1850000,
    repairToValueRatio: 57.8,
    actualUsageYears: 13.4,
    ratedLifespanYears: 8,
    applicantName: '赵振华 (影像科主任)',
    applicantPhone: '13863391022',
    scrapReasonType: 'exceeded_lifespan',
    scrapReasonDetail: '该CT主机已服役超过13年（超折旧年限5年），球管与探测器老化严重，伪影严重影响微小病灶诊断；原厂已于2022年终止零配件供应，累计维修维护费用已超原值57%，无修复价值。',
    applicationDate: '2026-10-12',
    stage: 'disposal_auction_destruction',
    technicalAppraisalNotes: '经医学工程部现场联合厂家资深工程师评估：主球管高压发生器绝缘击穿，机架轴承磨损严重，几何精度严重失准，且国家已将其列入重点淘汰低效高耗能目录，一致鉴定为不可逆技术损坏，建议予以报废。',
    appraiserEngineer: '李思齐 (高级工程师)',
    appraisalDate: '2026-10-15',
    appraisalRating: 'scrap_mandatory',
    expertSignatures: [
      {
        role: 'clinical_director',
        roleTitle: '申请科室主任',
        userName: '赵振华',
        verdict: 'approved',
        comment: '同意报废，科室已配置新型64排128层CT保障常规与心血管检查需求。',
        signatureDate: '2026-10-13 10:20',
        signatureImageBase64: '赵振华'
      },
      {
        role: 'biomedical_engineer',
        roleTitle: '医工技术鉴定人',
        userName: '李思齐',
        verdict: 'approved',
        comment: '技术鉴定属实，电气安全绝缘耐压未达标，存在漏电与过热起火隐患，符合法定报废条件。',
        signatureDate: '2026-10-15 15:40',
        signatureImageBase64: '李思齐'
      },
      {
        role: 'equipment_director',
        roleTitle: '医学装备科科长',
        userName: '孙建国',
        verdict: 'approved',
        comment: '经科务会审核，符合国有资产处置管理办法第十八条，准予呈报院委会。',
        signatureDate: '2026-10-16 09:10',
        signatureImageBase64: '孙建国'
      },
      {
        role: 'finance_director',
        roleTitle: '财务资产管理科长',
        userName: '周立新',
        verdict: 'approved',
        comment: '财务账目核实：已提足折旧，账面净值12万元，已做好固定资产处置税费测算。',
        signatureDate: '2026-10-17 11:30',
        signatureImageBase64: '周立新'
      },
      {
        role: 'vp_medical_technology',
        roleTitle: '分管医技业务副院长',
        userName: '崔维 (分管副院长)',
        verdict: 'approved',
        comment: '经院院长办公会审议通过，同意报废并报请县卫健局及财政国资部门批复。',
        signatureDate: '2026-10-18 16:00',
        signatureImageBase64: '崔维'
      }
    ],
    hazardClearance: {
      hasRadiationSource: true,
      radiationTransferPermitNo: '鲁辐转字[2026]第0882号 (射线装置注销与球管无害化交接批文)',
      hasHeavyMetalsOrMercury: true,
      heavyMetalRecycleAgency: '山东中再生环保科技有限公司 (资质证书编号: SD-HW-2024-099)',
      dataSecuritySanitized: true,
      sanitizerEngineer: '陈伟 (已对工作站机械硬盘执行物理消磁与格式化销毁)'
    },
    fiscalApprovalBatchNo: '五财资批[2026]45号',
    approvalDate: '2026-10-22',
    disposalMethod: 'auction_transfer',
    disposalAgencyName: '日照宏源医疗再生资源回收拍卖有限公司',
    disposalContractNo: 'HY-CZ-2026-1019',
    salvageAmount: 68000,
    disposalDate: '2026-10-26',
    disposalCertificateUrl: 'CZ-RECEIPT-2026-0881.pdf',
    isLedgerDeregistered: true,
    deregisteredAt: '2026-10-26 17:00',
    deregisteredBy: '周立新 (财务固定资产管理员)',
    createdAt: '2026-10-12 09:00',
    updatedAt: '2026-10-26 17:00'
  },
  {
    id: 'SCRAP-2026-002',
    applicationNo: 'BF-202610-005',
    equipmentId: 'eq-scrap-dialysis-02',
    assetNumber: 'ZC-2015-1104',
    equipmentName: '血液透析滤过机',
    model: 'Dialog+ 710200L',
    department: '血液净化科',
    purchaseDate: '2015-09-08',
    originalValue: 245000,
    netBookValue: 12250,
    accumulatedDepreciation: 232750,
    accumulatedRepairCost: 148000,
    repairToValueRatio: 60.4,
    actualUsageYears: 11.1,
    ratedLifespanYears: 8,
    applicantName: '李秀敏 (血液净化护士长)',
    applicantPhone: '13963384511',
    scrapReasonType: 'maintenance_cost_excessive',
    scrapReasonDetail: '该血透机水路主板多次发生电磁阀泄漏烧毁，超滤精度偏差超过国家临界安全标准（误差 >±5%），且近两年连续更换主板及传感器花费达14.8万元，已超过原值60%，为保障患者生命安全，申请技术报废。',
    applicationDate: '2026-10-23',
    stage: 'expert_committee_review',
    technicalAppraisalNotes: '经拆机检测：超滤平衡腔陶瓷内壁严重磨损失圆，内部管路反复消毒脆化开裂，无法稳定通过压力维持测试；继续修复需定制全套水路系统约11万元，已严重丧失维修经济性，鉴定结论为必须报废。',
    appraiserEngineer: '张维良 (主任工程师)',
    appraisalDate: '2026-10-25',
    appraisalRating: 'scrap_mandatory',
    expertSignatures: [
      {
        role: 'clinical_director',
        roleTitle: '申请科室主任',
        userName: '王建平',
        verdict: 'approved',
        comment: '临床同意报废，严守医疗安全红线，绝不让带病血透机上机操作。',
        signatureDate: '2026-10-24 11:00',
        signatureImageBase64: '王建平'
      },
      {
        role: 'biomedical_engineer',
        roleTitle: '医工技术鉴定人',
        userName: '张维良',
        verdict: 'approved',
        comment: '水路平衡与超滤安全失准不可逆，维修不具备技术与经济可行性。',
        signatureDate: '2026-10-25 14:30',
        signatureImageBase64: '张维良'
      },
      {
        role: 'equipment_director',
        roleTitle: '医学装备科科长',
        userName: '孙建国',
        verdict: 'approved',
        comment: '审核通过，建议进入院专家联审及财务合规报审程序。',
        signatureDate: '2026-10-26 10:15',
        signatureImageBase64: '孙建国'
      },
      {
        role: 'finance_director',
        roleTitle: '财务资产管理科长',
        userName: '周立新',
        verdict: 'pending',
        comment: '待审核折旧余额与年度国资报废批次指标。'
      },
      {
        role: 'vp_medical_technology',
        roleTitle: '分管医技业务副院长',
        userName: '崔维 (分管副院长)',
        verdict: 'pending',
        comment: '待财务联签后审批。'
      }
    ],
    hazardClearance: {
      hasRadiationSource: false,
      hasHeavyMetalsOrMercury: false,
      dataSecuritySanitized: true,
      sanitizerEngineer: '张维良 (患者治疗历史记录已完成脱敏导出并永久清空)'
    },
    isLedgerDeregistered: false,
    createdAt: '2026-10-23 10:00',
    updatedAt: '2026-10-26 10:15'
  }
];

export function getScrapOrders(): EquipmentScrapOrder[] {
  try {
    const raw = localStorage.getItem(SCRAP_STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Failed to load scrap orders from localStorage', e);
  }
  return INITIAL_SCRAP_ORDERS;
}

export function saveScrapOrders(orders: EquipmentScrapOrder[]): void {
  try {
    localStorage.setItem(SCRAP_STORAGE_KEY, JSON.stringify(orders));
  } catch (e) {
    console.error('Failed to persist scrap orders', e);
  }
}

export function createScrapOrderFromEquipment(
  equipment: MedicalEquipment,
  applicantName: string,
  applicantPhone: string,
  reasonType: ScrapReasonType,
  reasonDetail: string
): EquipmentScrapOrder {
  const currentYear = new Date().getFullYear();
  const buyYear = equipment.purchaseDate ? new Date(equipment.purchaseDate).getFullYear() : (currentYear - 8);
  const actualUsageYears = Math.max(1, currentYear - buyYear);
  const originalValue = equipment.purchasePrice || 85000;
  const netBookValue = Math.max(1000, Math.round(originalValue * 0.05));
  const accumulatedDepreciation = originalValue - netBookValue;

  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  const orderId = `SCRAP-${now.getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

  const newOrder: EquipmentScrapOrder = {
    id: orderId,
    applicationNo: `BF-${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}-${Math.floor(10 + Math.random() * 90)}`,
    equipmentId: equipment.id,
    assetNumber: equipment.assetNo || equipment.id,
    equipmentName: equipment.name,
    model: equipment.model || '通用型号',
    department: equipment.department || '未分配科室',
    purchaseDate: equipment.purchaseDate || `${buyYear}-01-01`,
    originalValue,
    netBookValue,
    accumulatedDepreciation,
    accumulatedRepairCost: Math.round(originalValue * 0.42),
    repairToValueRatio: 42.0,
    actualUsageYears,
    ratedLifespanYears: 8,
    applicantName,
    applicantPhone,
    scrapReasonType: reasonType,
    scrapReasonDetail: reasonDetail,
    applicationDate: dateStr,
    stage: 'technical_appraisal',
    technicalAppraisalNotes: '',
    appraiserEngineer: '李思齐',
    appraisalRating: 'scrap_mandatory',
    expertSignatures: [
      {
        role: 'clinical_director',
        roleTitle: '申请科室主任',
        userName: applicantName,
        verdict: 'approved',
        comment: '科室已核准实际工况，确已达到技术寿命上限，同意报废。',
        signatureDate: `${dateStr} ${timeStr}`,
        signatureImageBase64: applicantName
      },
      {
        role: 'biomedical_engineer',
        roleTitle: '医工技术鉴定人',
        userName: '李思齐',
        verdict: 'pending',
        comment: '待实测电气与核心指标'
      },
      {
        role: 'equipment_director',
        roleTitle: '医学装备科科长',
        userName: '孙建国',
        verdict: 'pending',
        comment: '待医工技术鉴定'
      },
      {
        role: 'finance_director',
        roleTitle: '财务资产管理科长',
        userName: '周立新',
        verdict: 'pending',
        comment: '待审核折旧资产清单'
      },
      {
        role: 'vp_medical_technology',
        roleTitle: '分管医技业务副院长',
        userName: '崔维 (分管副院长)',
        verdict: 'pending',
        comment: '待院务会审批'
      }
    ],
    hazardClearance: {
      hasRadiationSource: equipment.name.includes('CT') || equipment.name.includes('DR') || equipment.name.includes('光机') || equipment.name.includes('DSA'),
      hasHeavyMetalsOrMercury: false,
      dataSecuritySanitized: false
    },
    isLedgerDeregistered: false,
    createdAt: `${dateStr} ${timeStr}`,
    updatedAt: `${dateStr} ${timeStr}`
  };

  const existing = getScrapOrders();
  const next = [newOrder, ...existing];
  saveScrapOrders(next);
  return newOrder;
}

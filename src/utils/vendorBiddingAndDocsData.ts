import { 
  BiddingProject, 
  BidSubmission, 
  CorporateQualification, 
  StructuredDocumentRecord 
} from '../types/vendorCollaborationTypes';

// ==================== 初始医疗设备竞价招标项目 ====================
export const INITIAL_BIDDING_PROJECTS: BiddingProject[] = [
  {
    id: 'BID-2026-001',
    title: '2026年度医学影像科 GE 3.0T 超导磁共振冷头与射频线圈定期维保及备件保障竞价',
    category: 'ANNUAL_MAINTENANCE',
    department: '医学影像科',
    publishDate: '2026-09-10',
    deadlineDate: '2026-09-25 17:00',
    maxBudget: 280000,
    urgency: 'HIGH',
    status: 'OPEN',
    description: '针对我院 GE Signa Pioneer 3.0T 超导磁共振系统，公开遴选具备原厂认证或国家三级资质的服务商，提供为期1年的冷头氦气监控、射频功放板及梯度线圈预防性维护、备件现货供应及7×24小时应急保修响应。',
    technicalRequirements: [
      '投标人须具备特种设备或大型医用设备三级及以上维保资质，具有 GE 医疗体系培训证书',
      '承诺提供原厂或同等性能认证合格配件，附带厂家合格质检证书',
      '市区内紧急报修2小时内工程师到场，4小时内拿出明确排查方案',
      '主要更换关键部件质保期不低于12个月'
    ],
    equipmentList: [
      {
        id: 'REQ-01',
        equipmentName: '3.0T 超导型超导磁共振系统',
        model: 'GE Signa Pioneer 3.0T',
        department: '医学影像科 / 磁共振室',
        faultSymptomOrScope: '整机冷头循环效率下降，射频发射链路阻抗微漂移，需年保及原装备件定向保障',
        expectedDeliveryDays: 365
      }
    ],
    allowSubcontracting: false,
    minWarrantyMonths: 12,
    bidsCount: 3,
  },
  {
    id: 'BID-2026-002',
    title: '全院各监护病房 (ICU/CCU/急诊) 迈瑞生命支持设备年度耗材及主板配件集中采购竞价',
    category: 'SPARE_PARTS',
    department: '重症医学科 (ICU) / 急诊科',
    publishDate: '2026-09-12',
    deadlineDate: '2026-09-22 12:00',
    maxBudget: 150000,
    urgency: 'HIGH',
    status: 'OPEN',
    description: '采购包含迈瑞 BeneVision N 系列高端监护仪电源模块、主控按键板、血氧/心电模块及除颤仪电池电极板总成一批，要求全原装合格配件，按季分批到货结算。',
    technicalRequirements: [
      '所有配件须出具医疗器械生产厂家出厂检验合格单及防伪编码',
      '提供免费送货上门及原厂认证工程师免费调试指导',
      '质保期12个月，出现质量问题48小时内无条件免费换新'
    ],
    equipmentList: [
      {
        id: 'REQ-02',
        equipmentName: '迈瑞高端病人监护仪 / 除颤监护仪组',
        model: 'BeneVision N17 / BeneHeart D6',
        department: '重症医学科 / 急诊抢救室',
        faultSymptomOrScope: '批次老旧电池性能衰减，部分主板接口磨损，需成套升级更新件',
        expectedDeliveryDays: 14
      }
    ],
    allowSubcontracting: false,
    minWarrantyMonths: 12,
    bidsCount: 2,
  },
  {
    id: 'BID-2026-003',
    title: '急诊检验科全自动生化分析仪光栅分光系统及加样针臂总成专项大修外协竞价',
    category: 'EQUIPMENT_REPAIR',
    department: '医学检验科',
    publishDate: '2026-09-05',
    deadlineDate: '2026-09-18 18:00',
    maxBudget: 65000,
    urgency: 'EMERGENCY',
    status: 'BIDDED',
    description: '检验科全自动生化分析仪2号机加样针步进电机卡滞、光度计光纤老化导致吸光度基线漂移超限，急需专业团队停机抢修更换总成并重新做生化项目全标定。',
    technicalRequirements: [
      '具备二级以上医疗器械维修经营备案，有临床检验生化仪大修成功案例',
      '维修完成后需配合完成国家质控靶值测试及第三方计量校准对比',
      '抢修施工工期不超过3个自然日'
    ],
    equipmentList: [
      {
        id: 'REQ-03',
        equipmentName: '全自动生化分析仪 (AU5800)',
        model: 'Beckman Coulter AU5800',
        department: '医学检验科 / 生化室',
        faultSymptomOrScope: '加样针位移丢步，光度计透光率非线性误差，需更换驱动电机和光导总成',
        expectedDeliveryDays: 3
      }
    ],
    allowSubcontracting: false,
    minWarrantyMonths: 6,
    bidsCount: 4,
    mySubmission: {
      bidId: 'MY-BID-202609-01',
      projectId: 'BID-2026-003',
      vendorId: 'partner-001',
      vendorName: '通用电气医疗系统（中国）有限公司',
      submittedAt: '2026-09-16 14:20',
      quoteAmount: 52000,
      quotePartsAmount: 42000,
      quoteLaborAmount: 10000,
      deliveryDays: 2,
      warrantyMonths: 12,
      schemeDescription: '派出大区专职生化与分析仪器主任工程师驻场，备件采用现货正品加样总成及原装光纤，修复后连续运行24小时测试靶值，附带第三方复检合格报告。',
      bidDocumentFileName: '生化分析仪加样总成抢修竞标方案及配件清单.pdf',
      status: 'SHORTLISTED',
      evaluationScore: 94.5,
      hospitalFeedback: '技术方案扎实，备件质保承诺期长，专家综合评分排名第1，已进入院级会签拟定标阶段。'
    }
  },
  {
    id: 'BID-2026-004',
    title: '手术部超声高频外科集成系统 (超声刀主机及换能器) 翻新维护与计量检测竞价',
    category: 'THIRD_PARTY_METROLOGY',
    department: '麻醉手术科',
    publishDate: '2026-08-20',
    deadlineDate: '2026-09-01 17:00',
    maxBudget: 90000,
    urgency: 'NORMAL',
    status: 'WON',
    description: '麻醉手术科共8套超声刀主机及16支换能器手柄超声输出振幅校准、密封圈更换与声学功率测试。',
    technicalRequirements: [
      '出具国家认可CNAS/CMA标准计量检测合格校验证书',
      '换能器手柄静态阻抗匹配测试符合GB 9706.1医疗电气安全要求'
    ],
    equipmentList: [
      {
        id: 'REQ-04',
        equipmentName: '超声高频外科手术系统',
        model: 'Ethicon GEN11',
        department: '麻醉手术科',
        faultSymptomOrScope: '换能器压电陶瓷老化，输出切凝效率波动，需全面翻新测试',
        expectedDeliveryDays: 7
      }
    ],
    allowSubcontracting: false,
    minWarrantyMonths: 6,
    bidsCount: 3,
    winningVendor: '通用电气医疗系统（中国）有限公司',
    winningAmount: 78000,
    mySubmission: {
      bidId: 'MY-BID-202608-09',
      projectId: 'BID-2026-004',
      vendorId: 'partner-001',
      vendorName: '通用电气医疗系统（中国）有限公司',
      submittedAt: '2026-08-28 10:15',
      quoteAmount: 78000,
      quotePartsAmount: 58000,
      quoteLaborAmount: 20000,
      deliveryDays: 5,
      warrantyMonths: 12,
      schemeDescription: '提供进口高精度声功率计现场全项目实测，更换原装耐高温高压高分子密封密封圈，提供完整校准合格报告。',
      bidDocumentFileName: '超声高频系统换能器翻新与计量标定投标书.pdf',
      status: 'ACCEPTED',
      evaluationScore: 96.0,
      hospitalFeedback: '经院医工委评标，中标该项目，已进入合同履行阶段。'
    }
  }
];

// ==================== 初始企业资质证照库 ====================
export const INITIAL_QUALIFICATIONS: CorporateQualification[] = [
  {
    id: 'QUAL-001',
    vendorId: 'partner-001',
    category: 'BUSINESS_LICENSE',
    title: '企业法人营业执照 (三证合一)',
    certificateNo: '91320200607908821B',
    issuingAuthority: '江苏省市场监督管理局',
    issuedDate: '2020-05-18',
    expiryDate: '2035-05-17',
    legalPerson: '张伟',
    scopeOfOperation: '医疗器械研发、销售、安装调试及专业技术维保服务；大型医用设备租赁与售后工程；计算机软硬件技术咨询。',
    status: 'VALID',
    fileUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800&auto=format&fit=crop&q=80',
    fileName: '通用电气医疗_营业执照正本_扫描件.pdf',
    uploadedAt: '2026-01-10 10:00',
    auditRemark: '已通过医院医学装备管理委员会初审及审计科核验备案。',
    isKeyQualification: true
  },
  {
    id: 'QUAL-002',
    vendorId: 'partner-001',
    category: 'DEVICE_OPERATION_PERMIT',
    title: '中华人民共和国医疗器械经营许可证 (三类)',
    certificateNo: '苏锡食药监械经营许20210089号',
    issuingAuthority: '无锡市行政审批局',
    issuedDate: '2021-09-12',
    expiryDate: '2026-10-30', // 临期预警！<=60天
    legalPerson: '张伟',
    scopeOfOperation: 'III类：6828 医用磁共振设备，6830 医用X射线设备，6831 医用高能射线设备，6854 手术室、急救室设备。',
    status: 'EXPIRING_SOON',
    fileUrl: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?w=800&auto=format&fit=crop&q=80',
    fileName: '三类医疗器械经营许可证_原件扫描.pdf',
    uploadedAt: '2026-02-15 14:30',
    auditRemark: '【临期预警】距到期仅剩约40天，请尽快提交换证审核延续材料！',
    isKeyQualification: true
  },
  {
    id: 'QUAL-003',
    vendorId: 'partner-001',
    category: 'MANUFACTURER_AUTH_LETTER',
    title: 'GE Healthcare 亚太区特级原厂售后服务与原装配件供应授权书',
    certificateNo: 'GE-AUTH-2026-CN-0988',
    issuingAuthority: 'GE Medical Systems Asia Pacific Inc.',
    issuedDate: '2026-01-01',
    expiryDate: '2027-12-31',
    legalPerson: 'GE APAC Authorized Signatory',
    scopeOfOperation: '授权在中国大陆地区对 GE MR、CT、DSA 设备实施原厂配件调配、技术检测、系统升级及售后保障。',
    status: 'VALID',
    fileUrl: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=800&auto=format&fit=crop&q=80',
    fileName: 'GE医疗亚太区原厂一级服务商授权委托书.pdf',
    uploadedAt: '2026-01-05 09:12',
    auditRemark: '原厂红章授权齐全，防伪编码校验通过。',
    isKeyQualification: true
  },
  {
    id: 'QUAL-004',
    vendorId: 'partner-001',
    category: 'RADIATION_SAFETY_PERMIT',
    title: '放射性辐射安全许可证 (甲级)',
    certificateNo: '鲁环辐证[02188]号',
    issuingAuthority: '山东省生态环境厅',
    issuedDate: '2023-04-10',
    expiryDate: '2028-04-09',
    legalPerson: '张伟',
    scopeOfOperation: '生产、销售、使用 II 类、III 类射线装置；安装与调试医用直线加速器、CT 机及数字减影血管造影机 (DSA)。',
    status: 'VALID',
    fileUrl: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&auto=format&fit=crop&q=80',
    fileName: '省生态环境厅_辐射安全许可证_正本.pdf',
    uploadedAt: '2026-03-01 11:20',
    auditRemark: '放射科与CT安装维保所必备的核心准入资质，核验有效。',
    isKeyQualification: true
  },
  {
    id: 'QUAL-005',
    vendorId: 'partner-001',
    category: 'ENGINEER_CERTIFICATION',
    title: '临床医学工程资深工程师执业认证与电工特种作业操作证',
    certificateNo: 'CMIA-ENG-2024-8801',
    issuingAuthority: '中国生物医学工程学会 (CSBME) / 应急管理厅',
    issuedDate: '2024-06-15',
    expiryDate: '2027-06-14',
    legalPerson: '持证人: 陈工 (驻场技术主管)',
    scopeOfOperation: '大型医用电气设备安装维修高压电工作业、磁共振超导磁体失超防护、生命支持类急救设备专项检定。',
    status: 'VALID',
    fileUrl: 'https://images.unsplash.com/photo-1521791136064-7986c2920216?w=800&auto=format&fit=crop&q=80',
    fileName: '驻场工程师陈工_高级工程师认证与特种电工操作证.pdf',
    uploadedAt: '2026-04-12 16:40',
    auditRemark: '驻场服务团队工程师资质认证，已在保卫科及医工处实名备案。',
    isKeyQualification: false
  },
  {
    id: 'QUAL-006',
    vendorId: 'partner-001',
    category: 'ISO_QUALITY_MANAGEMENT',
    title: 'ISO 13485:2016 医疗器械质量管理体系认证证书',
    certificateNo: 'CNAS-C002-M/2023-9011',
    issuingAuthority: '北京华光认证有限公司',
    issuedDate: '2023-11-20',
    expiryDate: '2026-11-19',
    legalPerson: '张伟',
    scopeOfOperation: '医疗器械安装、维修服务及相关零部件供应过程的质量管理体系符合标准。',
    status: 'VALID',
    fileUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800&auto=format&fit=crop&q=80',
    fileName: 'ISO13485医疗器械质量管理体系中英文证书.pdf',
    uploadedAt: '2026-01-20 15:00',
    auditRemark: '每年定期监督审核合格，目前处于有效受控状态。',
    isKeyQualification: false
  }
];

// ==================== 初始统一结构化单据台账 (发票/报告/报价) ====================
export const INITIAL_STRUCTURED_DOCUMENTS: StructuredDocumentRecord[] = [
  {
    id: 'DOC-INV-2026-001',
    docType: 'INVOICE',
    docName: '增值税专用发票（3.0T磁共振射频功放板维修结算）',
    docCode: '033002200111-99823019',
    associatedOrderId: 'EXT-202609-001',
    associatedEquipmentName: '3.0T 超导型超导磁共振系统',
    vendorId: 'partner-001',
    vendorName: '通用电气医疗系统（中国）有限公司',
    amount: 32000,
    parsedAt: '2026-09-15 11:30',
    fileUrl: 'https://images.unsplash.com/photo-1554224154-26032ffc0d07?w=800&auto=format&fit=crop&q=80',
    fileName: '增值税专用发票_033002200111_99823019.pdf',
    status: 'VERIFIED',
    summaryTags: ['增值税专票', '税率13%', '价税合计¥32,000', '防伪查验一致'],
    structuredPayload: {
      invoiceType: '增值税专用发票',
      invoiceCode: '033002200111',
      invoiceNo: '99823019',
      invoiceDate: '2026-09-14',
      buyerName: '五莲县人民医院',
      buyerTaxNo: '12371121494532100X',
      sellerName: '通用电气医疗系统（中国）有限公司',
      sellerTaxNo: '91320200607908821B',
      untaxedAmount: 28318.58,
      taxRate: 13,
      taxAmount: 3681.42,
      totalAmount: 32000,
      checkCode: '82103 49021 78401 22904',
      goodsItems: [
        { name: '医疗设备修理费*磁共振射频驱动组件', spec: 'RF-AMP-GEN2', unit: '套', quantity: 1, unitPrice: 28318.58, amount: 28318.58, taxRate: '13%' }
      ],
      verificationStatus: 'VERIFIED',
      verificationMessage: '经国家税务总局全国增值税发票查验平台核验：发票状态正常，开票方资质合法，销方税号与合作单位一致。'
    }
  },
  {
    id: 'DOC-REP-2026-001',
    docType: 'REPAIR_REPORT',
    docName: '现场工程技术维保完工服务报告单',
    docCode: 'FSR-202609-089',
    associatedOrderId: 'EXT-202609-001',
    associatedEquipmentName: '3.0T 超导型超导磁共振系统',
    vendorId: 'partner-001',
    vendorName: '通用电气医疗系统（中国）有限公司',
    amount: 32000,
    parsedAt: '2026-09-12 16:45',
    fileUrl: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&auto=format&fit=crop&q=80',
    fileName: 'GE工程师现场技术服务与验收报告_FSR089.pdf',
    status: 'VERIFIED',
    summaryTags: ['原厂工程师已到场', '旧件原样退库', '临床满意度5星', '72h连续运转达标'],
    structuredPayload: {
      reportNo: 'FSR-202609-089',
      engineerName: '陈伟民 (大区资深硬件专家)',
      engineerPhone: '13812345678',
      serviceStartTime: '2026-09-09 10:00',
      serviceEndTime: '2026-09-11 15:30',
      faultPhenomenon: '序列扫描发射端功率偶发丢步，报错代码 ERR-RF-402，头部和腹部成像伪影严重。',
      rootCauseAnalysis: '射频功放驱动模块高压电容老化击穿，导致输出脉冲幅度失真及过流连锁断路。',
      repairMeasures: '更换原厂全新射频放大驱动总成 (PT-88902)，重新完成全频段调谐校准，执行32通道相控阵线圈SNR信噪比测试。',
      replacedParts: [
        { name: '原厂射频驱动组件', partNo: 'PT-88902', quantity: 1, isOriginal: true, warrantyMonths: 12, returnedOldPart: true }
      ],
      oldPartsReturned: true,
      oldPartsStorageTag: 'OLD-PART-202609-MR01 (已入医院旧件监管专柜)',
      clinicalAcceptance: {
        signeeName: '高主任 (影像科主任 / 技师长)',
        signDate: '2026-09-11 16:00',
        satisfactionRating: 5,
        clinicalComment: '工程师带备件上门响应极为迅速，上机测试5名志愿者颅脑扫描序列，信噪比极佳，完全恢复正常接诊。'
      }
    }
  },
  {
    id: 'DOC-QUO-2026-001',
    docType: 'QUOTATION',
    docName: '专项维修工程盖章详细报价单',
    docCode: 'QUO-202609-012',
    associatedOrderId: 'EXT-202609-001',
    associatedEquipmentName: '3.0T 超导型超导磁共振系统',
    vendorId: 'partner-001',
    vendorName: '通用电气医疗系统（中国）有限公司',
    amount: 36000,
    parsedAt: '2026-09-08 14:00',
    fileUrl: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=800&auto=format&fit=crop&q=80',
    fileName: 'GE医疗磁共振射频组件专项大修盖章报价单.pdf',
    status: 'VERIFIED',
    summaryTags: ['盖章原件', '工时¥4,000', '配件¥32,000', '质保12个月'],
    structuredPayload: {
      quotationNo: 'QUO-202609-012',
      equipmentName: '3.0T 超导型超导磁共振系统 (Signa Pioneer)',
      equipmentSn: 'GE-MR-9882103',
      laborCost: 3000,
      travelAndTestingCost: 1000,
      partsTotal: 32000,
      grandTotal: 36000,
      validUntil: '2026-10-15',
      partsBreakdown: [
        { name: '原厂射频驱动组件', spec: 'ORIG-SPEC-001', brand: 'GE原厂', partNo: 'PT-88902', quantity: 1, unitPrice: 32000, totalPrice: 32000, warrantyMonths: 12, isOriginal: true }
      ],
      terms: '报价已含13%增值税、工程师往返差旅及现场调试费；若确认接受，备件可于24小时内调拨至医院现场。'
    }
  },
  {
    id: 'DOC-INV-2026-002',
    docType: 'INVOICE',
    docName: '增值税专用发票（08月全院零星维保框架批次月结款）',
    docCode: '037002200112-88129033',
    associatedOrderId: 'BATCH-2026-08',
    associatedEquipmentName: '2026年08月全院零星维保框架结算批次 (48项)',
    vendorId: 'ISO-001',
    vendorName: '国药器械医工技术服务 (中国) 有限公司',
    amount: 51200,
    parsedAt: '2026-09-02 09:20',
    fileUrl: 'https://images.unsplash.com/photo-1554224154-26032ffc0d07?w=800&auto=format&fit=crop&q=80',
    fileName: '国药器械_8月份维保结算发票与销货清单.pdf',
    status: 'VERIFIED',
    summaryTags: ['框架月结专票', '价税合计¥51,200', '销货清单48项比对一致'],
    structuredPayload: {
      invoiceType: '增值税专用发票',
      invoiceCode: '037002200112',
      invoiceNo: '88129033',
      invoiceDate: '2026-08-31',
      buyerName: '五莲县人民医院',
      buyerTaxNo: '12371121494532100X',
      sellerName: '国药器械医工技术服务 (中国) 有限公司',
      sellerTaxNo: '91440101718166542G',
      untaxedAmount: 48301.89,
      taxRate: 6,
      taxAmount: 2898.11,
      totalAmount: 51200,
      checkCode: '90123 77481 00291 38210',
      goodsItems: [
        { name: '现代服务*医疗设备零星维修保养服务费', spec: '2026-08月度汇总', unit: '批', quantity: 1, unitPrice: 48301.89, amount: 48301.89, taxRate: '6%' }
      ],
      verificationStatus: 'VERIFIED',
      verificationMessage: '发票与国税平台金税发票库核验一致，税控附带防伪《销货清单》项数48项分毫不差。'
    }
  }
];

// ==================== 本地缓存键名与存取 API ====================
const STORAGE_KEY_BIDDING = 'hospital_vendor_bidding_projects';
const STORAGE_KEY_QUALIFICATIONS = 'hospital_vendor_corporate_qualifications';
const STORAGE_KEY_STRUCTURED_DOCS = 'hospital_vendor_structured_documents';

// 1. 竞价项目
export function getBiddingProjects(vendorId?: string): BiddingProject[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_BIDDING);
    if (raw) {
      const parsed: BiddingProject[] = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Failed to load bidding projects', e);
  }
  return INITIAL_BIDDING_PROJECTS;
}

export function saveBiddingProjects(projects: BiddingProject[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_BIDDING, JSON.stringify(projects));
  } catch (e) {
    console.error('Failed to save bidding projects', e);
  }
}

export function submitVendorBid(
  projectId: string, 
  submission: BidSubmission
): BiddingProject[] {
  const all = getBiddingProjects();
  const next = all.map(p => {
    if (p.id === projectId) {
      return {
        ...p,
        status: 'BIDDED' as const,
        bidsCount: p.bidsCount + 1,
        mySubmission: submission
      };
    }
    return p;
  });
  saveBiddingProjects(next);
  return next;
}

// 2. 企业资质
export function getCorporateQualifications(vendorId?: string): CorporateQualification[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_QUALIFICATIONS);
    if (raw) {
      const parsed: CorporateQualification[] = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        if (vendorId) {
          const filtered = parsed.filter(q => q.vendorId === vendorId);
          return filtered.length > 0 ? filtered : parsed;
        }
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Failed to load qualifications', e);
  }
  return INITIAL_QUALIFICATIONS;
}

export function saveCorporateQualifications(quals: CorporateQualification[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_QUALIFICATIONS, JSON.stringify(quals));
  } catch (e) {
    console.error('Failed to save qualifications', e);
  }
}

export function saveQualification(qual: CorporateQualification): CorporateQualification[] {
  const list = getCorporateQualifications();
  const index = list.findIndex(q => q.id === qual.id);
  let next: CorporateQualification[];
  if (index >= 0) {
    next = [...list];
    next[index] = qual;
  } else {
    next = [qual, ...list];
  }
  saveCorporateQualifications(next);
  return next;
}

export const submitBid = submitVendorBid;

// 3. 结构化单据统一整理
export function getStructuredDocuments(vendorId?: string): StructuredDocumentRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_STRUCTURED_DOCS);
    if (raw) {
      const parsed: StructuredDocumentRecord[] = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        if (vendorId) {
          const filtered = parsed.filter(d => d.vendorId === vendorId);
          return filtered.length > 0 ? filtered : parsed;
        }
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Failed to load structured docs', e);
  }
  return INITIAL_STRUCTURED_DOCUMENTS;
}

export function saveStructuredDocuments(docs: StructuredDocumentRecord[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_STRUCTURED_DOCS, JSON.stringify(docs));
  } catch (e) {
    console.error('Failed to save structured docs', e);
  }
}

export function addOrUpdateStructuredDocument(doc: StructuredDocumentRecord): StructuredDocumentRecord[] {
  const list = getStructuredDocuments();
  const index = list.findIndex(d => d.id === doc.id);
  let next: StructuredDocumentRecord[];
  if (index >= 0) {
    next = [...list];
    next[index] = doc;
  } else {
    next = [doc, ...list];
  }
  saveStructuredDocuments(next);
  return next;
}

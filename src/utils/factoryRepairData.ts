import { 
  ReturnFactoryRepairOrder, 
  FactoryRepairStage, 
  WorkflowRole, 
  WorkflowActor,
  DialogueMessage
} from '../types/factoryRepairTypes';

export const WORKFLOW_ACTORS: Record<WorkflowRole, WorkflowActor> = {
  clinical_anesthesia: {
    id: 'ACTOR-CLINICAL',
    name: '黄晓彤',
    roleTitle: '麻醉手术科 护士长 / 临床器械主管',
    department: '麻醉手术科',
    avatarColor: 'bg-emerald-600',
    phone: '13863371086 (分机: 61086)',
    roleKey: 'clinical_anesthesia'
  },
  equipment_engineer: {
    id: 'ACTOR-ENGINEER',
    name: '崔伟',
    roleTitle: '医疗设备科 科长 / 主管工程师',
    department: '医疗设备科',
    avatarColor: 'bg-blue-600',
    phone: '13863373257 (分机: 63257)',
    roleKey: 'equipment_engineer'
  },
  vp_medical: {
    id: 'ACTOR-VP',
    name: '王建国',
    roleTitle: '业务分管副院长 / 医学装备管理委员会主任',
    department: '院领导班子',
    avatarColor: 'bg-purple-600',
    phone: '0633-7991008',
    roleKey: 'vp_medical'
  },
  president: {
    id: 'ACTOR-PRESIDENT',
    name: '刘志刚',
    roleTitle: '院长 / 法定代表人 / 党委副书记',
    department: '院领导班子',
    avatarColor: 'bg-rose-700',
    phone: '0633-7991001',
    roleKey: 'president'
  },
  vendor_oem: {
    id: 'ACTOR-VENDOR',
    name: '李海明',
    roleTitle: '原厂资深维修工程师 / 华东技术服务中心',
    department: '德国狼牌医疗技术服务中心',
    avatarColor: 'bg-amber-600',
    phone: '400-820-8703 / 13918802931',
    roleKey: 'vendor_oem'
  }
};

export const STAGE_CONFIGS: {
  key: FactoryRepairStage;
  index: number;
  title: string;
  shortTitle: string;
  leadRole: string;
  roleKey: WorkflowRole;
  description: string;
}[] = [
  {
    key: 'DEPARTMENT_REPORT',
    index: 1,
    title: '科室临床故障报修',
    shortTitle: '科室报修',
    leadRole: '麻醉手术科',
    roleKey: 'clinical_anesthesia',
    description: '麻醉手术科在术中发现输尿管镜视场发暗模糊，提交详细报修工单'
  },
  {
    key: 'ONSITE_CHECK_DRAFT',
    index: 2,
    title: '设备科现场检查与起草申请',
    shortTitle: '现场检查起草',
    leadRole: '医疗设备科',
    roleKey: 'equipment_engineer',
    description: '医工到场进行光学透光及密封性检测，判定无法院内自修，一键起草返厂申请并推送麻醉手术科同步查阅'
  },
  {
    key: 'MULTI_LEVEL_APPROVAL',
    index: 3,
    title: '四级审批与领导签章',
    shortTitle: '四级审批签章',
    leadRole: '分管院长 & 院长',
    roleKey: 'president',
    description: '设备科主管审核 → 分管副院长手写签字 → 院长终审签字盖章，激活维修实施流程'
  },
  {
    key: 'DISPATCH_EXPRESS',
    index: 4,
    title: '现场核验取件与一键发快递',
    shortTitle: '核验取件寄件',
    leadRole: '医疗设备科',
    roleKey: 'equipment_engineer',
    description: '现场清点镜身、镜盒及附件，双层防震包装封箱拍照，一键生成顺丰快递推送厂家'
  },
  {
    key: 'VENDOR_INSPECT_QUOTE',
    index: 5,
    title: '厂家拆检报告与在线明细报价',
    shortTitle: '厂家拆检报价',
    leadRole: '德国狼牌厂家',
    roleKey: 'vendor_oem',
    description: '厂家收件拆检出具高清损伤图文报告，录入零配件与人工明细报价，开启在线双向沟通'
  },
  {
    key: 'JOINT_NEGOTIATION',
    index: 6,
    title: '科室/院长全透明共同议价',
    shortTitle: '四方透明议价',
    leadRole: '科室·医工·院长·厂家',
    roleKey: 'equipment_engineer',
    description: '麻醉手术科与院长穿透查看报价，院长批示控价线，设备科下发议价函，厂家在线让利定标'
  },
  {
    key: 'CONTRACT_SIGNING',
    index: 7,
    title: '平台在线签署维修合同',
    shortTitle: '在线签署合同',
    leadRole: '医院 & 厂家',
    roleKey: 'equipment_engineer',
    description: '平台自动拟定大修技术服务合同，医院电子公章与厂家在线公章双向签署生效'
  },
  {
    key: 'VENDOR_REPAIR_RETURN',
    index: 8,
    title: '维修完成返程与多方实时看板',
    shortTitle: '维修返程看板',
    leadRole: '厂家 & 全角色',
    roleKey: 'vendor_oem',
    description: '厂家完成镜棒重置与出厂干涉检测，录入返程快递单号，麻醉手术科/院长/设备科同步跟踪'
  },
  {
    key: 'ACCEPTANCE_TRIAL_SETTLE',
    index: 9,
    title: '现场开箱验收与1周临床试用结项',
    shortTitle: '开箱验收试用',
    leadRole: '麻醉手术科 & 设备科',
    roleKey: 'clinical_anesthesia',
    description: '开箱光学测漏双人验收签字，开启7天临床手术跟台试运行，1周满确认无异常正式结项'
  },
  {
    key: 'INVOICE_PAYMENT_TRACK',
    index: 10,
    title: '厂家发票上传与实时付款进度',
    shortTitle: '发票与付款追踪',
    leadRole: '厂家 & 财务科',
    roleKey: 'vendor_oem',
    description: '结项后厂家上传增值税专用发票，全流程透明查看挂账、财审、院长批复及出纳打款进度'
  }
];

const STORAGE_KEY = 'factory_repair_orders_store_v1';

export const SEED_FACTORY_REPAIR_ORDER: ReturnFactoryRepairOrder = {
  id: 'RFR-20260923-001',
  orderNumber: 'WX-FC-20260923-087',
  currentStage: 'JOINT_NEGOTIATION', // 默认展示在最精彩的四方透明议价节点，方便查看前后所有阶段
  stageProgressPercent: 60,
  createdAt: '2026-09-21 08:45',
  updatedAt: '2026-09-23 09:15',

  // 1. 报修信息
  initialFault: {
    repairOrderNo: 'REP-20260921-008',
    equipmentId: 'EQ-2023-09855',
    equipmentName: '德国狼牌输尿管硬镜',
    equipmentModel: 'Richard Wolf 8703.534 (8/9.8Fr 430mm 12°)',
    equipmentSn: 'RW-20230415-87035',
    assetNo: 'ZC-2023-09855',
    department: '麻醉手术科',
    reporterName: '黄晓彤 (护士长)',
    reporterPhone: '13863371086',
    reportedAt: '2026-09-21 08:45',
    faultSymptom: '主刀医师反映输尿管镜视野严重模糊起雾，反光干扰剧烈，导光亮度衰减超50%，影响结石定位；内镜测漏接口存在轻微渗气水汽。',
    urgency: 'critical',
    clinicalImpact: '本科室周二/周四排定输尿管镜碎石取石术5台，目前仅存1条备用镜，急需返厂深度抢修以保障手术正常排班。',
    fieldPhotos: [
      'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=600&q=80'
    ]
  },

  // 2. 设备科现场检查与起草
  onsiteDraft: {
    inspectorName: '崔伟',
    inspectorTitle: '医疗设备科科长 / 主管工程师',
    inspectedAt: '2026-09-21 09:30',
    inspectionConclusion: 'need_return_factory',
    opticalDamageAssessment: {
      lensClarity: 'severe_foggy',
      fiberOpticTransmission: 38,
      glueDegradation: true,
      prismDamage: true,
      sheathCondition: '外层不锈钢套管轻微擦痕，工作通道通畅，但末端光学窗口蓝宝石封胶开裂进水'
    },
    draftApplicationTitle: '关于麻醉手术科德国狼牌输尿管硬镜(8703.534)返厂光学大修的审批呈批报告',
    draftReasonAndNecessity: '经现场医工特种仪器检测：该镜体末端蓝宝石封胶老化进水，内部第2/第3柱状透镜组出现微裂纹与霉斑，冷光源导光束断丝率约38%。院内无百级超净间光学重组封装及激光干涉胶合设备，必须返厂由原厂中国技术服务中心进行物镜重构与光学柱状镜棒整体换新。',
    targetVendorName: '德国狼牌医疗技术服务中心 (Richard Wolf China)',
    targetVendorContact: '李海明 (原厂资深大修工程师)',
    targetVendorPhone: '400-820-8703 / 13918802931',
    estimatedCostRange: '¥14,000 ~ ¥18,500 元',
    draftedAt: '2026-09-21 10:15',
    draftedBy: '崔伟 (设备科)',
    pushedToDepartmentView: true
  },

  // 3. 四级审批
  approvalChain: [
    {
      level: 1,
      nodeName: '起草与科室确认',
      approverRole: '麻醉手术科 / 临床器械主管',
      approverName: '黄晓彤',
      status: 'approved',
      approvalOpinion: '已在线查验设备科现场检查报告与返厂申请书，陈述事实准确，情况紧急，恳请院领导尽快签批安排返厂！',
      signatureDataUrl: 'signature_huang_xiaotong',
      signedAt: '2026-09-21 10:30'
    },
    {
      level: 2,
      nodeName: '医学装备科主管审核',
      approverRole: '医疗设备科科长 / 审核人',
      approverName: '崔伟',
      status: 'approved',
      approvalOpinion: '现场技术勘查属实，无法院内修复。已核对设备台账与折旧净值(原值16.8万，残值率良好)，返厂修复具有极高经济效益比，拟送原厂技术中心，呈报分管院长批示。',
      signatureDataUrl: 'signature_cui_wei',
      signedAt: '2026-09-21 10:55'
    },
    {
      level: 3,
      nodeName: '业务分管院长签字',
      approverRole: '业务副院长 / 装备委员会主任',
      approverName: '王建国',
      status: 'approved',
      approvalOpinion: '同意返厂大修。手术室急需器械，请设备科严格把控配件质量与议价，力争压缩维修周期，呈刘院长终审。',
      signatureDataUrl: 'signature_vp_wang',
      signedAt: '2026-09-21 14:20'
    },
    {
      level: 4,
      nodeName: '院长终审签章',
      approverRole: '院长 / 法定代表人',
      approverName: '刘志刚',
      status: 'approved',
      approvalOpinion: '同意大修实施。请严格按照外协大修内控规程执行，联合麻醉科共同议价并落实不少于1年配件质保。批准实施！',
      signatureDataUrl: 'signature_president_liu',
      signedAt: '2026-09-21 16:00'
    }
  ],

  // 4. 去程快递
  outboundLogistics: {
    verifierName: '崔伟 / 孙志强 (设备科)',
    verifiedAt: '2026-09-22 09:10',
    serialNumberMatch: true,
    packagingCondition: '已使用原装专用硬质铝合金内窥镜灭菌保护盒，内置定制防震硅胶卡槽，外层加装加厚双瓦楞缓冲箱，贴附易碎贵重医疗仪器标贴。',
    packagePhotos: [
      'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=600&q=80'
    ],
    courierCompany: '顺丰速运 (特快特规专递)',
    trackingNumber: 'SF139820491823',
    insuredValue: 20000,
    shippingDate: '2026-09-22 09:40',
    senderAddress: '山东省日照市五莲县人民医院 综合楼4F设备科 (崔伟 13863373257)',
    receiverAddress: '上海市浦东新区张江高科张东路1388号 德国狼牌技术中心 (李海明 13918802931)',
    status: 'delivered',
    deliveredAt: '2026-09-22 17:30'
  },

  // 5. 厂家拆检与明细报价
  vendorInspectionQuote: {
    receivedAt: '2026-09-22 17:35',
    inspectionEngineer: '李海明 (原厂资深大修认证工程师)',
    vendorReportNo: 'RW-REP-2026-09412',
    detailedFindings: '经无尘超净拆解及光学投影仪检测：\n1. 前端蓝宝石保护窗封胶龟裂脱胶，高温高压灭菌蒸汽渗入导致镜头内腔严重水雾霉斑；\n2. 第2组柱状HOPKINS棒状透镜发生应力性微崩口，导致成像重影与边缘散焦；\n3. 内部导光玻璃纤维束前端因反复弯折有42根断丝，导致透光度严重衰减；\n4. 镜鞘不锈钢通道及外管机械结构完好，无变形，建议保留外管仅更换核心光学组件。',
    findingsPhotos: [
      {
        title: '前端透镜封胶进水与霉斑',
        description: '显微镜下放大40倍：前端物镜胶体发白碳化，内部镜室有明显水渍凝结结晶。',
        url: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=600&q=80'
      },
      {
        title: '柱状棒状透镜裂口',
        description: '激光投影视场边缘出现黑色缺角阴影，证实HOPKINS透镜应力断裂。',
        url: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=600&q=80'
      }
    ],
    quoteItems: [
      {
        id: 'QI-01',
        partName: '原厂前端物镜透镜模组 (含蓝宝石高温密封窗)',
        specModel: 'RW-8703-OBJ-MOD',
        quantity: 1,
        unit: '套',
        unitPrice: 6500,
        totalPrice: 6500,
        warrantyMonths: 12,
        isOriginal: true
      },
      {
        id: 'QI-02',
        partName: 'HOPKINS柱状棒状光学透镜棒组 (全套原厂配光)',
        specModel: 'RW-8703-ROD-LENS-SYS',
        quantity: 1,
        unit: '套',
        unitPrice: 7800,
        totalPrice: 7800,
        warrantyMonths: 12,
        isOriginal: true
      },
      {
        id: 'QI-03',
        partName: '耐高温特种光学密封胶及气密O型圈组',
        specModel: 'RW-SEAL-KIT-09',
        quantity: 1,
        unit: '组',
        unitPrice: 600,
        totalPrice: 600,
        warrantyMonths: 12,
        isOriginal: true
      },
      {
        id: 'QI-04',
        partName: '原厂超净重装/同轴光轴校准/负压密封试验工时费',
        specModel: 'LABOR-STD-ENDOSCOPE',
        quantity: 1,
        unit: '项',
        unitPrice: 1600,
        totalPrice: 1600,
        warrantyMonths: 12,
        isOriginal: true
      }
    ],
    laborCost: 1600,
    totalQuotePrice: 16500,
    expectedRepairDays: 3,
    quotedAt: '2026-09-22 19:20',
    status: 'negotiating'
  },

  // 双向沟通留言板
  dialogueMessages: [
    {
      id: 'MSG-01',
      senderName: '李海明',
      senderRole: '厂家工程师',
      senderRoleKey: 'vendor_oem',
      senderAvatar: 'bg-amber-600',
      timestamp: '2026-09-22 17:40',
      content: '崔科长好！五莲县人民医院寄出的输尿管硬镜已通过顺丰完好接收，机身编号比对无误，我们即刻安排百级无尘间光学拆检。'
    },
    {
      id: 'MSG-02',
      senderName: '崔伟',
      senderRole: '设备科主管',
      senderRoleKey: 'equipment_engineer',
      senderAvatar: 'bg-blue-600',
      timestamp: '2026-09-22 17:45',
      content: '收到！麻醉手术科下周手术量较大，请尽快安排拆检并出具明细报价单，科室护士长和刘院长都在平台上关注进度。'
    },
    {
      id: 'MSG-03',
      senderName: '李海明',
      senderRole: '厂家工程师',
      senderRoleKey: 'vendor_oem',
      senderAvatar: 'bg-amber-600',
      timestamp: '2026-09-22 19:25',
      content: '拆检报告与高清图片已上传，总报价为16,500元。外管完好无需更换，主要换物镜模组和柱状光学棒。均使用德国狼牌原装进口备件，支持质保12个月。'
    },
    {
      id: 'MSG-04',
      senderName: '黄晓彤',
      senderRole: '麻醉手术科护士长',
      senderRoleKey: 'clinical_anesthesia',
      senderAvatar: 'bg-emerald-600',
      timestamp: '2026-09-22 20:10',
      content: '已看到拆检照片，确实与术中模糊情况吻合。请设备科与厂家多争取一些优惠，如果价格能在14,000左右最理想！'
    }
  ],

  // 6. 共同议价
  jointNegotiation: {
    clinicalDeptOpinion: {
      authorName: '黄晓彤 (麻醉手术科护士长)',
      opinion: '科室已查看厂家拆检图片，认可换件方案，建议严格索要原厂备件海关报关单与质检单；希望价格能控制在14,500元以内，并保持12个月质保期。',
      submittedAt: '2026-09-22 20:15',
      willingBudgetCeiling: 14500
    },
    leadershipGuidance: {
      leaderName: '刘志刚',
      title: '院长',
      targetPriceLimit: 14200,
      instruction: '经对比省立医院近期同型号狼牌输尿管镜大修历史中标均价(约1.38~1.45万元)，该报价16,500元偏高。指示设备科下发议价函，力争压降至14,200元包干并确保12个月整机质保，方可签署合同。',
      submittedAt: '2026-09-22 21:00'
    },
    negotiationRounds: [
      {
        round: 1,
        hospitalCounterOffer: 13800,
        hospitalRemark: '我院为狼牌长期友好合作单位，参考同省三甲公立医院集中议价标准，提请初轮让利至13,800元。',
        vendorResponseOffer: 14800,
        vendorDiscountReason: '原装HOPKINS柱状透镜进价成本较高，向总部特殊申请大客户优惠折扣，工时费减免600元，报价让步至14,800元。',
        timestamp: '2026-09-23 08:30'
      },
      {
        round: 2,
        hospitalCounterOffer: 14200,
        hospitalRemark: '刘院长批示明确控制线：14,200元包干，含税含顺丰往返保价物流，且承诺提供12个月免费质保服务。如认可今日即可线上签约打单实施。',
        vendorResponseOffer: 14200,
        vendorDiscountReason: '经请示狼牌华东区大区经理审批，同意以14,200元成交，确认包含全部原装配件、12个月全保及往返保价快递。',
        timestamp: '2026-09-23 09:10'
      }
    ],
    finalAgreedPrice: 14200,
    finalWarrantyMonths: 12,
    closedAt: '2026-09-23 09:15',
    isAgreed: true
  },

  // 7. 在线合同
  contract: {
    contractNo: 'CT-WLPH-2026-WX087',
    contractTitle: '五莲县人民医院医用输尿管镜外协大修技术服务合同',
    partyA: '五莲县人民医院',
    partyB: '德国狼牌医疗技术服务中心 (上海) 有限公司',
    equipmentSubject: '德国狼牌输尿管硬镜 (型号: 8703.534，编号: RW-20230415-87035)',
    repairScopeSummary: '包括但不限于：前端原装物镜模组换新、HOPKINS柱状透镜光学系统换新、耐高温高压光学密封封胶、光轴校准及气密性负压检测。',
    agreedAmount: 14200,
    paymentTermClause: '货物修复返回并经医院现场开箱验收合格、临床科室实际手术跟台试用满1周无任何故障后结项；凭全额增值税专用发票于30个工作日内银行对公转账支付。',
    warrantyPeriodClause: '自临床试用合格结项之日起，所更换核心光学配件及整镜防漏水防起雾提供 12 个月免费保修。',
    partyASigned: true,
    partyASignatureDate: '2026-09-23 09:30',
    partyASealUrl: 'seal_wulian_hospital',
    partyBSigned: true,
    partyBSignatureDate: '2026-09-23 09:45',
    partyBSealUrl: 'seal_richard_wolf',
    status: 'fully_signed'
  },

  // 8. 维修完成返程物流
  inboundLogistics: {
    courierCompany: '顺丰速运 (特快专递)',
    trackingNumber: 'SF159203948172',
    shippedAt: '2026-09-24 16:30',
    estimatedArrival: '2026-09-25 10:00',
    actualArrivalDate: '2026-09-25 09:50',
    qualityCertificateUrl: 'cert_optical_calibration_pass',
    status: 'delivered'
  },

  // 9. 现场验收与1周试运行结项
  acceptanceTrial: {
    acceptanceDate: '2026-09-25 10:30',
    hospitalInspector: '崔伟 (设备科主管工程师)',
    clinicalHeadNurse: '黄晓彤 (麻醉手术科护士长)',
    testItems: [
      {
        item: '外观与机身序列号比对',
        requirement: '机身钢印编号 RW-20230415-87035 与原设备完全一致，套管无新划伤',
        result: 'pass',
        note: '核验一致'
      },
      {
        item: '光学视场清晰度与色阶测试',
        requirement: '接冷光源及4K高清摄像主机，光学分辨率标准板测试达标，边缘无变形暗角',
        result: 'pass',
        note: '视场清澈透明'
      },
      {
        item: '0.05MPa负压浸水测漏测试',
        requirement: '专用测漏表负压持续保持3分钟指针无跌落，浸水无任何微气泡溢出',
        result: 'pass',
        note: '气密性优良'
      },
      {
        item: '高温高压蒸汽灭菌相容性',
        requirement: '标称耐134℃高温灭菌，耐热封胶平整致密',
        result: 'pass',
        note: '符合原厂规范'
      }
    ],
    acceptanceConclusion: 'qualified',
    acceptanceSignatureA: '崔伟',
    acceptanceSignatureB: '黄晓彤',
    trialStartDate: '2026-09-25 11:00',
    trialEndDate: '2026-10-02 11:00',
    trialSurgeriesCount: 6,
    trialObservations: '在泌尿外科与麻醉手术科联合开展的6台输尿管硬镜碎石取石术中全流程跟台试用：视野图像极其锐利明亮，红蓝色彩还原极佳，连续手术3小时无起雾渗漏。',
    trialStatus: 'settled_qualified',
    settledAt: '2026-10-02 14:00',
    settledSignee: '黄晓彤 (麻醉手术科) / 崔伟 (设备科)'
  },

  // 10. 发票上传与实时付款追踪
  invoicePayment: {
    invoiceRecord: {
      invoiceCode: '037002300111',
      invoiceNumber: '2637481920',
      amount: 14200,
      taxRate: 13,
      invoiceType: '增值税专用发票',
      issuedDate: '2026-10-03',
      uploadedAt: '2026-10-03 10:20',
      invoiceFileUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=600&q=80',
      verificationStatus: 'verified_authentic'
    },
    paymentNodes: [
      {
        id: 'PAY-01',
        nodeName: '厂家开具并上传专票',
        responsiblePerson: '李海明 (厂家财务专员)',
        department: '德国狼牌技术中心',
        status: 'completed',
        completedAt: '2026-10-03 10:25',
        remarks: '税局全国发票查验平台核验真伪一致，金额¥14,200.00元无误。'
      },
      {
        id: 'PAY-02',
        nodeName: '设备科结项挂账确认',
        responsiblePerson: '崔伟 (设备科科长)',
        department: '医疗设备科',
        status: 'completed',
        completedAt: '2026-10-04 09:30',
        remarks: '附带验收单、临床1周试用报告、电子合同、发票原件挂账入ERP系统。'
      },
      {
        id: 'PAY-03',
        nodeName: '财务科预审与合规复核',
        responsiblePerson: '赵财务 (财务资产主管)',
        department: '财务科',
        status: 'completed',
        completedAt: '2026-10-05 14:00',
        remarks: '维保专项预算指标充足，票据合规完整，已生成支付凭证清单。'
      },
      {
        id: 'PAY-04',
        nodeName: '分管院长与院长付款签批',
        responsiblePerson: '刘志刚 (院长) / 王建国 (副院长)',
        department: '院领导班子',
        status: 'completed',
        completedAt: '2026-10-06 10:15',
        remarks: '院级资金大额付款单审批通过，同意出纳电汇拨付。'
      },
      {
        id: 'PAY-05',
        nodeName: '银行公对公网银电汇出纳打款',
        responsiblePerson: '孙出纳 (结算专员)',
        department: '财务出纳室',
        status: 'completed',
        completedAt: '2026-10-07 11:30',
        remarks: '网银转账成功，业务凭证号：WLPH-BK-20261007-9921',
        transactionVoucherNo: 'WLPH-BK-20261007-9921'
      },
      {
        id: 'PAY-06',
        nodeName: '厂家回款确认与保修建档',
        responsiblePerson: '李海明 (厂家财务)',
        department: '德国狼牌技术中心',
        status: 'completed',
        completedAt: '2026-10-07 14:20',
        remarks: '款项已实收全额入账，12个月售后质保系统正式激活！'
      }
    ],
    isPaymentCompleted: true
  }
};

/**
 * 读取所有返厂大修订单
 */
export function loadFactoryRepairOrders(): ReturnFactoryRepairOrder[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([SEED_FACTORY_REPAIR_ORDER]));
      return [SEED_FACTORY_REPAIR_ORDER];
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([SEED_FACTORY_REPAIR_ORDER]));
      return [SEED_FACTORY_REPAIR_ORDER];
    }
    return parsed;
  } catch (e) {
    console.error('Failed to load factory repair orders', e);
    return [SEED_FACTORY_REPAIR_ORDER];
  }
}

/**
 * 保存返厂大修订单
 */
export function saveFactoryRepairOrders(orders: ReturnFactoryRepairOrder[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
    window.dispatchEvent(new CustomEvent('factory_repair_orders_updated', { detail: orders }));
  } catch (e) {
    console.error('Failed to save factory repair orders', e);
  }
}

/**
 * 快速跳转或重置到任意阶段（用于向领导与专家演示）
 */
export function jumpToStage(orderId: string, targetStage: FactoryRepairStage): ReturnFactoryRepairOrder {
  const orders = loadFactoryRepairOrders();
  const order = orders.find(o => o.id === orderId) || SEED_FACTORY_REPAIR_ORDER;
  
  const stageIndex = STAGE_CONFIGS.findIndex(s => s.key === targetStage);
  const percent = Math.round(((stageIndex + 1) / STAGE_CONFIGS.length) * 100);

  order.currentStage = targetStage;
  order.stageProgressPercent = percent;
  order.updatedAt = new Date().toISOString().replace('T', ' ').substring(0, 16);

  saveFactoryRepairOrders(orders);
  return order;
}

/**
 * 添加双向沟通留言
 */
export function addDialogueMessageToOrder(orderId: string, message: Omit<DialogueMessage, 'id' | 'timestamp'>): DialogueMessage {
  const orders = loadFactoryRepairOrders();
  const order = orders.find(o => o.id === orderId) || orders[0];
  
  const fullMsg: DialogueMessage = {
    ...message,
    id: `MSG-${Date.now()}`,
    timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16)
  };

  order.dialogueMessages.push(fullMsg);
  order.updatedAt = fullMsg.timestamp;
  saveFactoryRepairOrders(orders);
  return fullMsg;
}

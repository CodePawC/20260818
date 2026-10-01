import { ApprovalApplication } from '../types/approvalTypes';

export const INITIAL_APPROVAL_APPLICATIONS: ApprovalApplication[] = [
  {
    id: 'APP-2026-0921-087',
    type: 'return_factory_repair',
    title: '【麻醉手术科】德国狼牌输尿管硬镜(8703.534)图像模糊返厂大修四级审批呈批件',
    urgency: 'critical',
    status: 'approved',
    applicantId: 'STAFF-267-02',
    applicantName: '黄晓彤',
    applicantDepartment: '麻醉手术科',
    applicantPhone: '13863371086',
    createdAt: '2026-09-21 08:45',
    updatedAt: '2026-09-21 16:00',
    currentApprovalNode: '院长终审签章已通过 (实施维修阶段)',
    nextApproverRole: '已归档实施 / 顺丰特快寄出原厂技术中心',
    
    targetEquipmentId: 'EQ-2023-09855',
    targetEquipmentName: '德国狼牌输尿管硬镜',
    targetModel: 'Richard Wolf 8703.534 (8/9.8Fr 430mm 12°)',
    targetCount: 1,
    estimatedBudget: 14200,
    borrowingHistorySummary: '麻醉手术科高频主力微创器械，近期手术碎石患者激增，术中突发视场发暗严重模糊，医工现场判定蓝宝石封胶开裂进水、HOPKINS棒状镜碎裂。',
    clinicalNecessityReason: '输尿管镜图像清晰度为泌尿外科微创碎石手术核心生命线；院内无百级洁净间与激光干涉光轴微调设备，必须返厂由原厂技术中心大修换件。',
    clinicalRiskAnalysis: '若不及时返厂，术中视场盲区极易引起输尿管黏膜穿孔大出血医疗事故；目前科室仅剩单镜备用，无法应对突发急症。',
    aiRecommendationReport: '综合研判：设备原值16.8万元，现残值良好。大修预算1.42万元仅占新机8.4%，修复后可完全恢复4K超清透光率并享有12个月质保，具有极高投产比。',

    auditLogs: [
      {
        id: 'LOG-087-01',
        nodeName: '麻醉手术科报修与确认',
        operatorName: '黄晓彤',
        operatorRole: '麻醉手术科护士长',
        operatorDept: '麻醉手术科',
        action: 'submitted',
        comment: '术中视野起雾模糊，严重影响微创手术操作，已在系统详细报修并经设备科现场勘查核实。',
        operatedAt: '2026-09-21 08:45'
      },
      {
        id: 'LOG-087-02',
        nodeName: '设备科主管技术核验与起草',
        operatorName: '崔伟',
        operatorRole: '医疗设备科科长 / 主管工程师',
        operatorDept: '医疗设备科',
        action: 'agreed',
        comment: '经现场光学投影仪与负压测漏仪检测，证实镜头封胶进水、第2组柱镜碎裂，必须返厂大修。已一键起草呈报文书并下达科室。',
        signatureUrl: '崔伟_signed',
        operatedAt: '2026-09-21 10:55'
      },
      {
        id: 'LOG-087-03',
        nodeName: '分管院长审核签字',
        operatorName: '王建国',
        operatorRole: '业务副院长 / 装备委员会主任',
        operatorDept: '院领导班子',
        action: 'agreed',
        comment: '同意返厂大修。请设备科严格控制维修质量与配件保修期，压缩维修停机时间，呈刘院长终审。',
        signatureUrl: '王建国_signed',
        operatedAt: '2026-09-21 14:20'
      },
      {
        id: 'LOG-087-04',
        nodeName: '院长终审签章',
        operatorName: '刘志刚',
        operatorRole: '院长 / 法定代表人',
        operatorDept: '院领导班子',
        action: 'agreed',
        comment: '批准实施维修。请严格落实平台联合议价，控制在预算范围内并确保不少于12个月质保，全程规范留痕。',
        signatureUrl: '刘志刚_signed_seal',
        operatedAt: '2026-09-21 16:00'
      }
    ],
    attachments: [
      {
        id: 'ATT-087-01',
        name: '输尿管镜现场光学模糊与封胶进水勘查图集.pdf',
        size: '4.8 MB',
        type: 'pdf',
        uploadedAt: '2026-09-21 09:40'
      },
      {
        id: 'ATT-087-02',
        name: '德国狼牌原厂大修资质与保修承诺书.pdf',
        size: '2.1 MB',
        type: 'pdf',
        uploadedAt: '2026-09-21 10:20'
      }
    ]
  },
  {
    id: 'APP-2026-0818-001',
    type: 'procurement_increase',
    title: '【重症医学科】危重症转运呼吸机 2台 临床增配采购立项申请',
    urgency: 'critical',
    status: 'pending_engineering',
    applicantId: 'STAFF-ICU-01',
    applicantName: '陈立强',
    applicantDepartment: '重症医学科 (ICU)',
    applicantPhone: '13806331101',
    createdAt: '2026-08-16 09:30',
    updatedAt: '2026-08-17 14:20',
    currentApprovalNode: '医学工程处 · 技术论证与选型审核',
    nextApproverRole: '医学工程处长 / 临床工程师',
    
    targetEquipmentName: '危重症转运呼吸机',
    targetModel: '迈瑞 SV300 Pro / 德尔格 Oxylog 3000 Plus',
    targetCount: 2,
    estimatedBudget: 380000,
    borrowingHistorySummary: '近30天内自医院应急周转库借调转运呼吸机2台，累计占用天数达22天，超期未还7天，呈现常态化“以借代配”状态。',
    clinicalNecessityReason: 'ICU收治危重病患中行床旁气管插管且需外出CT、DSA介入手术治疗的频次激增（日均3~5人次），现有科室固定转运呼吸机无法满足抢救重叠需求。',
    clinicalRiskAnalysis: '常态化占用全院应急机动资源，导致应急库呼吸支持待命容量下降50%；若遭遇突发群体性伤员抢救将出现全院机动真空。',
    aiRecommendationReport: 'Gemini AI 智能分析评估：ICU科室转运呼吸支持周转率已达280%，属于高频刚需。建议优先纳入2026年医学装备增配专项预算，配置2台具备交直流无缝切换与高压氧直充功能的转运机型。',

    auditLogs: [
      {
        id: 'LOG-001',
        nodeName: '科室发起申报',
        operatorName: '陈立强',
        operatorRole: 'ICU主治医师 / 设备联络员',
        operatorDept: '重症医学科',
        action: 'submitted',
        comment: '基于近月临床抢救与转运高负荷实际情况，结合应急库借调超期数据，正式发起科室增配立项申请。',
        operatedAt: '2026-08-16 09:30'
      },
      {
        id: 'LOG-002',
        nodeName: '临床科室主任审核',
        operatorName: '张建军',
        operatorRole: '重症医学科主任',
        operatorDept: '重症医学科',
        action: 'agreed',
        comment: '情况属实，转运呼吸机系抢救生命保障基础设备，临床增配刻不容缓，同意呈报医工处。',
        signatureUrl: '张建军_signed',
        operatedAt: '2026-08-16 16:45'
      }
    ],
    attachments: [
      {
        id: 'ATT-01',
        name: 'ICU近三个月病患外出转运呼吸支持记录表.xlsx',
        size: '1.2 MB',
        type: 'excel',
        uploadedAt: '2026-08-16 09:30'
      },
      {
        id: 'ATT-02',
        name: '迈瑞SV300Pro与德尔格Oxylog技术参数对比表.pdf',
        size: '3.4 MB',
        type: 'pdf',
        uploadedAt: '2026-08-16 09:32'
      }
    ]
  },
  {
    id: 'APP-2026-0817-002',
    type: 'part_replacement',
    title: '【放射影像科】联影悬吊DR (U-DR 770) 更换X射线球管重大维修审批',
    urgency: 'critical',
    status: 'pending_committee',
    applicantId: 'ENG-002',
    applicantName: '王凯',
    applicantDepartment: '医学工程保障中心',
    applicantPhone: '13906338822',
    createdAt: '2026-08-17 11:00',
    updatedAt: '2026-08-18 10:15',
    currentApprovalNode: '医学装备管理委员会 / 业务分管副院长终审',
    nextApproverRole: '分管院长 / 装备委员会主任',

    equipmentId: 'RAD-DR-01',
    equipmentName: '直接数字化X射线摄影系统 (悬吊DR)',
    equipmentModel: 'uDR 770i',
    equipmentSn: 'UI-DR-2021-9982',
    equipmentCategory: '06-医用成像器械',
    equipmentLocation: '门诊医技楼 1F 放射科DR一室',
    equipmentPurchasePrice: 1850000,
    equipmentPurchaseDate: '2021-04-15',
    equipmentCumulativeMaintenanceCost: 65000,

    partName: '原厂医用X射线管总成 (X-Ray Tube)',
    partModel: 'Varian RAD-14 / 联影定制高热容量管组',
    partEstimatedCost: 85000,
    faultSymptoms: '急诊患者胸片检查曝光中途主机高压报警，代码Err-HV-302，伴随管套内部电弧击穿声，高压电缆绝缘电阻降至0.2MΩ，已彻底无法出束。',
    technicalAssessment: '现场医工工程师与联影原厂资深工程师联合排查，拆机测量灯丝阻值呈开路断裂状态，高压真空度丧失，属于球管正常靶面热疲劳损耗寿终（累计曝光已超18.5万次），无现场修复可能，需整组换新。',
    downtimeImpact: '导致门急诊DR一室全面停摆，日均120人次急诊与外伤拍片需紧急分流至DR二室，二室排队等候时间延长至45分钟以上，需特急审批采购配件抢修。',

    supplierQuotations: [
      {
        id: 'QUO-01',
        supplier: '上海联影医疗科技股份有限公司 (原厂直供)',
        partModel: 'uDR-TB-08A 原装管组',
        price: 85000,
        leadTimeDays: 2,
        warrantyMonths: 12,
        isRecommended: true,
        notes: '原厂全新原装，提供驻场24小时紧急换装及校准验收服务'
      },
      {
        id: 'QUO-02',
        supplier: '华东医疗影像技术服务有限公司 (原厂翻新备件)',
        partModel: 'Varian RAD-14 重新注油真空管',
        price: 62000,
        leadTimeDays: 5,
        warrantyMonths: 6,
        isRecommended: false,
        notes: '第三方维修翻新，质保期较短'
      }
    ],

    auditLogs: [
      {
        id: 'LOG-101',
        nodeName: '工程师现场诊断与报修',
        operatorName: '王凯',
        operatorRole: '临床影像设备主管工程师',
        operatorDept: '医学工程保障中心',
        action: 'submitted',
        comment: '经现场高压测试确认球管靶面熔损与灯丝开路，单次配件金额超过¥50,000重大维修阈值，提交大额配件更换审批。',
        operatedAt: '2026-08-17 11:00'
      },
      {
        id: 'LOG-102',
        nodeName: '使用科室主任确认',
        operatorName: '刘宏伟',
        operatorRole: '放射影像科主任',
        operatorDept: '放射影像科',
        action: 'agreed',
        comment: '目前急诊拍片拥堵严重，恳请医院开辟绿色抢修采购通道，加急审批换管！',
        signatureUrl: '刘宏伟_signed',
        operatedAt: '2026-08-17 14:10'
      },
      {
        id: 'LOG-103',
        nodeName: '医学工程处技术论证与比价',
        operatorName: '赵志刚',
        operatorRole: '医学工程处处长',
        operatorDept: '医学工程保障中心',
        action: 'agreed',
        comment: '技术鉴定结论准确，原厂报价合理（含1年质保与靶向校准），建议选用联影原厂直供配件，呈报院领导审批。',
        signatureUrl: '赵志刚_signed',
        operatedAt: '2026-08-18 10:15'
      }
    ],
    attachments: [
      {
        id: 'ATT-101',
        name: 'DR现场球管击穿故障检测报告单.pdf',
        size: '2.1 MB',
        type: 'pdf',
        uploadedAt: '2026-08-17 11:00'
      },
      {
        id: 'ATT-102',
        name: '联影原厂官方备件报价单及质保承诺函.pdf',
        size: '1.8 MB',
        type: 'pdf',
        uploadedAt: '2026-08-17 11:05'
      }
    ]
  },
  {
    id: 'APP-2026-0815-003',
    type: 'scrap_disposal',
    title: '【心血管内科】飞利浦 HeartStart XL 双相波除颤监护仪 报废技术鉴定申请',
    urgency: 'normal',
    status: 'approved',
    applicantId: 'ENG-003',
    applicantName: '李明华',
    applicantDepartment: '医学工程保障中心',
    applicantPhone: '13706336633',
    createdAt: '2026-08-15 14:00',
    updatedAt: '2026-08-17 17:30',
    currentApprovalNode: '审批已办结 · 准予下架报废并注销台账',
    nextApproverRole: '资产档案管理员 / 财务科',

    equipmentId: 'DEF-CARD-03',
    equipmentName: '双相波除颤监护仪',
    equipmentModel: 'HeartStart XL (M4735A)',
    equipmentSn: 'PH-M4735A-08129',
    equipmentCategory: '08-呼吸、麻醉和急救器械',
    equipmentLocation: '住院部 4F 心内科重症监护病房',
    equipmentPurchasePrice: 98000,
    equipmentPurchaseDate: '2013-05-20',
    equipmentCumulativeMaintenanceCost: 52000,

    scrapCategory: 'beyond_repair',
    technicalEvaluation: '1. 设备投入临床使用已超13年（原厂设计使用年限8年），严重超役服役；\n2. 经计量强检放电能量测试，在设定360J档位时实际输出仅为185J（误差超-48%，严重不合格）；\n3. 高压储能电容电解液渗漏腐蚀主板，充电时间延长至28秒（国家抢救标准要求<10秒）；\n4. 飞利浦原厂已于2019年全面停产该机型全线备件，无法采购原装高压模块。继续使用存在抢救延误及电击病人安全风险。',
    salvageValueEstimate: 800,
    safetyHazardNotice: '高压电容绝缘击穿，存在漏电及抢救除颤无能量输出致死风险，属于强行报废类生命支持设备。',
    suggestedDisposalWay: 'scrap_destroy',

    auditLogs: [
      {
        id: 'LOG-201',
        nodeName: '质控工程师技术鉴定发起',
        operatorName: '李明华',
        operatorRole: '急救设备质控主管工程师',
        operatorDept: '医学工程保障中心',
        action: 'submitted',
        comment: '强检能量衰减超标，原厂停产无配件，且超役服役13年，符合国家医疗设备技术报废标准。',
        operatedAt: '2026-08-15 14:00'
      },
      {
        id: 'LOG-202',
        nodeName: '使用科室主任签署确认',
        operatorName: '孙桂芳',
        operatorRole: '心血管内科主任',
        operatorDept: '心血管内科',
        action: 'agreed',
        comment: '同意报废。科室已临时调拨备用除颤仪，建议尽快安排新机型采购补充。',
        signatureUrl: '孙桂芳_signed',
        operatedAt: '2026-08-15 16:30'
      },
      {
        id: 'LOG-203',
        nodeName: '医学工程处长审核',
        operatorName: '赵志刚',
        operatorRole: '医学工程处处长',
        operatorDept: '医学工程保障中心',
        action: 'agreed',
        comment: '技术鉴定事实清楚，符合《大型医用设备报废管理办法》，同意报废处置。',
        signatureUrl: '赵志刚_signed',
        operatedAt: '2026-08-16 11:20'
      },
      {
        id: 'LOG-204',
        nodeName: '分管院长终审签批',
        operatorName: '王副院长',
        operatorRole: '业务副院长 / 装备委员会主任',
        operatorDept: '院领导班子',
        action: 'agreed',
        comment: '同意予以报废。由医工处办理台账销卡，按环保与废旧器械规范进行无害化拆解销毁。',
        signatureUrl: '王建平_signed',
        operatedAt: '2026-08-17 17:30'
      }
    ],
    attachments: [
      {
        id: 'ATT-201',
        name: '除颤仪计量强检不合格检验报告书.pdf',
        size: '1.5 MB',
        type: 'pdf',
        uploadedAt: '2026-08-15 14:00'
      },
      {
        id: 'ATT-202',
        name: '飞利浦官方停产停服通知函.pdf',
        size: '890 KB',
        type: 'pdf',
        uploadedAt: '2026-08-15 14:02'
      }
    ]
  },
  {
    id: 'APP-2026-0818-004',
    type: 'procurement_increase',
    title: '【急诊医学科】智能多通道微量注输泵工作站 6通道 临床增配申请',
    urgency: 'high',
    status: 'pending_dept',
    applicantId: 'STAFF-EMERG-02',
    applicantName: '郭晓芸',
    applicantDepartment: '急诊医学科 (抢救室/EICU)',
    applicantPhone: '13606337788',
    createdAt: '2026-08-18 08:30',
    updatedAt: '2026-08-18 08:30',
    currentApprovalNode: '急诊医学科主任审核',
    nextApproverRole: '急诊医学科主任',

    targetEquipmentName: '智能多通道微量注射泵/输液泵集成工作站',
    targetModel: '迈瑞 BeneFusion VP5/SP5 系列 (6通道带主控屏)',
    targetCount: 1,
    estimatedBudget: 68000,
    borrowingHistorySummary: '急诊抢救室近期收治多发伤与休克危重患者激增，近两周自应急库连续借用注射泵4台，全院微量注输借调占比达45%。',
    clinicalNecessityReason: '抢救室常态化需同时维持血管活性药物（去甲肾上腺素、多巴胺、硝普钠）及电解质精准恒速微量输注，床头散置单泵管路杂乱且充电插头不足，急需一体化多通道集成站。',
    clinicalRiskAnalysis: '多台单泵分散使用易造成管路交叉缠绕及护士巡视读数误判，且反复借调应急库造成全院泵类储备告急。',

    auditLogs: [
      {
        id: 'LOG-301',
        nodeName: '抢救室护士长发起',
        operatorName: '郭晓芸',
        operatorRole: '急诊抢救室护士长',
        operatorDept: '急诊医学科',
        action: 'submitted',
        comment: '抢救室床位微量泵极度紧缺，发起6通道工作站增配申购。',
        operatedAt: '2026-08-18 08:30'
      }
    ]
  },
  {
    id: 'APP-2026-0816-005',
    type: 'loan_extension',
    title: '【呼吸与危重症医学科】应急转运呼吸机 (EMG-VENT-02) 借用延期特批申请',
    urgency: 'normal',
    status: 'archived',
    applicantId: 'STAFF-RESP-01',
    applicantName: '周小波',
    applicantDepartment: '呼吸与危重症医学科',
    applicantPhone: '13506339900',
    createdAt: '2026-08-16 10:00',
    updatedAt: '2026-08-16 15:30',
    currentApprovalNode: '已办结 · 准予延期至2026-08-25',
    nextApproverRole: '归档办结',

    equipmentId: 'EMG-VENT-02',
    equipmentName: '危重症转运呼吸机',
    equipmentModel: 'Oxylog 3000 Plus',
    equipmentSn: 'DRA-OXY-2023-0182',
    loanId: 'LOAN-2026-0805-02',
    originalDueDate: '2026-08-15 18:00',
    requestedDueDate: '2026-08-25 18:00',
    extensionReason: '呼吸重症病房现有2位AECOPD合并重度呼吸衰竭患者需持续进行无创/转运高浓度氧疗过渡，科室自有设备检修中，特申请延长应急周转借用期10天。',

    auditLogs: [
      {
        id: 'LOG-401',
        nodeName: '科室提出延期申请',
        operatorName: '周小波',
        operatorRole: '呼吸科副主任医师',
        operatorDept: '呼吸与危重症医学科',
        action: 'submitted',
        comment: '患者病情危重过渡期，申请延长借用。',
        operatedAt: '2026-08-16 10:00'
      },
      {
        id: 'LOG-402',
        nodeName: '医工应急调配专员特批',
        operatorName: '李明华',
        operatorRole: '应急周转库管理员',
        operatorDept: '医学工程保障中心',
        action: 'agreed',
        comment: '核查应急库尚有3台呼吸机在库待命，临床救治紧迫，同意延期至8月25日，并已暂停系统超期催还。',
        signatureUrl: '李明华_signed',
        operatedAt: '2026-08-16 15:30'
      }
    ]
  },
  {
    id: 'APP-2026-0819-005',
    type: 'overdue_filing',
    title: '【医学影像科】直接数字化X射线机 (岛津RADspeed) 超期整修稳定性合格准用备案审批',
    urgency: 'high',
    status: 'approved',
    applicantId: 'ENG-001',
    applicantName: '崔伟 (主任工程师)',
    applicantDepartment: '医学工程保障中心',
    applicantPhone: '13806336802',
    createdAt: '2026-08-19 08:30',
    updatedAt: '2026-08-20 16:00',
    currentApprovalNode: '医学装备管理委员会 · 备案特许准用生效',
    nextApproverRole: '已办结归档 (特许准用1年)',

    equipmentId: '10163',
    equipmentName: '数字化X射线机 (DR)',
    equipmentModel: 'RADspeed',
    equipmentSn: '0812K19402',
    equipmentCategory: '06-医用成像器械',
    equipmentLocation: '门诊医技楼 2F 放射科DR二室',
    equipmentPurchasePrice: 1200000,
    equipmentPurchaseDate: '2013-05-18',
    equipmentCumulativeMaintenanceCost: 28500,

    overdueFilingDetails: {
      filingNo: 'EXT-2026-0518',
      originalLifespanYears: 10,
      overdueYears: 3.1,
      refurbishDate: '2026-05-18',
      refurbishSummary: '完成整机高压电缆绝缘层翻新、限束器光学定位定标、滤线栅轨道清洗润滑、平板探测器坏点增益校正及系统深度除尘与主电源滤波电容更新。',
      stabilityTestAgency: '山东省医疗器械质量检验中心',
      stabilityTestReportNo: 'QA-STB-20260525-09',
      continuousRunHours: 72,
      driftRate: '<0.28%',
      gb9706Result: 'PASS',
      validUntil: '2027-05-31',
      leadEngineer: '崔伟 (主任工程师)',
      monitoringFrequency: 'MONTHLY',
      approvalDocNo: '医装委备[2026]019号'
    },

    auditLogs: [
      {
        id: 'LOG-501',
        nodeName: '医学工程处提交超期整修及质控报告',
        operatorName: '崔伟',
        operatorRole: '医学工程处主任工程师',
        operatorDept: '医学工程保障中心',
        action: 'submitted',
        comment: '该机已超标称寿命3.1年，经我处与岛津原厂深度整修，并委托省质检所完成72小时满载稳定性及GB 9706.1电气安全全项检验合格，现呈报委员会特许备案准用1年。',
        operatedAt: '2026-08-19 08:30'
      },
      {
        id: 'LOG-502',
        nodeName: '临床使用科室主任确认',
        operatorName: '刘海峰',
        operatorRole: '医学影像科主任',
        operatorDept: '医学影像科',
        action: 'agreed',
        comment: '门诊普通骨骼拍片量大，该机经整修后图像清晰度与响应速度良好，同意在严格落实按月重点质控巡检前提下延期准用1年。',
        signatureUrl: '刘海峰_signed',
        operatedAt: '2026-08-19 14:10'
      },
      {
        id: 'LOG-503',
        nodeName: '医学装备管理与伦理委员会终审',
        operatorName: '孙志强',
        operatorRole: '医学装备处长 / 委员会秘书长',
        operatorDept: '医院医学装备管理委员会',
        action: 'agreed',
        comment: '经专家组现场复核质检报告(QA-STB-20260525-09)，电气安全与输出漂移指标优于国标，同意核发《特许准用备案证》(医装委备[2026]019号)，有效期至2027年5月31日，由崔工负责每月重点绝缘监测。',
        signatureUrl: '孙志强_signed',
        operatedAt: '2026-08-20 16:00'
      }
    ]
  }
];

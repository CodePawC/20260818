/**
 * 课题结项报告第六章 11项核心评价指标原子级穿透下钻（Atomic Drill-Down）数据库
 * 
 * 严格对应表 6-1、表 6-1A 与表 6-1B：
 * 实现“微观业务流转即宏观指标核算”的穿透核验证据链
 */

export interface IndicatorSampleRecord {
  id: string;
  code: string;
  title: string;
  department: string;
  status: 'compliant' | 'warning' | 'audit_pass' | 'closed';
  keyField1: string;
  keyField2: string;
  auditEvidence: string;
  timestamp: string;
  sha256?: string;
  verifiedBy?: string;
}

export interface CoreIndicatorDetail {
  id: number;
  name: string;
  dimension: string;
  traditionalBenchmark: string;
  targetValue: string;
  simulatedValue: string;
  improvement: string;
  formula: string;
  denominatorDesc: string;
  numeratorDesc: string;
  denominatorCount: number;
  numeratorCount: number;
  managementMeaning: string;
  targetBasis: string;
  evidenceSource: string;
  linkedTab: string;
  linkedTabLabel: string;
  sampleList: IndicatorSampleRecord[];
}

export const CORE_11_INDICATORS_DATA: CoreIndicatorDetail[] = [
  {
    id: 1,
    name: '设备主数据规范率',
    dimension: '数据治理',
    traditionalBenchmark: '71.4% (历史台账抽检)',
    targetValue: '≥98%',
    simulatedValue: '98.6% (1,312/1,331台)',
    improvement: '+27.2个百分点，主数据字典统一与四码映射杜绝歧义',
    formula: '（规范设备主数据条目数 ÷ 在册设备主数据总条目数）× 100%',
    denominatorDesc: '全院在册在用医学装备资产主数据条目总数（共1,331台）',
    numeratorDesc: '完成四码映射（院内Asset ID+出厂SN+国家UDI+分类代码）且四级空间定点合规数（1,312台）',
    denominatorCount: 1331,
    numeratorCount: 1312,
    managementMeaning: '衡量资产底座标准化水平，消灭“一物多名、编码重叠、账实脱节”的底层语义孤岛。',
    targetBasis: '参照三级公立医院绩效考核数据质量要求、三甲医院等级评审设备管理条款',
    evidenceSource: '设备台账主库、草料二维码活码数据库、国家药监局UDI接口映射表',
    linkedTab: 'master_data',
    linkedTabLabel: '主数据管理中心',
    sampleList: [
      {
        id: 'SMP-01-01',
        code: 'EQ-2024-0012',
        title: '多参数监护仪 BeneVision N17',
        department: '重症医学科 (ICU)',
        status: 'compliant',
        keyField1: 'UDI: (01)06941234500128(21)SN20240319',
        keyField2: '位置: 外科病房楼 -> 4F -> 重症监护病区 -> 03床旁',
        auditEvidence: '四码100%映射校验通过，出厂SN与台账完全吻合，空间锁定至床旁',
        timestamp: '2026-09-18 09:15:22',
        sha256: '9f8e7d6c5b4a3120efbc789123456789abcdef0123456789abcdef0123456789',
        verifiedBy: '崔伟 (工程师)'
      },
      {
        id: 'SMP-01-02',
        code: 'EQ-2023-0185',
        title: '除颤监护仪 Mindray BeneHeart D6',
        department: '急诊科 (抢救室)',
        status: 'compliant',
        keyField1: 'UDI: (01)06941234500882(21)D6-883719',
        keyField2: '位置: 门诊急诊楼 -> 1F -> 急诊抢救大厅 -> 抢救01号机位',
        auditEvidence: '四码协同绑定，草料活码已生成，强检计量目录绑定代码 07-01-01',
        timestamp: '2026-09-18 10:22:40',
        sha256: '3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b7c6d5e4f3a2b',
        verifiedBy: '王增祝 (工程师)'
      },
      {
        id: 'SMP-01-03',
        code: 'EQ-2022-0410',
        title: '数字化医用X射线摄影系统 (DR)',
        department: '医学影像科',
        status: 'compliant',
        keyField1: 'UDI: (01)06938812900410(21)DRX-2022-99',
        keyField2: '位置: 门诊急诊楼 -> 1F -> 影像诊断中心 -> DR 1号机房',
        auditEvidence: '国家NMPA 06类分类代码绑定，水电气场地环评报告电子卷宗已关联',
        timestamp: '2026-09-17 14:05:11',
        sha256: '7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d',
        verifiedBy: '崔伟 (工程师)'
      },
      {
        id: 'SMP-01-04',
        code: 'EQ-2021-0089',
        title: '血液透析机 4008S Version 8',
        department: '血液净化中心 (透析室)',
        status: 'compliant',
        keyField1: 'UDI: (01)04012345678901(21)HD-4008-089',
        keyField2: '位置: 综合住院楼 -> 3F -> 血液透析大厅 -> 阴性区08号机位',
        auditEvidence: '超期特许准用备案完成 (EXT-2026-0182)，双重合规徽章已点亮',
        timestamp: '2026-09-16 11:30:00',
        sha256: '1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b',
        verifiedBy: '胡云飞 (科室主任)'
      }
    ]
  },
  {
    id: 2,
    name: '供应商主数据规范率',
    dimension: '数据治理',
    traditionalBenchmark: '68.2% (重名与缺少信用码)',
    targetValue: '≥95%',
    simulatedValue: '96.4% (81/84家)',
    improvement: '+28.2个百分点，统一社会信用代码前置校验与资质解耦',
    formula: '（资质合规且三码唯一的往来供应商数 ÷ 往来供应商总数）× 100%',
    denominatorDesc: '系统录入的往来供应商、生产厂家及第三方维保检测机构总数（84家）',
    numeratorDesc: '完成统一社会信用代码校验、资质在期、供货维保角色解耦的合规企业数（81家）',
    denominatorCount: 84,
    numeratorCount: 81,
    managementMeaning: '评价往来主体数据纯净度，支持外协阳光比价、资质穿透与合规廉洁监管。',
    targetBasis: '参照政府采购供应商资质管理要求、院内审计整改口径',
    evidenceSource: '供应商全息资质档案库、国家企业信用信息公示系统直连对账',
    linkedTab: 'partner_management',
    linkedTabLabel: '供应商协同与资质管理',
    sampleList: [
      {
        id: 'SMP-02-01',
        code: 'VND-2026-001',
        title: '深圳迈瑞生物医疗电子股份有限公司',
        department: '设备科 / 耗材科',
        status: 'compliant',
        keyField1: '信用码: 91440300618844888L',
        keyField2: '角色: 生产厂家 + 原厂售后技术维保服务商',
        auditEvidence: '二类/三类医疗器械经营许可证年审通过，授权委托书期限至2027-12-31',
        timestamp: '2026-09-18 08:30:00',
        verifiedBy: '杨志峰 (审计科主任)'
      },
      {
        id: 'SMP-02-02',
        code: 'VND-2026-008',
        title: '山东新华医疗器械股份有限公司',
        department: '感控科 / 消毒供应中心',
        status: 'compliant',
        keyField1: '信用码: 91370300164101188X',
        keyField2: '角色: 生产厂家 + 灭菌特种设备定检维保商',
        auditEvidence: '特种设备安装改造维修许可证 (TS3837001-2027) 查验有效',
        timestamp: '2026-09-17 15:40:12',
        verifiedBy: '杨志峰 (审计科主任)'
      }
    ]
  },
  {
    id: 3,
    name: '档案资料完整率',
    dimension: '数据治理',
    traditionalBenchmark: '52.1% (纸质说明书/合同散失)',
    targetValue: '≥95%',
    simulatedValue: '96.8% (重点抽检设备)',
    improvement: '+44.7个百分点，“一机一档”全息电子卷宗强制归集',
    formula: '（具备全要素资料归档设备数 ÷ 重点在册抽检设备总数）× 100%',
    denominatorDesc: '全院大型、急救与生命支持类重点纳管设备抽检总数（500台全样本）',
    numeratorDesc: '采购合同、说明书、安装验收单、强检证书、维修记录五要素齐备设备数（484台）',
    denominatorCount: 500,
    numeratorCount: 484,
    managementMeaning: '评估“一机一档”全息履历归集质量，化解传统纸质资料分散遗失带来的管理与法律风险。',
    targetBasis: '《医疗器械监督管理条例》第43条设备查验记录保存要求',
    evidenceSource: '一机一档全息电子卷宗库、不可变档案审计哈希',
    linkedTab: 'master_data',
    linkedTabLabel: '一机一档全息卷宗',
    sampleList: [
      {
        id: 'SMP-03-01',
        code: 'ARC-2026-0041',
        title: '64排128层螺旋CT 机组全息档案',
        department: '医学影像科',
        status: 'audit_pass',
        keyField1: '归档卷号: ARC-CT-64-001 (18份PDF与图纸)',
        keyField2: '卷宗要素: 招投标文件、进出口报关单、验收单、辐射安全许可证',
        auditEvidence: '五大法定要素100%齐备，历次管球更换记录与稳定性检测均已装卷',
        timestamp: '2026-09-18 16:20:00',
        sha256: '4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e',
        verifiedBy: '崔伟 (工程师)'
      }
    ]
  },
  {
    id: 4,
    name: '报修工单资料完整率',
    dimension: '流程闭环',
    traditionalBenchmark: '79.3% (漏记配件/口头派工)',
    targetValue: '≥98%',
    simulatedValue: '98.2% (测试工单全样本)',
    improvement: '+18.9个百分点，工单SOP必填字段系统硬性卡点',
    formula: '（要素齐全工单数 ÷ 完工报修工单总数）× 100%',
    denominatorDesc: '统计周期内累计产生的维修工单总数（1,860单）',
    numeratorDesc: '故障描述、响应时戳、处置步骤、备件追溯、临床双人验签要素齐全工单数（1,827单）',
    denominatorCount: 1860,
    numeratorCount: 1827,
    managementMeaning: '评价维保过程记录的完整性与可追溯性，防范事后追责无据与备件黑箱。',
    targetBasis: '医疗设备维修质量管理规范、院内质控抽查标准',
    evidenceSource: '一事一单维修工单数据库、现场微信扫码图片快照',
    linkedTab: 'repair_closed_loop',
    linkedTabLabel: '一事一单工单中心',
    sampleList: [
      {
        id: 'SMP-04-01',
        code: 'WO-202609-0042',
        title: '新生儿暖箱温控报警现场急修工单',
        department: '新生儿科 (NICU)',
        status: 'closed',
        keyField1: '报修人: 张晓华 (护士长) / 响应时间: 7分钟',
        keyField2: '耗件: 更换原厂温度传感器探头 (SN: PRB-2026-90)',
        auditEvidence: '到场勘验照片、旧件回收凭证、临床实测温度36.5℃双人签字齐全',
        timestamp: '2026-09-18 11:45:00',
        sha256: '8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b7c',
        verifiedBy: '王方鑫 (财务核销初审)'
      }
    ]
  },
  {
    id: 5,
    name: '维修任务闭环率',
    dimension: '流程闭环',
    traditionalBenchmark: '82.5% (修完不验收即投用)',
    targetValue: '≥95%',
    simulatedValue: '97.1% (全流程办结)',
    improvement: '+14.6个百分点，临床现场双人验签放行刚性闭环',
    formula: '（全流程验收闭环维修任务数 ÷ 派工处置维修任务总数）× 100%',
    denominatorDesc: '统计周期内已派工并实施处置的维修任务总数（1,550项）',
    numeratorDesc: '完成工程质检、临床双人通电验收、归档销号的任务数（1,505项）',
    denominatorCount: 1550,
    numeratorCount: 1505,
    managementMeaning: '检验维修业务是否真正终结，杜绝“修完不经验收即恢复使用”的管理漏洞。',
    targetBasis: '等级评审“医疗设备维修质量与安全验收”核心评价条款',
    evidenceSource: '临床电子验签记录表、现场通电功能复查签名',
    linkedTab: 'repair_closed_loop',
    linkedTabLabel: '维修闭环验签台',
    sampleList: [
      {
        id: 'SMP-05-01',
        code: 'TSK-2026-0819',
        title: '奥林巴斯电子胃镜 (GIF-H290) 弯曲角度受限大修',
        department: '消化内科 (内镜中心)',
        status: 'closed',
        keyField1: '外协供应商: 上海医镜医疗器械技术有限公司',
        keyField2: '三单勾稽: 报价单¥12,800 = 完工报告 = 发票无差异',
        auditEvidence: '内窥镜气密性检漏合格，葛晓燕主任现场操作视野与角度双人验签放行',
        timestamp: '2026-09-17 17:10:00',
        sha256: '2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a',
        verifiedBy: '葛晓燕 (副主任医师)'
      }
    ]
  },
  {
    id: 6,
    name: '预防性维护（PM）完成率',
    dimension: '预防维护',
    traditionalBenchmark: '64.0% (被动抢修挤占计划)',
    targetValue: '≥90%',
    simulatedValue: '92.5% (按期派工执行)',
    improvement: '+28.5个百分点，周期智能到期提醒与绩效扣分约束',
    formula: '（按期完成PM作业台数 ÷ 计划执行PM作业总台数）× 100%',
    denominatorDesc: '主数据内置维护周期生成的年度/季度PM计划总台次（880台次）',
    numeratorDesc: '按标准作业指导书（PM SOP）严格执行电气与性能检测并合格台次（814台次）',
    denominatorCount: 880,
    numeratorCount: 814,
    managementMeaning: '评价设备主动预防维保的制度刚性落地水平，大幅降低临床被动故障抢修率。',
    targetBasis: '原厂技术规范、行业PM管理调研均值、设备主动安全标准',
    evidenceSource: 'PM标准作业指导书执行记录、电气安全分析仪原始测试报表',
    linkedTab: 'maintenance_plans',
    linkedTabLabel: '预防性维护(PM)计划',
    sampleList: [
      {
        id: 'SMP-06-01',
        code: 'PM-2026-Q3-012',
        title: '血透机季度预防性维护与除钙消毒点检',
        department: '血液净化中心',
        status: 'audit_pass',
        keyField1: '点检规范: SOP-PM-HD-03 (含流量校准与压力传感器复测)',
        keyField2: '绝缘阻抗: 85 MΩ (标准>50 MΩ) / 接地电阻: 0.08 Ω',
        auditEvidence: '点检全要素合格，更换除水滤芯1枚，责任工程师与科室护士长确认',
        timestamp: '2026-09-15 14:30:00',
        verifiedBy: '崔伟 (主责工程师)'
      }
    ]
  },
  {
    id: 7,
    name: '计量检测综合有效关联率',
    dimension: '法定红线',
    traditionalBenchmark: '81.2% (超期未察觉/漏检)',
    targetValue: '100% (法定强制底线)',
    simulatedValue: '100% (红线硬性阻断)',
    improvement: '+18.8个百分点，超期自动锁死派工与全院大盘顶格告警',
    formula: '（持有有效法定检定/校准/稳定性证书设备数 ÷ 强检目录在用设备总数）× 100%',
    denominatorDesc: '纳入市场监管总局《实施强制管理的计量器具目录》及辐射装置总数（342台）',
    numeratorDesc: '在有效期内绑定e-CQS强检证书/校准报告且合格设备数（342台，无一带病运行）',
    denominatorCount: 342,
    numeratorCount: 342,
    managementMeaning: '衡量医疗设备质量安全底线，彻底杜绝强检超期器具带病用于临床诊断。',
    targetBasis: '《中华人民共和国计量法》、市场监管总局2020年第42号公告、WS 519/WS 76标准',
    evidenceSource: '全国强检平台 (e-CQS) 检定证书库、日照市检验检测中心官方报告',
    linkedTab: 'metrology_catalogue',
    linkedTabLabel: '法定计量强检监控台',
    sampleList: [
      {
        id: 'SMP-07-01',
        code: 'MET-2026-0089',
        title: '迈瑞 BeneHeart D6 心脏除颤器释放能量校准',
        department: '急诊科抢救大厅',
        status: 'compliant',
        keyField1: '校准证书号: JJF-RZ-2026-08819 (依据JJF 1149-2014)',
        keyField2: '检定机构: 日照市检验检测中心 (市计量所)',
        auditEvidence: '50J/100J/200J/360J各档位能量误差均<3.2%，有效期至 2027-08-15',
        timestamp: '2026-08-16 10:00:00',
        sha256: '9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b',
        verifiedBy: '赵明 (高级工程师/副所长)'
      },
      {
        id: 'SMP-07-02',
        code: 'MET-2026-0112',
        title: '东软 NeuViz 64排CT 机架与辐射防护稳定性检测',
        department: '医学影像科',
        status: 'compliant',
        keyField1: '检测报告: WS519-SD-2026-041 (依据WS 519-2019规范)',
        keyField2: '资质编号: CMA-180020110394 放射卫生服务资质',
        auditEvidence: 'CT剂量指数CTDIvol、空间分辨力、水CT值及均匀性100%在控',
        timestamp: '2026-07-20 15:30:00',
        sha256: '5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d',
        verifiedBy: '第三方质检总工'
      }
    ]
  },
  {
    id: 8,
    name: '任务按时完成率',
    dimension: '服务效能',
    traditionalBenchmark: '67.8% (拖延响应无时限约束)',
    targetValue: '≥90%',
    simulatedValue: '94.3% (SLA时限内交付)',
    improvement: '+26.5个百分点，透明化SLA倒计时看板与自动催办',
    formula: '（在SLA承诺时限内办结闭环任务数 ÷ 约定SLA时限任务总数）× 100%',
    denominatorDesc: '设定有明确响应与修复SLA时限的临床任务总数（1,280项）',
    numeratorDesc: '在生命支持类（30分钟响应）、常规类（2小时响应）时限内办结项数（1,207项）',
    denominatorCount: 1280,
    numeratorCount: 1207,
    managementMeaning: '衡量医工与后勤工程团队的服务响应效率，促进医院后勤服务敏捷化转型。',
    targetBasis: '院内医工服务SLA承诺规程、三甲医院等级评审满意度测评',
    evidenceSource: 'SLA工单流转日志、临床服务满意度评价',
    linkedTab: 'repair_closed_loop',
    linkedTabLabel: 'SLA效能看板',
    sampleList: [
      {
        id: 'SMP-08-01',
        code: 'SLA-2026-1044',
        title: '急诊抢救室呼吸机压力报警紧急响应',
        department: '急诊医学科',
        status: 'audit_pass',
        keyField1: 'SLA承诺: 15分钟到场 / 实际到场: 8分钟 (提前7分钟)',
        keyField2: '处置耗时: 22分钟 (更换呼吸回路集水杯与膜片)',
        auditEvidence: '移动端GPS签到打卡，急诊护士长评价5星，即时恢复备用状态',
        timestamp: '2026-09-18 09:40:00',
        verifiedBy: '严金光 (副院长)'
      }
    ]
  },
  {
    id: 9,
    name: '“一事一单”任务闭环率',
    dimension: '服务效能',
    traditionalBenchmark: '61.5% (口头招呼事后无凭)',
    targetValue: '≥95%',
    simulatedValue: '97.8% (全口径任务纳管)',
    improvement: '+36.3个百分点，巡检随手记与会议督办全量立项',
    formula: '（全口径办结归档任务总数 ÷ 全口径立项任务总数）× 100%',
    denominatorDesc: '扫码报修、隐患巡检、强检申报、行政督办统一立项总数（2,450单）',
    numeratorDesc: '有独立责任人、有处置过程、有审核归档的销号任务数（2,396单）',
    denominatorCount: 2450,
    numeratorCount: 2396,
    managementMeaning: '确保口头安排、领导指示与巡检隐患全量闭环，彻底根治后勤任务脱管悬空。',
    targetBasis: '公立医院“一事一单”精细化运营内控标准（课题核心理论贡献）',
    evidenceSource: '全院一事一单主数据总账、任务状态机审计追踪',
    linkedTab: 'repair_closed_loop',
    linkedTabLabel: '全院一事一单调度池',
    sampleList: [
      {
        id: 'SMP-09-01',
        code: 'TASK-ADMIN-2026-05',
        title: '院长办公会关于老旧生化分析仪安全整修督办任务',
        department: '医学检验科',
        status: 'closed',
        keyField1: '来源: 院医工发〔2026〕督办03号',
        keyField2: '责任人: 胡云飞 (后勤保障科) / 崔伟 (工程技术)',
        auditEvidence: '已完成深度翻新更换加样针总成，经稳定性检测通过后核发特许准用备案',
        timestamp: '2026-09-14 16:00:00',
        verifiedBy: '吴耀宝 (院长)'
      }
    ]
  },
  {
    id: 10,
    name: '人工智能辅助生成工单准确率',
    dimension: '智能协同',
    traditionalBenchmark: '无 (纯人工多级填报)',
    targetValue: '≥85%（关键字段）',
    simulatedValue: '89.2% (120组高噪语料盲审)',
    improvement: '突破性赋能，口语化报修智能分诊大幅降低一线医护填报认知门槛',
    formula: '（双人盲审一致通过且核心字段免修用例数 ÷ 基准语料库测试总数）× 100%',
    denominatorDesc: '高噪真实脱敏临床口语化语料库样本总数（120组标准测试集）',
    numeratorDesc: '设备识别正确、故障等级合理、编辑距离Diff≤1且双人盲审一致通过用例数（107组）',
    denominatorCount: 120,
    numeratorCount: 107,
    managementMeaning: '评估非临床场景下大语言模型意图理解与结构化抽取的真实赋能质量与可解释性。',
    targetBasis: '参照NLP信息抽取国际评测经验值，经两名医工专家背对背独立盲评校准',
    evidenceSource: 'AI交互脱敏审计日志库、编辑距离（Levenshtein Diff）对比报告',
    linkedTab: 'analytics',
    linkedTabLabel: 'AI分析与智能排查引擎',
    sampleList: [
      {
        id: 'SMP-10-01',
        code: 'NLP-BENCH-001',
        title: '“急诊抢救室监护仪屏幕狂闪充不上电，急用！”',
        department: '急诊科 (输入原始语料)',
        status: 'audit_pass',
        keyField1: 'AI抽取: 设备=多参数监护仪 | 故障=充放电与显示异常 | 优先级=生命支持最高级',
        keyField2: '基准比对: 专家Ground Truth匹配率 100% (Diff = 0)',
        auditEvidence: '盲审专家崔伟与王增祝一致核定通过，成功推荐就近应急备用机',
        timestamp: '2026-09-18 10:11:05',
        verifiedBy: '孔令海 (大数据教授/评审专家)'
      },
      {
        id: 'SMP-10-02',
        code: 'NLP-BENCH-045',
        title: '“透析室3号机接地线表面有轻微磨损，建议下周一前复测阻抗”',
        department: '血液净化中心 (巡检随手记)',
        status: 'audit_pass',
        keyField1: 'AI抽取: 任务类别=PM巡检隐患 | 标的=血透机03号 | 处置建议=复测接地阻抗',
        keyField2: '规范对齐: 自动映射标准SOP条目 PM-SOP-ELEC-02',
        auditEvidence: '双人盲审评定：未发生幻觉，准确提取操作人意图并立项',
        timestamp: '2026-09-17 09:20:18',
        verifiedBy: '崔伟 (工程师)'
      }
    ]
  },
  {
    id: 11,
    name: '后勤工作量可视化覆盖率',
    dimension: '量化赋能',
    traditionalBenchmark: '34.2% (大量隐性劳动被忽略)',
    targetValue: '≥90%',
    simulatedValue: '93.5% (数字工单全量覆盖)',
    improvement: '+59.3个百分点，碎片化后勤与数据治理工时显性化',
    formula: '（被系统工单与时钟记录显性化工时 ÷ 后勤工程团队总工时）× 100%',
    denominatorDesc: '医工与后勤工程团队全月考勤工时总基数（1,680小时）',
    numeratorDesc: '在维修处置、PM点检、强检送验、数据清洗等模块具有数字痕迹工时（1,571小时）',
    denominatorCount: 1680,
    numeratorCount: 1571,
    managementMeaning: '将原本隐性、零散、随叫随到的服务转化为显性数字资产，支撑绩效量化与运营评价。',
    targetBasis: '《公立医院成本核算规范》（国卫财务发〔2021〕4号）工作量分摊要求',
    evidenceSource: '工程师移动打卡工时系统、一事一单工时积分核算底册',
    linkedTab: 'repair_closed_loop',
    linkedTabLabel: '工效与工作量看板',
    sampleList: [
      {
        id: 'SMP-11-01',
        code: 'LABOR-202609-08',
        title: '全院45个临床科室存量设备铭牌核对与数据治理工时',
        department: '医学工程科',
        status: 'audit_pass',
        keyField1: '治理投入: 3名工程师历时14个工作日，现场核验1,331台设备',
        keyField2: '量化成果: 补全缺失SN码142条，核实空间定位100%',
        auditEvidence: '数据清洗全量留痕，生成历史比对差异清单，工作量计入绩效奖金底册',
        timestamp: '2026-09-16 17:30:00',
        verifiedBy: '王方鑫 (财务科主任)'
      }
    ]
  }
];

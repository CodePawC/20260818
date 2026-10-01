import { 
  AdverseEventRecord, 
  AdverseEventMetrics, 
  AdverseEventSeverity,
  CausalityConclusion,
  AdverseEventStatus 
} from '../types/adverseEventTypes';

const STORAGE_KEY = 'med_device_adverse_events_v1';

// 初始高真实感三甲医院不良事件与警戒直报数据集
export const INITIAL_ADVERSE_EVENTS: AdverseEventRecord[] = [
  {
    id: 'MDR-20260905-001',
    title: '重症医学科有创呼吸机呼气阀微动膜片卡阻致气道高压持续报警',
    status: 'nmpa_reported',
    severity: 'potential_serious_harm',
    occurredAt: '2026-09-05 03:20',
    discoveredAt: '2026-09-05 03:22',
    reportedAt: '2026-09-05 06:30',
    statutoryDeadline: '2026-09-12 23:59',
    isOverdueRisk: false,
    nmpaReportedAt: '2026-09-05 16:40',
    nmpaReceiptNo: 'NMPA-MDR-2026-370102-0042',
    department: '重症医学科(ICU)',
    reporterName: '张敏',
    reporterPhone: '13854128899',
    reporterProfession: 'nurse',
    isAdverseKeyDepartment: true,

    equipmentId: 'EQ-2023-010',
    equipmentAssetNo: 'ZC-2023-10159',
    equipmentName: '有创呼吸机 (ICU高阶型)',
    equipmentModel: 'Hamilton-G5',
    equipmentSn: 'HAM-G5-98214',
    udiCode: '(01)07612345678901(21)HAM-G5-98214(17)20291231',
    manufacturer: '瑞士哈密顿医疗公司 (Hamilton Medical AG)',
    manufacturerContact: '400-820-9118',
    registrationNo: '国械注进20173082215',
    deviceRiskClass: 'III',
    enableDate: '2023-04-12',
    serviceLifeYears: 3.4,
    deviceUsageState: 'in_use',
    consumablesName: '一次性呼气阀密封总成组件',
    consumablesBatchNo: 'LOT-20260218-A',

    patientNameMasked: '赵*刚',
    patientMedicalRecordNo: 'ZY-2026-88301',
    patientGender: '男',
    patientAge: 68,
    primaryDiagnosis: '急性呼吸窘迫综合征 (ARDS)、重症肺炎',
    deviceUsagePurpose: '机械通气支持治疗',
    harmDescription: '机械通气期间呼气末正压(PEEP)波动异常，气道峰压达到58cmH2O，触发高压声光报警。医护人员立即断开呼吸机转简易人工呼吸气囊过渡辅助通气，患者短暂SpO2降至88%，未发生气胸或肺气压伤。',
    clinicalOutcome: 'cured',
    remedialMedicalAction: '立即脱机使用纯氧简易呼吸气囊辅助通气，更换备用呼吸机，复查床旁超声未见气胸。',

    faultPhenomenon: '呼气模块内部硅胶膜片受潮受粘连阻力增加，导致呼气末释放延迟，系统压力阶跃升高。',
    immediateAction: '当班护士立即断开患者端气路，换用应急库调拨之备用呼吸机并保留故障膜片实物；医学工程科当日早晨8:00到场封存拆检。',
    deviceCurrentStatus: 'quarantined',
    samplePreserved: true,
    associatedWorkOrderId: 'WO-20260905-001',

    causalityCriterion1_timeSequence: true,
    causalityCriterion2_knownRisk: true,
    causalityCriterion3_dechallenge: true,
    causalityCriterion4_rechallenge: null,
    causalityCriterion5_alternativeCause: 'excluded',
    causalityConclusion: 'probable',
    evaluatorName: '崔伟 (临床高级工程师)',
    evaluatedAt: '2026-09-05 14:30',

    capaList: [
      {
        id: 'CAPA-001',
        type: 'maintenance_strengthening',
        title: '全院ICU及急诊科呼吸机呼气阀膜片预防性抽检与加热湿化防冷凝水排查',
        description: '对全院在用54台呼吸机呼吸回路呼气阀及积水杯进行气密性与冷凝水回流专项排查。',
        targetDepartment: '医学装备保障科 / 重症医学科',
        responsiblePerson: '李工',
        deadline: '2026-09-10',
        status: 'in_progress'
      },
      {
        id: 'CAPA-002',
        type: 'vendor_recall',
        title: '致函厂商驻场技术中心核查该批次硅胶膜片耐老化抗粘连物理参数',
        description: '要求瑞士哈密顿中国售后提供该批次组件出厂品控检验报告，并免费调换优化材质改进型呼气阀。',
        targetDepartment: '设备科耗材室 / 厂家技术中心',
        responsiblePerson: '崔工',
        deadline: '2026-09-15',
        status: 'in_progress'
      }
    ],

    timeline: [
      {
        id: 'LOG-1',
        timestamp: '2026-09-05 06:30',
        operator: '张敏 (护士长)',
        action: '临床不良事件初报直报',
        details: '在临床护理工作台提交呼气阀卡阻险失事件初步报告，等级初定为严重伤害潜在风险。'
      },
      {
        id: 'LOG-2',
        timestamp: '2026-09-05 08:30',
        operator: '崔工 (设备科)',
        action: '现场实物封存与技术调查',
        details: '医工到场查验 Hamilton-G5 呼吸机，导出系统事件黑匣子日志，确认压力突变点，实物封存贴签。'
      },
      {
        id: 'LOG-3',
        timestamp: '2026-09-05 14:30',
        operator: '院医疗质量安全与器械不良事件专家组',
        action: '完成因果关系综合评价',
        details: '五项准则评价判定为“很可能相关 (Probable)”，批准向国家医疗器械不良事件监测信息系统直报。'
      },
      {
        id: 'LOG-4',
        timestamp: '2026-09-05 16:40',
        operator: '质控主管 (不良事件管理员)',
        action: '直报国家监测网并获取回执',
        details: '通过国家不良事件数据交换接口上传成功，取得回执号 NMPA-MDR-2026-370102-0042。'
      }
    ]
  },
  {
    id: 'MDR-20260904-002',
    title: '手术室高频电刀使用过程中中性负极板接触边缘局部充血红肿灼伤隐患',
    status: 'investigating',
    severity: 'serious_injury',
    occurredAt: '2026-09-04 11:15',
    discoveredAt: '2026-09-04 11:50',
    reportedAt: '2026-09-04 13:20',
    statutoryDeadline: '2026-09-11 23:59',
    isOverdueRisk: false,
    department: '麻醉手术科',
    reporterName: '刘玉',
    reporterPhone: '13954117766',
    reporterProfession: 'nurse',
    isAdverseKeyDepartment: true,

    equipmentId: 'EQ-2022-005',
    equipmentAssetNo: 'ZC-2022-08812',
    equipmentName: '高频电刀主机 (双极带回路监测)',
    equipmentModel: 'ForceTriad',
    equipmentSn: 'FT-883011',
    udiCode: '(01)00884521012345(21)FT-883011',
    manufacturer: '美敦力柯惠 (Medtronic Covidien)',
    manufacturerContact: '800-820-2211',
    registrationNo: '国械注进20183011902',
    deviceRiskClass: 'III',
    enableDate: '2022-08-15',
    serviceLifeYears: 4.1,
    deviceUsageState: 'in_use',
    consumablesName: '一次性成人双片式回路中性极板',
    consumablesBatchNo: 'LOT-20260115-B',

    patientNameMasked: '孙*芳',
    patientMedicalRecordNo: 'ZY-2026-90211',
    patientGender: '女',
    patientAge: 54,
    primaryDiagnosis: '腹腔镜下胆囊切除术',
    deviceUsagePurpose: '术中止血与电切解剖',
    harmDescription: '术后揭除患者右大腿外侧一次性中性电极板时，发现极板近边缘处约1.5cm×2cm皮肤呈一至二度充血发红伴轻微表皮水疱，高频电刀回路质量监测系统(REM)在术中未见报错中断。',
    clinicalOutcome: 'improved',
    remedialMedicalAction: '烧伤整形外科急会诊，给予磺胺嘧啶银乳膏及无菌辅料外敷抗感染，密切随访局部愈合。',

    faultPhenomenon: '极板粘贴部位可能存在少许消毒液浸湿或极板边缘导电凝胶厚度不均，导致局部高频电流密度升高；电刀REM回路阻抗监控阈值偏宽。',
    immediateAction: '封存同批号剩余中性电极板共计80片，停用该台电刀主机并移送医工质检室进行高频漏电流与REM回路阻抗保护灵敏度校准。',
    deviceCurrentStatus: 'investigating',
    samplePreserved: true,
    associatedWorkOrderId: 'WO-20260904-003',

    causalityCriterion1_timeSequence: true,
    causalityCriterion2_knownRisk: true,
    causalityCriterion3_dechallenge: true,
    causalityCriterion4_rechallenge: null,
    causalityCriterion5_alternativeCause: 'partial',
    causalityConclusion: 'possible',
    evaluatorName: '孙志强 (高级医工工程师)',
    evaluatedAt: '2026-09-04 17:00',

    capaList: [
      {
        id: 'CAPA-101',
        type: 'clinical_training',
        title: '手术室护理人员电外科安全操作与极板规范粘贴再培训',
        description: '重点规范皮肤待干后再贴极板、避开骨隆起与瘢痕多毛区域、以及极板长轴垂直于高频电流流向规范。',
        targetDepartment: '手术室护理组 / 医务处',
        responsiblePerson: '刘玉',
        deadline: '2026-09-08',
        status: 'completed',
        completedDate: '2026-09-06'
      }
    ],

    timeline: [
      {
        id: 'LOG-201',
        timestamp: '2026-09-04 13:20',
        operator: '刘玉 (手术室护士长)',
        action: '填报不良事件初报单',
        details: '等级评定为严重伤害（皮肤局部轻度灼伤），提请医工联合调查。'
      },
      {
        id: 'LOG-202',
        timestamp: '2026-09-04 15:00',
        operator: '孙工 (医学工程科)',
        action: '现场仪器检测与高频漏电流测试',
        details: '连接高频电刀综合分析仪测试REM阻抗保护曲线，阻抗偏离值在正常临界上限，建议厂家专工到场复核。'
      }
    ]
  },
  {
    id: 'MDR-20260903-003',
    title: '心血管内科微量注射泵按键弹性接触不良致流速设定偶发跳跃跳档',
    status: 'pending_review',
    severity: 'potential_serious_harm',
    occurredAt: '2026-09-03 16:40',
    discoveredAt: '2026-09-03 16:42',
    reportedAt: '2026-09-03 18:00',
    statutoryDeadline: '2026-09-10 23:59',
    isOverdueRisk: false,
    department: '心血管内科',
    reporterName: '陈志远',
    reporterPhone: '13705312345',
    reporterProfession: 'physician',
    isAdverseKeyDepartment: false,

    equipmentId: 'EQ-2024-032',
    equipmentAssetNo: 'ZC-2024-11090',
    equipmentName: '双通道微量注射泵',
    equipmentModel: 'BeneFusion SP5',
    equipmentSn: 'BF-SP5-202403',
    udiCode: '(01)06923456789012(21)BF-SP5-202403',
    manufacturer: '深圳迈瑞生物医疗电子股份有限公司',
    manufacturerContact: '400-658-8999',
    registrationNo: '粤械注准20192140881',
    deviceRiskClass: 'III',
    enableDate: '2024-03-20',
    serviceLifeYears: 2.5,
    deviceUsageState: 'in_use',

    patientNameMasked: '钱*山',
    patientMedicalRecordNo: 'ZY-2026-77890',
    patientGender: '男',
    patientAge: 72,
    primaryDiagnosis: '急性心肌梗死、心源性休克',
    deviceUsagePurpose: '微量泵入去甲肾上腺素维持血压',
    harmDescription: '护士设定流速为 2.0 ml/h 时，数字键“2”出现双击连击跳至 22.0 ml/h，护士复核屏幕立即发现并按取消键纠正，未注入超剂量血管活性药物。险失事件 (Near-Miss)。',
    clinicalOutcome: 'no_harm',
    remedialMedicalAction: '立即取消输注参数，复位重新设定并双人查对，更换备用泵完成输注。',

    faultPhenomenon: '注射泵薄膜按键微动触点弹性退化，按压触发抖动引起数字连击。',
    immediateAction: '设备已下架贴红签，移交设备科维修室更换按键面板。',
    deviceCurrentStatus: 'quarantined',
    samplePreserved: true,

    causalityCriterion1_timeSequence: true,
    causalityCriterion2_knownRisk: true,
    causalityCriterion3_dechallenge: true,
    causalityCriterion4_rechallenge: true,
    causalityCriterion5_alternativeCause: 'excluded',
    causalityConclusion: 'unassessable',

    capaList: [],
    timeline: [
      {
        id: 'LOG-301',
        timestamp: '2026-09-03 18:00',
        operator: '陈志远 (主治医师)',
        action: '提交潜在严重不良事件直报',
        details: '高风险血管活性药物泵入跳档隐患，请设备科重点排查同批次按键触点。'
      }
    ]
  },
  {
    id: 'MDR-20260901-004',
    title: '血液透析室透析液电导率超限报警误报导致多次自检中断透析进程',
    status: 'closed',
    severity: 'other',
    occurredAt: '2026-09-01 09:15',
    discoveredAt: '2026-09-01 09:20',
    reportedAt: '2026-09-01 10:30',
    statutoryDeadline: '2026-09-21 23:59',
    isOverdueRisk: false,
    nmpaReportedAt: '2026-09-02 11:00',
    nmpaReceiptNo: 'NMPA-MDR-2026-370102-0038',
    department: '血液透析室',
    reporterName: '王晓燕',
    reporterPhone: '13605316688',
    reporterProfession: 'nurse',
    isAdverseKeyDepartment: true,

    equipmentId: 'EQ-2021-019',
    equipmentAssetNo: 'ZC-2021-07712',
    equipmentName: '血液透析滤过机',
    equipmentModel: '5008S CorDiax',
    equipmentSn: 'FM-5008-66129',
    udiCode: '(01)04023456789012(21)FM-5008-66129',
    manufacturer: '德国费森尤斯医疗 (Fresenius Medical Care)',
    manufacturerContact: '800-810-1888',
    registrationNo: '国械注进20163452011',
    deviceRiskClass: 'III',
    enableDate: '2021-06-10',
    serviceLifeYears: 5.2,
    deviceUsageState: 'in_use',

    patientNameMasked: '李*生',
    patientMedicalRecordNo: 'ZY-2026-65432',
    patientGender: '男',
    patientAge: 61,
    primaryDiagnosis: '慢性肾衰竭尿毒症期、规律血液透析治疗',
    deviceUsagePurpose: '维持性血液透析滤过',
    harmDescription: '上机30分钟后机器发出透析液电导率低限报警，旁路阀自动切断透析液供应，反复自检耗时20分钟，患者血液回路体外循环时间稍延长，无溶血、过敏或发热，无不良后遗症。',
    clinicalOutcome: 'no_harm',
    remedialMedicalAction: '立即取样使用便携式生化电导率仪手工复核浓缩液浓度正常，更换备用透析机继续透析。',

    faultPhenomenon: '电导率监测电极表面吸附微量碳酸盐结晶水垢，灵敏度漂移致假报警。',
    immediateAction: '设备科实施柠檬酸热消毒与超声波电极除垢清洗，重新定标校准恢复正常。',
    deviceCurrentStatus: 'returned_to_service',
    samplePreserved: false,

    causalityCriterion1_timeSequence: true,
    causalityCriterion2_knownRisk: true,
    causalityCriterion3_dechallenge: true,
    causalityCriterion4_rechallenge: false,
    causalityCriterion5_alternativeCause: 'excluded',
    causalityConclusion: 'probable',
    evaluatorName: '李工',
    evaluatedAt: '2026-09-01 16:00',

    capaList: [
      {
        id: 'CAPA-401',
        type: 'maintenance_strengthening',
        title: '透析机电导率传感器周期性化学脱钙保养频次由月度调整为半月度',
        description: '针对全透析室32台费森尤斯透析机执行专项脱钙排查与标定，杜绝水垢结晶假阳性报警。',
        targetDepartment: '血液透析室工程维护组',
        responsiblePerson: '李工',
        deadline: '2026-09-05',
        status: 'completed',
        completedDate: '2026-09-04'
      }
    ],

    timeline: [
      {
        id: 'LOG-401',
        timestamp: '2026-09-01 10:30',
        operator: '王晓燕 (护士长)',
        action: '提交初报',
        details: '上报透析液电导率假报警延误透析事件。'
      },
      {
        id: 'LOG-402',
        timestamp: '2026-09-02 11:00',
        operator: '不良事件管理员',
        action: '完成直报并归档',
        details: '已完成国家直报并完成设备化学脱钙清洗。'
      }
    ]
  },
  {
    id: 'MDR-20260828-005',
    title: '急诊抢救室便携除颤监护仪高容量锂电池自放电故障致除颤充电延时',
    status: 'capa_tracking',
    severity: 'potential_serious_harm',
    occurredAt: '2026-08-28 14:10',
    discoveredAt: '2026-08-28 14:11',
    reportedAt: '2026-08-28 15:30',
    statutoryDeadline: '2026-09-04 23:59',
    isOverdueRisk: false,
    nmpaReportedAt: '2026-08-29 10:15',
    nmpaReceiptNo: 'NMPA-MDR-2026-370102-0029',
    department: '急诊医学科',
    reporterName: '高伟',
    reporterPhone: '13805319900',
    reporterProfession: 'physician',
    isAdverseKeyDepartment: true,

    equipmentId: 'EQ-2023-008',
    equipmentAssetNo: 'ZC-2023-09941',
    equipmentName: '双相波除颤监护仪',
    equipmentModel: 'BeneHeart D6',
    equipmentSn: 'MD-D6-11892',
    udiCode: '(01)06923456789099(21)MD-D6-11892',
    manufacturer: '深圳迈瑞生物医疗电子股份有限公司',
    manufacturerContact: '400-658-8999',
    registrationNo: '粤械注准20183210411',
    deviceRiskClass: 'III',
    enableDate: '2023-02-18',
    serviceLifeYears: 3.6,
    deviceUsageState: 'standby',

    patientNameMasked: '未涉及具体患者 (交接班自检发现)',
    patientMedicalRecordNo: 'EMERGENCY-CHECK-0828',
    patientGender: '其他',
    patientAge: 0,
    primaryDiagnosis: '晨间急救设备功能性交接班巡检自检',
    deviceUsagePurpose: '急救室生命支持储备',
    harmDescription: '护士晨班自检除颤200J放电测试时，仅依靠电池供电下充电时长超过15秒且电量指示灯突闪红灯；交接班发现若抢救室断电应急除颤极易造成心肺复苏除颤抢救延迟。险失隐患。',
    clinicalOutcome: 'no_harm',
    remedialMedicalAction: '立即接入交流AC电源测试充电时间2.5秒正常，将该机更换为应急备机，原机电池送修。',

    faultPhenomenon: '智能锂电池内部电芯组内阻增大老化，BMS电池保护板自锁报警。',
    immediateAction: '设备科仓库紧急调配原厂新电池两块换装，并安排全院急救除颤仪电池健康度容量测试。',
    deviceCurrentStatus: 'returned_to_service',
    samplePreserved: true,

    causalityCriterion1_timeSequence: true,
    causalityCriterion2_knownRisk: true,
    causalityCriterion3_dechallenge: true,
    causalityCriterion4_rechallenge: null,
    causalityCriterion5_alternativeCause: 'excluded',
    causalityConclusion: 'definite',
    evaluatorName: '崔伟',
    evaluatedAt: '2026-08-28 17:00',

    capaList: [
      {
        id: 'CAPA-501',
        type: 'maintenance_strengthening',
        title: '全院26台除颤监护仪电池充放电容量深循环保养与老化度淘汰排查',
        description: '对服役超过3年的除颤监护仪蓄电池进行容量衰减测试，容量低于80%的一律强制报废更换。',
        targetDepartment: '医学装备保障科急救设备小组',
        responsiblePerson: '李工',
        deadline: '2026-09-15',
        status: 'in_progress'
      },
      {
        id: 'CAPA-502',
        type: 'sop_revision',
        title: '更新临床科室护士交接班除颤仪自检SOP，强制执行脱开交流电脱机自检测试',
        description: '确保每次自检真实考验电池供电能力，杜绝插着交流电自检掩盖电池衰减缺陷。',
        targetDepartment: '护理部 / 急救重症学组',
        responsiblePerson: '高伟',
        deadline: '2026-09-10',
        status: 'completed',
        completedDate: '2026-09-02'
      }
    ],

    timeline: [
      {
        id: 'LOG-501',
        timestamp: '2026-08-28 15:30',
        operator: '高伟 (急诊科主治医师)',
        action: '提交自检发现的除颤电池隐患报告',
        details: '险失事件上报，提请医工处迅速换件。'
      },
      {
        id: 'LOG-502',
        timestamp: '2026-08-29 10:15',
        operator: '不良事件管理员',
        action: '上报国家不良事件直报系统',
        details: '取得直报回执 NMPA-MDR-2026-370102-0029，开启全院除颤电池CAPA追踪。'
      }
    ]
  }
];

// 本地读取与存储
export function loadStoredAdverseEvents(): AdverseEventRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw || raw === 'undefined' || raw === 'null') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_ADVERSE_EVENTS));
      return INITIAL_ADVERSE_EVENTS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return INITIAL_ADVERSE_EVENTS;
  } catch (err) {
    console.error('Failed to load adverse events from localStorage:', err);
    return INITIAL_ADVERSE_EVENTS;
  }
}

export function saveStoredAdverseEvents(events: AdverseEventRecord[]): void {
  try {
    const safeList = Array.isArray(events) ? events : [];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(safeList));
  } catch (err) {
    console.error('Failed to save adverse events to localStorage:', err);
  }
}

// 统计指标计算
export function calculateAdverseEventMetrics(events: AdverseEventRecord[] = []): AdverseEventMetrics {
  const safeEvents = Array.isArray(events) ? events : [];
  const total = safeEvents.length;
  const deathCount = safeEvents.filter(e => e.severity === 'death').length;
  const seriousInjuryCount = safeEvents.filter(e => e.severity === 'serious_injury').length;
  const potentialHarmCount = safeEvents.filter(e => e.severity === 'potential_serious_harm').length;
  const otherCount = safeEvents.filter(e => e.severity === 'other').length;
  
  const pendingReviewCount = safeEvents.filter(e => e.status === 'pending_review' || e.status === 'draft').length;
  const investigatingCount = safeEvents.filter(e => e.status === 'investigating').length;
  const nmpaReportedCount = safeEvents.filter(e => e.status === 'nmpa_reported' || e.status === 'capa_tracking' || e.status === 'closed').length;
  
  const highRiskUrgentPending = safeEvents.filter(e => 
    (e.severity === 'death' || e.severity === 'serious_injury') && 
    (e.status === 'pending_review' || e.status === 'investigating')
  ).length;

  // 重点科室直报覆盖度（重症、手术室、透析、急诊等重点科室是否有报告）
  const keyDeptsWithReports = new Set(safeEvents.filter(e => e.isAdverseKeyDepartment).map(e => e.department)).size;
  const keyDeptComplianceRate = Math.min(100, Math.round((keyDeptsWithReports / 4) * 100));

  return {
    totalReports: total,
    severeCount: deathCount + seriousInjuryCount,
    deathCount,
    seriousInjuryCount,
    potentialHarmCount,
    otherCount,
    pendingReviewCount,
    investigatingCount,
    nmpaReportedCount,
    nmpaReportingRate: total > 0 ? Math.round((nmpaReportedCount / total) * 100) : 0,
    highRiskUrgentPending,
    keyDeptComplianceRate
  };
}

// 辅助函数：严重程度标签配置
export function getSeverityConfig(severity: AdverseEventSeverity) {
  switch (severity) {
    case 'death':
      return {
        label: '死亡事件',
        badgeBg: 'bg-rose-700 text-white',
        border: 'border-rose-700',
        textColor: 'text-rose-700',
        levelText: '极高危 (24小时内紧急直报)'
      };
    case 'serious_injury':
      return {
        label: '严重伤害',
        badgeBg: 'bg-rose-100 text-rose-800 border border-rose-300',
        border: 'border-rose-400',
        textColor: 'text-rose-600',
        levelText: '高危 (7日内法定直报)'
      };
    case 'potential_serious_harm':
      return {
        label: '可能导致严重伤害 (Near-miss)',
        badgeBg: 'bg-amber-100 text-amber-800 border border-amber-300',
        border: 'border-amber-400',
        textColor: 'text-amber-600',
        levelText: '中高危 (7日内警戒直报)'
      };
    case 'other':
    default:
      return {
        label: '其他不良事件',
        badgeBg: 'bg-slate-100 text-slate-700 border border-slate-300',
        border: 'border-slate-300',
        textColor: 'text-slate-600',
        levelText: '常规监测 (20日内直报)'
      };
  }
}

// 状态标签配置
export function getStatusConfig(status: AdverseEventStatus) {
  switch (status) {
    case 'draft':
      return { label: '草稿未提交', color: 'bg-slate-100 text-slate-600 border-slate-200' };
    case 'pending_review':
      return { label: '待医工审核', color: 'bg-blue-50 text-blue-700 border-blue-200' };
    case 'investigating':
      return { label: '调查排查中', color: 'bg-purple-50 text-purple-700 border-purple-200' };
    case 'evaluated':
      return { label: '已完成评价', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' };
    case 'nmpa_reported':
      return { label: '已直报国家网', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    case 'capa_tracking':
      return { label: 'CAPA预防追踪', color: 'bg-teal-50 text-teal-700 border-teal-200' };
    case 'closed':
      return { label: '已结案归档', color: 'bg-slate-100 text-slate-500 border-slate-200' };
  }
}

// 因果关系结论翻译与样式
export function getCausalityConfig(conclusion: CausalityConclusion) {
  switch (conclusion) {
    case 'definite':
      return { label: '肯定相关 (Definite)', badge: 'bg-rose-50 text-rose-700 border-rose-200 font-bold' };
    case 'probable':
      return { label: '很可能相关 (Probable)', badge: 'bg-orange-50 text-orange-700 border-orange-200 font-bold' };
    case 'possible':
      return { label: '可能相关 (Possible)', badge: 'bg-amber-50 text-amber-700 border-amber-200' };
    case 'unlikely':
      return { label: '可能无关 (Unlikely)', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    case 'unassessable':
      return { label: '待评价 (Pending)', badge: 'bg-blue-50 text-blue-700 border-blue-200' };
    case 'unclassifiable':
    default:
      return { label: '无法评价 (Unclassifiable)', badge: 'bg-slate-100 text-slate-600 border-slate-200' };
  }
}

// 模拟生成国家医疗器械不良事件监测信息系统 (NMPA) 直报 XML 数据包
export function generateNmpaXmlReport(event: AdverseEventRecord): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<MedicalDeviceAdverseEventReport xmlns="http://www.nmpa.gov.cn/mdr/2026" version="2.0">
  <ReportHeader>
    <HospitalOrgCode>370102001-P</HospitalOrgCode>
    <HospitalName>五莲县人民医院</HospitalName>
    <LocalReportId>${event.id}</LocalReportId>
    <NmpaReceiptNo>${event.nmpaReceiptNo || 'PENDING_TRANSMISSION'}</NmpaReceiptNo>
    <ReportDate>${event.reportedAt}</ReportDate>
    <ReportingDepartment>${event.department}</ReportingDepartment>
    <ReporterName>${event.reporterName}</ReporterName>
    <ReporterPhone>${event.reporterPhone}</ReporterPhone>
    <ReporterRole>${event.reporterProfession}</ReporterRole>
    <StatutorySeverity>${event.severity}</StatutorySeverity>
  </ReportHeader>
  <DeviceInformation>
    <DeviceName><![CDATA[${event.equipmentName}]]></DeviceName>
    <DeviceModel><![CDATA[${event.equipmentModel}]]></DeviceModel>
    <SerialNo><![CDATA[${event.equipmentSn}]]></SerialNo>
    <AssetNo>${event.equipmentAssetNo || 'N/A'}</AssetNo>
    <UDI>${event.udiCode || 'N/A'}</UDI>
    <Manufacturer><![CDATA[${event.manufacturer}]]></Manufacturer>
    <RegistrationCertificateNo>${event.registrationNo}</RegistrationCertificateNo>
    <DeviceClass>${event.deviceRiskClass}</DeviceClass>
    <UsageStateAtEvent>${event.deviceUsageState}</UsageStateAtEvent>
    <ConsumableBatchNo>${event.consumablesBatchNo || 'NONE'}</ConsumableBatchNo>
  </DeviceInformation>
  <PatientAndClinicalCourse>
    <PatientID>${event.patientMedicalRecordNo}</PatientID>
    <PatientNameMasked>${event.patientNameMasked}</PatientNameMasked>
    <Gender>${event.patientGender}</Gender>
    <Age>${event.patientAge}</Age>
    <PrimaryDiagnosis><![CDATA[${event.primaryDiagnosis}]]></PrimaryDiagnosis>
    <HarmDescription><![CDATA[${event.harmDescription}]]></HarmDescription>
    <ClinicalOutcome>${event.clinicalOutcome}</ClinicalOutcome>
    <RemedialAction><![CDATA[${event.remedialMedicalAction || '未执行特殊救治'}]]></RemedialAction>
  </PatientAndClinicalCourse>
  <InvestigationAndCausality>
    <FaultPhenomenon><![CDATA[${event.faultPhenomenon}]]></FaultPhenomenon>
    <ImmediateOnsiteAction><![CDATA[${event.immediateAction}]]></ImmediateOnsiteAction>
    <DeviceCurrentStatus>${event.deviceCurrentStatus}</DeviceCurrentStatus>
    <CausalityCriteria>
      <Criterion1_TimeSequence>${event.causalityCriterion1_timeSequence}</Criterion1_TimeSequence>
      <Criterion2_KnownRisk>${event.causalityCriterion2_knownRisk}</Criterion2_KnownRisk>
      <Criterion3_Dechallenge>${event.causalityCriterion3_dechallenge ?? 'NA'}</Criterion3_Dechallenge>
      <Criterion4_Rechallenge>${event.causalityCriterion4_rechallenge ?? 'NA'}</Criterion4_Rechallenge>
      <Criterion5_AlternativeCause>${event.causalityCriterion5_alternativeCause}</Criterion5_AlternativeCause>
    </CausalityCriteria>
    <FinalCausalityConclusion>${event.causalityConclusion}</FinalCausalityConclusion>
    <EvaluatorSignature>${event.evaluatorName || '医工科'}</EvaluatorSignature>
    <EvaluatedTime>${event.evaluatedAt || event.reportedAt}</EvaluatedTime>
  </InvestigationAndCausality>
  <CorrectiveAndPreventiveActions count="${(event.capaList || []).length}">
    ${(event.capaList || []).map(c => `<CAPAItem id="${c.id}" type="${c.type}" status="${c.status}"><Title><![CDATA[${c.title}]]></Title></CAPAItem>`).join('\n    ')}
  </CorrectiveAndPreventiveActions>
</MedicalDeviceAdverseEventReport>`;
}

// 模拟直报国家医疗器械不良事件监测信息系统
export function reportEventToNmpa(
  event: AdverseEventRecord, 
  operatorName: string
): { updatedEvent: AdverseEventRecord; receiptNo: string } {
  const timestamp = new Date().toISOString().slice(0, 16).replace('T', ' ');
  const randomSerial = Math.floor(1000 + Math.random() * 9000);
  const receiptNo = `NMPA-MDR-${new Date().getFullYear()}-370102-${randomSerial}`;

  const updatedEvent: AdverseEventRecord = {
    ...event,
    status: 'nmpa_reported',
    nmpaReportedAt: timestamp,
    nmpaReceiptNo: receiptNo,
    timeline: [
      ...event.timeline,
      {
        id: `LOG-${Date.now()}`,
        timestamp,
        operator: operatorName || '质控主管',
        action: '完成国家医疗器械不良事件监测系统直报',
        details: `系统自动组包国家标准XML数据报文，直报接口传输成功，取得国家回执号：${receiptNo}`
      }
    ]
  };

  return { updatedEvent, receiptNo };
}

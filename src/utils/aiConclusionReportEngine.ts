import { MedicalEquipment, RepairRecord } from '../types';
import { 
  AiStructuredDiagnosticResult, 
  generateLocalRuleBasedDiagnosis,
  computeEquipmentLifecycleProfile,
  AiDiagnosticRootCause,
  AiRecommendedPart
} from './aiBiomedicalEngine';

export interface EnvironmentalProfile {
  department: string;
  building: string;
  floor: string;
  usageLocation: string;
  locationFull: string;
  cleanlinessLevel: string;
  tempHumidityRange: string;
  powerGridSpec: string;
  dutyCycle: string;
  disinfectionImpact: string;
  environmentalRiskNotes: string;
}

export interface RiskDimensionAssessment {
  dimension: string;
  riskLevel: '极高风险' | '高风险' | '中等风险' | '低风险';
  score: number; // 0 - 100
  mechanism: string;
  controlMeasure: string;
}

export interface HistoricalRepairInsight {
  totalRepairs: number;
  totalCost: number;
  costRatioPercent: number;
  frequentComponents: string[];
  hasRecurringFailure: boolean;
  recurringFailureSummary: string;
  mtbfEstimatedDays: number;
  recentRepairs: {
    date: string;
    fault: string;
    parts: string;
    cost: number;
    technician: string;
    status: string;
  }[];
}

export interface StructuredConclusionReport {
  reportDocNo: string;
  generatedDate: string;
  generatedTimestamp: string;
  institutionTitle: string;
  departmentHeader: string;
  
  // 1. 设备基本主数据
  equipmentSummary: {
    id: string;
    name: string;
    model: string;
    assetNo: string;
    sn: string;
    codeId: string;
    internalNo: string;
    manufacturer: string;
    category: string;
    purchasePrice: number;
    enableDate: string;
    serviceYears: number;
    currentStatus: string;
    warrantyStatus: string;
    lifecyclePhase: string;
    bathtubRisk: string;
  };

  // 2. 当前故障研判态势
  currentFault: {
    rawDescription: string;
    standardizedDescription: string;
    alarmCodes: string[];
    affectedModule: string;
    urgencyLevel: string;
    clinicalImpact: string;
    bathtubStateMechanism: string;
  };

  // 3. 运行环境数据与基础设施工况
  environment: EnvironmentalProfile;

  // 4. 历史维修履历与复发隐患溯源
  repairInsight: HistoricalRepairInsight;

  // 5. 多维工程与临床风险评估
  overallRiskLevel: '极高风险 (Grade IV)' | '高风险 (Grade III)' | '中等风险 (Grade II)' | '低度可控 (Grade I)';
  overallRpnScore: number; // 0 - 100
  riskSummary: string;
  riskDimensions: RiskDimensionAssessment[];

  // 6. 结构化维修建议与备件方案
  immediateClinicalActions: string[];
  engineerRootCauses: AiDiagnosticRootCause[];
  engineerActionSteps: string[];
  recommendedParts: AiRecommendedPart[];
  estimatedTotalRepairCost: number;
  suggestedResolutionSummary: string;

  // 7. 修复后质控验收与 PM 规程
  postRepairQcCriteria: {
    standard: string;
    items: { name: string; target: string; method: string }[];
  };
  preventiveMaintenanceAdvice: string;

  // 8. 签发与技术确认
  signoff: {
    leadEngineer: string;
    technicalReviewer: string;
    clinicalReceiver: string;
    validityDays: number;
    sealText: string;
  };
}

/**
 * 依据设备分类、所在科室以及设备信息推导实际运行环境工况数据
 */
export function deriveEquipmentEnvironmentProfile(equipment: MedicalEquipment): EnvironmentalProfile {
  const dept = equipment.department || '未指定科室';
  const building = equipment.building || '综合医疗大楼';
  const floor = equipment.floor || '3F';
  const usageLocation = equipment.usageLocation || equipment.location || `${dept} 诊疗室/处置室`;

  const nameUpper = (equipment.name + ' ' + (equipment.category || '')).toUpperCase();
  const deptUpper = dept.toUpperCase();

  let cleanlinessLevel = '医院普通诊疗区域 (洁净度 Class 300,000)';
  let tempHumidityRange = '温度: 18℃~26℃, 相对湿度: 40%~65% RH';
  let powerGridSpec = '标准医疗配电回路 (TN-S 系统), 接地电阻 ≤ 1.0Ω, 具备常规双回路供电';
  let dutyCycle = '日间平诊工作制 (8:00 - 18:00), 日均负荷率约 65%, 月均有效开机工时 ~220h';
  let disinfectionImpact = '常规紫外线循环风消毒 + 医用含氯消毒湿巾每日表面擦拭, 需注意机壳接缝密封阻水';
  let environmentalRiskNotes = '环境整体受控, 但人员出入较频繁, 需防范地面微尘与空调出风口冷凝水滴落隐患';

  // 1. 重症监护 / 急救中心 (ICU, CCU, EICU, NICU, 急诊抢救室)
  if (/ICU|CCU|重症|急救|抢救|急诊/i.test(deptUpper) || /呼吸机|监护仪|除颤|ECMO|透析|血滤/i.test(nameUpper)) {
    cleanlinessLevel = '重症监护洁净病房 (Class 100,000 级洁净度, 乱流/正压通风)';
    tempHumidityRange = '医用恒温恒湿控制: 温度 22℃±2℃, 相对湿度 45%~60% RH';
    powerGridSpec = '2类医疗场所 IT 医用隔离电源系统 + 独立 UPS 20kVA 双变换不间断电源, 接地电阻 ≤ 0.2Ω (GB 16895.24)';
    dutyCycle = '生命支持级 24×7 连续满载不间断运转, 月均连续开机工时 ~720h, 瞬态负荷高';
    disinfectionImpact = '每日高频次接触隔离消毒, 每周过氧化氢气雾空间熏蒸, 对外露接口涂层及排风扇轴承有一定微腐蚀加速风险';
    environmentalRiskNotes = '设备不间断运转且处于病人床旁, 存在高频搬动、管路牵拉及多台监护仪器共用地线的高频电磁干扰风险';
  } 
  // 2. 手术室 / 介入导管室 / 麻醉科
  else if (/手术|介入|导管室|麻醉|DSA/i.test(deptUpper) || /麻醉机|高频电刀|内窥镜|腔镜|无影灯/i.test(nameUpper)) {
    cleanlinessLevel = '层流手术净化室 (千级/百级 ISO 5 洁净度, 垂直层流正压)';
    tempHumidityRange = '精密控制: 温度 21℃~25℃, 相对湿度 40%~60% RH (防静电积聚)';
    powerGridSpec = '2类医疗场所医用隔离变压器 (IT 系统) + 绝缘监视报警器 + 应急发电机 10s 自投切';
    dutyCycle = '择期与急诊手术联动模式, 单日高频术中运转 (10~16h/日), 高负荷峰值功率冲击';
    disinfectionImpact = '术后严格层流自净 + 空间气雾熏蒸 + 季铵盐消毒液整机擦拭, 密封圈耐化性要求极高';
    environmentalRiskNotes = '手术电刀高频放电与多台生命监测设备集聚, 空间射频电磁辐射密度大, 须严格保证等电位接地保护';
  }
  // 3. 放射影像科 / 核医学科 (CT, MRI, DR, 胃肠机, 钼靶)
  else if (/放射|影像|CT|MRI|磁共振|核医学|超声/i.test(deptUpper) || /CT|磁共振|MRI|DR|X射线|血管机/i.test(nameUpper)) {
    cleanlinessLevel = '医用大型影像屏蔽机房 (专用机房温控, 防辐射铅板/铜网电磁屏蔽网)';
    tempHumidityRange = '影像精密机房空调: 温度 20℃~22℃, 相对湿度 40%~55% RH (严禁冷凝水)';
    powerGridSpec = '独立大容量专线变压器 (380V 三相五线制), 配备专用进线稳压器与电能滤波器, 独立接地桩接地阻抗 ≤ 0.5Ω';
    dutyCycle = '高负荷流水线式患者扫描, 曝光球管/梯度线圈高热负载, 每天检查 60~120 人次';
    disinfectionImpact = '检查床床面单人单换垫单 + 紫外线空气定时消毒, 机架需避免水溶性试剂渗入高压滑环或探测器';
    environmentalRiskNotes = '对电网电压波动（瞬态畸变）极其敏感, 冷水机组与管路水压需稳定, 机房温湿度波动可能导致探测器校准漂移';
  }
  // 4. 检验科 / 病理科 / 输血科 (生化分析仪, 免疫, 血细胞分析)
  else if (/检验|生化|病理|输血|检验科/i.test(deptUpper) || /生化|免疫|离心机|血球|显微镜/i.test(nameUpper)) {
    cleanlinessLevel = '生物安全二级实验室 (BSL-2, 负压/定向气流, 局部生物安全柜)';
    tempHumidityRange = '恒温环境: 温度 20℃~24℃, 相对湿度 35%~65% RH';
    powerGridSpec = '净化专用稳压供电回路, 关键分析仪器配备专用在线式 UPS 应急供电';
    dutyCycle = '清晨标本集中批处理高峰, 日均样本分析量大, 试剂管路微流体高压泵持续运行';
    disinfectionImpact = '强酸强碱清洗液管路循环 + 台面次氯酸钠消毒, 需高度防范废液腐蚀管路接头与光电比色皿污染';
    environmentalRiskNotes = '依赖高纯度超纯水供给系统, 水质电阻率若下降或环境粉尘将严重干扰光学检测精度';
  }

  const locationFull = `${building} ${floor} (${usageLocation})`;

  return {
    department: dept,
    building,
    floor,
    usageLocation,
    locationFull,
    cleanlinessLevel,
    tempHumidityRange,
    powerGridSpec,
    dutyCycle,
    disinfectionImpact,
    environmentalRiskNotes
  };
}

/**
 * 深入解析设备过往维修记录
 */
export function analyzeHistoricalRepairRecords(
  equipment: MedicalEquipment,
  currentFault: string
): HistoricalRepairInsight {
  const records = equipment.repairRecords || [];
  const totalRepairs = records.length || equipment.repairCount || 0;
  const totalCost = records.reduce((acc, r) => acc + (Number(r.cost) || 0), 0);
  const purchasePrice = equipment.purchasePrice || 0;
  const costRatioPercent = purchasePrice > 0 ? Number(((totalCost / purchasePrice) * 100).toFixed(1)) : 0;

  // 零部件统计
  const allParts = records
    .map(r => r.partsReplaced)
    .filter(Boolean)
    .flatMap(p => (p ? p.split(/[，,、+]/).map(s => s.trim()) : []))
    .filter(p => p && p !== '无' && p !== '无（临床自查排除假故障）');
  
  const uniqueParts = Array.from(new Set(allParts));

  // 复发性隐患检测
  const faultKeywords = (currentFault || '').toLowerCase();
  let hasRecurringFailure = false;
  let recurringFailureSummary = '经大数据交叉检索，该设备过往未记录与当前故障相同的部件级复发缺陷，属独立偶发性故障。';

  const matchedPast = records.filter(r => {
    const pastText = ((r.faultDescription || '') + ' ' + (r.resolution || '') + ' ' + (r.partsReplaced || '')).toLowerCase();
    if (/0x107f|总线|通信|握手|timeout/i.test(faultKeywords) && /0x107f|总线|通信|握手/i.test(pastText)) return true;
    if (/电源|开机|黑屏|掉电|供电|电压|保险丝/i.test(faultKeywords) && /电源|开机|黑屏|供电|保险/i.test(pastText)) return true;
    if (/血氧|spo2|探头|指夹/i.test(faultKeywords) && /血氧|spo2|探头/i.test(pastText)) return true;
    if (/心电|ecg|导联|波形|杂波/i.test(faultKeywords) && /心电|ecg|导联/i.test(pastText)) return true;
    if (/血压|nibp|漏气|充气|袖带/i.test(faultKeywords) && /血压|nibp|气泵|阀|漏气/i.test(pastText)) return true;
    if (/呼吸|气道|通气|流量|压力传感器/i.test(faultKeywords) && /呼吸|阀|流量|压力/i.test(pastText)) return true;
    if (/超声|探头|伪影|声束|晶片/i.test(faultKeywords) && /探头|晶片|伪影|接口/i.test(pastText)) return true;
    return false;
  });

  if (matchedPast.length > 0) {
    hasRecurringFailure = true;
    recurringFailureSummary = `【高危复发预警】设备历史曾有 ${matchedPast.length} 次同模块/同故障特征的报修记录（涉及历史时间：${matchedPast.map(m => m.faultDate).join('、')}）。曾采取措施包括“${matchedPast.map(m => m.resolution).filter(Boolean).slice(0, 2).join('；')}”，提示故障并非单一元器件偶发损坏，而是存在板级隐性接触不良、母线电源纹波偏大或器件老化链条未彻底根除的复发性隐患。`;
  }

  // MTBF 估算
  let mtbfEstimatedDays = 260; // 默认
  if (totalRepairs > 1 && records.length >= 2) {
    const dates = records
      .map(r => new Date(r.faultDate).getTime())
      .filter(t => !isNaN(t))
      .sort((a, b) => a - b);
    if (dates.length >= 2) {
      const spanDays = Math.max(30, Math.round((dates[dates.length - 1] - dates[0]) / (1000 * 3600 * 24)));
      mtbfEstimatedDays = Math.max(25, Math.round(spanDays / (dates.length - 1)));
    }
  } else if (totalRepairs === 1) {
    mtbfEstimatedDays = 180;
  } else {
    mtbfEstimatedDays = 365;
  }

  const recentRepairs = records.slice(0, 5).map(r => ({
    date: r.faultDate || '未知日期',
    fault: r.faultDescription || '日常故障检修',
    parts: r.partsReplaced || '无更换耗材配件',
    cost: Number(r.cost) || 0,
    technician: r.technician || '临床工程技术人员',
    status: r.status || '已完成'
  }));

  return {
    totalRepairs,
    totalCost,
    costRatioPercent,
    frequentComponents: uniqueParts.slice(0, 5),
    hasRecurringFailure,
    recurringFailureSummary,
    mtbfEstimatedDays,
    recentRepairs
  };
}

/**
 * 构建完整的 AI 结构化研判结论书数据模型
 */
export function generateDiagnosticConclusionReport(
  equipment: MedicalEquipment,
  currentFaultDesc: string,
  providedDiagnosticData?: AiStructuredDiagnosticResult | null
): StructuredConclusionReport {
  // 若未传入诊断数据，则调用本地工程规则引擎生成完整诊断
  const diagnosticData = providedDiagnosticData || generateLocalRuleBasedDiagnosis(
    equipment.name,
    equipment.model,
    equipment.department,
    currentFaultDesc,
    equipment
  );

  const envProfile = deriveEquipmentEnvironmentProfile(equipment);
  const repairInsight = analyzeHistoricalRepairRecords(equipment, currentFaultDesc);
  const lifecycle = diagnosticData.lifecycleSynthesis || computeEquipmentLifecycleProfile(equipment, currentFaultDesc);

  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10);
  const timeStr = today.toLocaleTimeString('zh-CN', { hour12: false });
  const reportDocNo = `MED-AI-JUDGE-${(equipment.id || 'EQ').toUpperCase().replace(/[^A-Z0-9]/g, '')}-${dateStr.replace(/-/g, '')}`;

  // 提取报警代码
  const alarmCodes: string[] = [];
  const codeMatches = currentFaultDesc.match(/0x[0-9a-fA-F]+|[E|e]rr(?:or)?[-_]?[0-9a-zA-Z]+/g);
  if (codeMatches) {
    alarmCodes.push(...Array.from(new Set(codeMatches)));
  }
  if (diagnosticData.symptomSummary.alarmCodes) {
    alarmCodes.push(...diagnosticData.symptomSummary.alarmCodes);
  }
  const cleanAlarmCodes = Array.from(new Set(alarmCodes));

  // 多维风险评分推演
  const isEmergency = /特急|高/i.test(diagnosticData.symptomSummary.urgencyLevel) || /呼吸机|监护仪|除颤|麻醉/i.test(equipment.name);
  const isOveraged = lifecycle.serviceYears > 8.0 || (equipment.productValidity && lifecycle.serviceYears > Number(equipment.productValidity));
  const hasPastRepairs = repairInsight.totalRepairs >= 3 || repairInsight.hasRecurringFailure;

  // 1. 临床安全风险
  const clinicalRiskScore = isEmergency ? (isOveraged ? 92 : 85) : 48;
  const clinicalRiskLevel: RiskDimensionAssessment['riskLevel'] = clinicalRiskScore >= 80 ? '极高风险' : (clinicalRiskScore >= 60 ? '高风险' : '中等风险');
  
  // 2. 硬件次生损毁风险
  const hardwareRiskScore = /0x107f|电源|短路|冒烟|过温|高压/i.test(currentFaultDesc) ? 88 : (isOveraged ? 76 : 52);
  const hardwareRiskLevel: RiskDimensionAssessment['riskLevel'] = hardwareRiskScore >= 80 ? '极高风险' : (hardwareRiskScore >= 60 ? '高风险' : '中等风险');

  // 3. 经济性与合规风险
  const economicRiskScore = repairInsight.costRatioPercent > 40 || isOveraged ? 82 : (repairInsight.costRatioPercent > 20 ? 64 : 35);
  const economicRiskLevel: RiskDimensionAssessment['riskLevel'] = economicRiskScore >= 80 ? '高风险' : (economicRiskScore >= 55 ? '中等风险' : '低风险');

  // 4. 运行环境与工况风险
  const envRiskScore = /ICU|手术室|急诊/i.test(envProfile.department) && isOveraged ? 78 : 45;
  const envRiskLevel: RiskDimensionAssessment['riskLevel'] = envRiskScore >= 70 ? '高风险' : (envRiskScore >= 40 ? '中等风险' : '低风险');

  const overallRpnScore = Math.round((clinicalRiskScore * 0.4 + hardwareRiskScore * 0.3 + economicRiskScore * 0.2 + envRiskScore * 0.1));
  const overallRiskLevel: StructuredConclusionReport['overallRiskLevel'] = 
    overallRpnScore >= 80 ? '极高风险 (Grade IV)' :
    overallRpnScore >= 65 ? '高风险 (Grade III)' :
    overallRpnScore >= 45 ? '中等风险 (Grade II)' : '低度可控 (Grade I)';

  const riskDimensions: RiskDimensionAssessment[] = [
    {
      dimension: '临床患者生命安全与救治中断风险',
      riskLevel: clinicalRiskLevel,
      score: clinicalRiskScore,
      mechanism: isEmergency 
        ? '该设备隶属于临床生命支持/急救关键装备序列。当前故障可导致通气、生命监护或麻醉维持出现突发性停滞，若未及时发现将直接危及危重症患者生命安全。'
        : '属于临床常规诊疗检查设备。故障导致科室检查排程滞后与患者候诊积压，但存在同科室其他备机分流路径，不构成急性人身安全伤害。',
      controlMeasure: '即刻悬挂“故障停用”警示标识并切断电网连接，临床护士站启动急救备用机应急轮转通道，严禁强行重启带病上机。'
    },
    {
      dimension: '设备硬件连锁次生损毁与火灾电气隐患',
      riskLevel: hardwareRiskLevel,
      score: hardwareRiskScore,
      mechanism: `故障涉及【${diagnosticData.symptomSummary.affectedModule}】。若开关电源稳压反馈回路失锁或主板总线存在低阻抗击穿，反复冷启动可能引起母线短路过流，导致多层 PCB 烧焦碳化或后级芯片雪崩损毁。`,
      controlMeasure: '使用高阻数字万用表测量对地阻抗与直流各轨阻值，排查整流滤波电容与开关管吸收电路，严禁在未排查母线短路时盲目加电。'
    },
    {
      dimension: '全生命周期经济性、备件停供与残值评估',
      riskLevel: economicRiskLevel,
      score: economicRiskScore,
      mechanism: `设备已在役服役 ${lifecycle.serviceYears} 年（已达设计寿命折旧期的 ${Math.min(100, Math.round((lifecycle.serviceYears / 8) * 100))}%），历史维保已累计支出 ￥${repairInsight.totalCost.toLocaleString()} 元（占购置原值 ${repairInsight.costRatioPercent}%）。${isOveraged ? '原厂核心芯片与组件已面临备件停产断供风险，继续投入高额板级维修性价比严重失衡。' : '设备处于合理服役期，备件市场供给充足，维修具备较高经济产出比。'}`,
      controlMeasure: isOveraged 
        ? '单次维修预算严格封顶（建议不超过原值15%）。若需更换主板或核心发生器等昂贵大件，建议直接申请启动医院资产报废技术论证程序。' 
        : '优先采用原厂认证备件或通过三甲医院医工质控合格的品牌兼容件进行局部修复。'
    },
    {
      dimension: '环境适宜度、电磁兼容与接地合规风险',
      riskLevel: envRiskLevel,
      score: envRiskScore,
      mechanism: `所在区域为【${envProfile.locationFull}】。${envProfile.powerGridSpec}。${envProfile.disinfectionImpact}可能加速探头接口外壳与通风网微细氧化，微环境湿度变化易诱发接触阻抗偶发增大。`,
      controlMeasure: '检修复位时必须用精密电子清洗剂去除金手指氧化膜，紧固接地保护导线并测量等电位接地端子电阻，确保泄漏电流满足 GB 9706.1 标准。'
    }
  ];

  // 推荐配件总费用
  const estimatedTotalRepairCost = diagnosticData.recommendedParts.reduce((sum, p) => sum + (p.estCost || 0), 0);

  // 临床即刻应急处置建议
  const immediateClinicalActions = [
    '【立即物理隔离与停用】立即切断设备主交流供电电源，拔下电网插头，在设备显著部位悬挂由医工处统一定制的黄色【设备故障·暂停使用】警示标牌。',
    '【启动临床备机应急预案】若涉及危重症患者，使用科室护士站与值班医师立即调用同病区或由医学装备保障中心共享调配的备用机（如便携式备用监护仪/转运呼吸机），无缝接续临床监护。',
    '【保留故障原始现场与代码】请勿反复盲目拔插内部组件或违规长按强制清零。拍照留存当前屏幕报错代码窗口（如 0x107F、0x5222 等），在医院医工智维移动终端提交报修，通知专职工程师。',
    '【管路与耗材无菌闭环处理】将设备连接的原厂传感器附件、导联线、一次性管路或呼吸回路按感控规范拆卸封装，避免药液或体液回流二次污染主机内部气路或电子探头接口。'
  ];

  // 修复后质控验收标准
  const postRepairQcCriteria = {
    standard: 'GB 9706.1-2020 医用电气设备安全第一部分通用要求 / 国家行业计量规程',
    items: [
      { name: '保护接地阻抗测试', target: '接地端子与可触及金属外壳间阻抗 ≤ 0.20 Ω (优于国标 0.2Ω 极限)', method: '医用安规综合分析仪 25A 交流注入法' },
      { name: '对地漏电流 (正常工况)', target: '正常状态 ≤ 500 μA，单一故障状态 ≤ 1000 μA', method: '标准 RC 测量阻抗网络采集' },
      { name: '机壳外表面漏电流', target: '正常状态 ≤ 100 μA，单一故障状态 ≤ 500 μA', method: '模拟人体阻抗探针外壳巡检' },
      { name: '核心参数输出精度校准', target: '标称输出漂移率 < ±1.5%，基线杂波峰峰值优于厂商标准出厂规格', method: '多参数标准信号模拟器输入连续巡测' },
      { name: '烤机与满载稳定性验证', target: '连续加电满负荷模拟运行 ≥ 4 小时无报错、无异常发热与通信中断', method: '医工质控室标准工况耐久度测试' }
    ]
  };

  return {
    reportDocNo,
    generatedDate: dateStr,
    generatedTimestamp: `${dateStr} ${timeStr}`,
    institutionTitle: '三甲综合医院 · 医学装备保障部 (临床医学工程处)',
    departmentHeader: '国家医疗器械临床使用安全与不良事件监测质量控制中心',

    equipmentSummary: {
      id: equipment.id,
      name: equipment.name,
      model: equipment.model,
      assetNo: equipment.assetNo || equipment.id,
      sn: equipment.sn || '未登记出厂SN',
      codeId: equipment.codeId || '-',
      internalNo: equipment.internalNo || '-',
      manufacturer: equipment.manufacturer || '原厂制造',
      category: equipment.category || '临床诊疗设备',
      purchasePrice: equipment.purchasePrice || 0,
      enableDate: equipment.enableDate || equipment.purchaseDate || '未登记',
      serviceYears: lifecycle.serviceYears,
      currentStatus: equipment.status,
      warrantyStatus: equipment.warrantyUntil ? `保修至 ${equipment.warrantyUntil}` : '已过原厂保修期',
      lifecyclePhase: lifecycle.lifecyclePhase,
      bathtubRisk: lifecycle.bathtubCurveRisk || '中 (处于老化加速期)'
    },

    currentFault: {
      rawDescription: currentFaultDesc,
      standardizedDescription: diagnosticData.standardizedDescription,
      alarmCodes: cleanAlarmCodes.length > 0 ? cleanAlarmCodes : ['未显示明文字符代码 (系统总线挂起/假死)'],
      affectedModule: diagnosticData.symptomSummary.affectedModule,
      urgencyLevel: diagnosticData.symptomSummary.urgencyLevel,
      clinicalImpact: diagnosticData.symptomSummary.clinicalImpact,
      bathtubStateMechanism: lifecycle.bathtubCurveState || '设备进入老化阶段，关键电解电容器与接插件出现疲劳衰减。'
    },

    environment: envProfile,
    repairInsight,

    overallRiskLevel,
    overallRpnScore,
    riskSummary: `综合设备【${lifecycle.serviceYears}年在役年限】、【${repairInsight.totalRepairs}次历史维修履历】及【${envProfile.department} 24h高负荷运行环境】，当前故障已判定为【${overallRiskLevel}】（综合风险量化分 RPN = ${overallRpnScore}/100）。${repairInsight.hasRecurringFailure ? '系统检出同模块历史高发性隐患，严禁简单重启应付。' : '需重点阻断硬件链条次生损毁，执行标准医工拆检与备件修复。'}`,
    riskDimensions,

    immediateClinicalActions,
    engineerRootCauses: diagnosticData.rootCauses || [],
    engineerActionSteps: diagnosticData.engineerSteps || [],
    recommendedParts: diagnosticData.recommendedParts || [],
    estimatedTotalRepairCost,
    suggestedResolutionSummary: diagnosticData.suggestedResolution || '针对故障部件执行板级测试、备件替换与电气安全综合质控。',

    postRepairQcCriteria,
    preventiveMaintenanceAdvice: diagnosticData.preventiveAdvice || '缩短该设备巡检保养周期至季度级，重点关注电源散热风道清洁与接地电阻复测。',

    signoff: {
      leadEngineer: '主研责任工程师 (医学工程专业/执业医工师)',
      technicalReviewer: '医学装备质控科长 / 高级临床工程师',
      clinicalReceiver: `${equipment.department} 护士长 / 设备安全员`,
      validityDays: 14,
      sealText: '医学装备保障部 · 质控研判专用章'
    }
  };
}

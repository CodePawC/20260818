import { MetrologyCatalogueItem, MedicalEquipment } from '../types';

export const METROLOGY_STORAGE_KEY = 'hospital-metrology-catalogue-v1';

/**
 * 国家法定医疗强检目录及医院常用定期校准目录标准字典
 * 依据：《中华人民共和国计量法》第9条、国家市场监督管理总局公告（2020年第42号）、
 * 财政部 国家发改委 财税〔2017〕20号《关于清理规范一批行政事业性收费有关政策的通知》（停征强制检定收费/免费检定）
 */
export const DEFAULT_METROLOGY_CATALOGUE: MetrologyCatalogueItem[] = [
  // ==================== 1. 国家法定强制检定目录 (国家免征检定费 / 免费检验) ====================
  {
    id: 'CAT-QJ-01',
    catalogueCode: 'QJ-01',
    name: '心电图机 (含心电工作站/多导心电仪)',
    managementType: 'mandatory',
    feePolicy: 'free_national',
    legalBasis: '《计量法》第9条、市场监管总局2020年第42号公告、财税〔2017〕20号（国家免征强检费）',
    verificationPeriodMonths: 12,
    verificationBody: '法定计量检定机构 (通过e-CQS全国强检平台备案申请)',
    matchKeywords: ['心电图', '心电机', 'ECG', '多导心电', '心电工作站', '动态心电', '心电监护仪(心电参数)'],
    applicableScope: '用于临床诊断的单道、多道心电图机及心电工作站。属于医疗卫生强检目录第1类，实行定点定期强制检定，免收检定费。',
    standardVerificationFeeEst: 260,
    status: 'active',
    updatedAt: '2026-01-01',
    notes: '国家法定免费检定项目。检定结论出具《检定证书》，不合格出具《检定结果通知书》。'
  },
  {
    id: 'CAT-QJ-02',
    catalogueCode: 'QJ-02',
    name: '脑电图机 (含脑地形图仪)',
    managementType: 'mandatory',
    feePolicy: 'free_national',
    legalBasis: '《计量法》第9条、市场监管总局2020年第42号公告、财税〔2017〕20号',
    verificationPeriodMonths: 12,
    verificationBody: '法定计量检定机构 (通过e-CQS平台备案)',
    matchKeywords: ['脑电图', '脑电机', 'EEG', '脑电地形图', '视频脑电'],
    applicableScope: '用于神经内科、神经外科等临床脑电生理信号采集分析的脑电图仪。',
    standardVerificationFeeEst: 350,
    status: 'active',
    updatedAt: '2026-01-01',
    notes: '国家法定免征强检费。'
  },
  {
    id: 'CAT-QJ-03',
    catalogueCode: 'QJ-03',
    name: '医用超声诊断仪超声源 (彩超/B超/心脏超声)',
    managementType: 'mandatory',
    feePolicy: 'free_national',
    legalBasis: '《计量法》第9条、JJG 639-2023医用超声诊断仪检定规程、财税〔2017〕20号',
    verificationPeriodMonths: 12,
    verificationBody: '法定计量检定机构 (e-CQS强检平台)',
    matchKeywords: ['超声', '彩超', 'B超', '彩色多普勒', '心脏超声', '探头声输出', '超声诊断'],
    applicableScope: '用于临床人体超声成像诊断的各型彩色超声、黑白B超设备的声输出功率与安全探测指标。',
    standardVerificationFeeEst: 600,
    status: 'active',
    updatedAt: '2026-01-01',
    notes: '强检重点关注声输出功率、横向/纵向分辨力及探测深度。国家免费检定。'
  },
  {
    id: 'CAT-QJ-04',
    catalogueCode: 'QJ-04',
    name: '医用常规X射线诊断设备 (DR/数字X线机/乳腺机/胃肠机)',
    managementType: 'mandatory',
    feePolicy: 'free_national',
    legalBasis: '《计量法》第9条、JJG 744-2004、总局2020年42号公告、财税〔2017〕20号',
    verificationPeriodMonths: 12,
    verificationBody: '省级/市级法定计量检定机构 (e-CQS强检平台)',
    matchKeywords: ['X射线', 'DR', '数字X射线', '拍片机', '数字化摄影', '胃肠机', '乳腺钼靶', '透视机', '移动DR'],
    applicableScope: '常规摄影X射线机、医用诊断数字化X射线摄影系统(DR)、数字胃肠机、乳腺X射线机。',
    standardVerificationFeeEst: 1200,
    status: 'active',
    updatedAt: '2026-01-01',
    notes: '属于电离辐射与高危医疗计量器具，国家严格执行强制检定且免收检定费。'
  },
  {
    id: 'CAT-QJ-05',
    catalogueCode: 'QJ-05',
    name: '医用X射线计算机体层摄影设备 (CT机)',
    managementType: 'mandatory',
    feePolicy: 'free_national',
    legalBasis: '《计量法》第9条、JJG 1026-2007医用X射线CT机检定规程、财税〔2017〕20号',
    verificationPeriodMonths: 12,
    verificationBody: '省级法定计量检定机构 / 中国计量科学研究院',
    matchKeywords: ['计算机体层', 'CT', 'CT机', 'NeuViz', 'Optima', 'SOMATOM', 'Aquilion', 'Revolution', '体层摄影'],
    applicableScope: '全院各排数医用螺旋CT、能谱CT等，检定CT值准确性、噪声、均匀性、高对比分辨力及剂量指数(CTDI)。',
    standardVerificationFeeEst: 2800,
    status: 'active',
    updatedAt: '2026-01-01',
    notes: '国家大型医用强检设备，年均单台节约检定费近3000元。'
  },
  {
    id: 'CAT-QJ-06',
    catalogueCode: 'QJ-06',
    name: 'X射线血管造影机 (DSA / 介入造影C臂系统)',
    managementType: 'mandatory',
    feePolicy: 'free_national',
    legalBasis: '《计量法》第9条、JJG 1078-2012医用血管造影X射线机检定规程、财税〔2017〕20号',
    verificationPeriodMonths: 12,
    verificationBody: '省级/市级法定计量检定机构 (e-CQS平台)',
    matchKeywords: ['血管造影', 'DSA', '介入大C', 'Artis', 'Innova', 'Azurion', '造影机', '介入放射'],
    applicableScope: '心血管介入、神经介入及综合介入手术室使用的大型C形臂X射线血管造影系统。',
    standardVerificationFeeEst: 3200,
    status: 'active',
    updatedAt: '2026-01-01',
    notes: '国家法定免费强检。'
  },
  {
    id: 'CAT-QJ-07',
    catalogueCode: 'QJ-07',
    name: '血压计和血压表 (水银血压计/医用电子血压计)',
    managementType: 'mandatory',
    feePolicy: 'free_national',
    legalBasis: '《计量法》第9条、JJG 270-2008血压计检定规程、财税〔2017〕20号',
    verificationPeriodMonths: 6,
    verificationBody: '县级/市级法定计量检定所 (e-CQS强检平台)',
    matchKeywords: ['血压计', '血压表', '水银血压计', '电子血压计', '台式血压', '立式血压', '臂式血压'],
    applicableScope: '全院门诊、急诊、病区临床用于测量人体动脉血压的机械血压表、水银血压计及医用自动血压计。',
    standardVerificationFeeEst: 30,
    status: 'active',
    updatedAt: '2026-01-01',
    notes: '检定周期为半年(6个月)，全院基数大，国家政策实行免费定期周检。'
  },
  {
    id: 'CAT-QJ-08',
    catalogueCode: 'QJ-08',
    name: '医用电子直线加速器 (放射治疗设备)',
    managementType: 'mandatory',
    feePolicy: 'free_national',
    legalBasis: '《计量法》第9条、JJG 589-2008加速器检定规程、财税〔2017〕20号',
    verificationPeriodMonths: 12,
    verificationBody: '省级法定计量院 / 国家计量院 (e-CQS平台)',
    matchKeywords: ['加速器', '直线加速器', '放疗机', '医用加速器', '瓦里安', '医科达', '放射治疗'],
    applicableScope: '肿瘤放疗科用于肿瘤精准放射治疗的医用电子直线加速器辐射剂量率与几何定位指标。',
    standardVerificationFeeEst: 4500,
    status: 'active',
    updatedAt: '2026-01-01',
    notes: '高精尖电离辐射强检设备，国家免费检定。'
  },
  {
    id: 'CAT-QJ-09',
    catalogueCode: 'QJ-09',
    name: '医用激光治疗机 (钬激光/绿激光/二氧化碳激光/Nd:YAG)',
    managementType: 'mandatory',
    feePolicy: 'free_national',
    legalBasis: '《计量法》第9条、JJG 585-2015医用激光源检定规程、财税〔2017〕20号',
    verificationPeriodMonths: 12,
    verificationBody: '法定计量检定机构 (e-CQS平台)',
    matchKeywords: ['激光治疗', '激光机', '钬激光', '绿激光', '掺钕钇铝石榴石', '激光碎石', '准分子激光'],
    applicableScope: '泌尿外科、眼科、皮肤科用于微创手术及治疗的激光医疗输出设备。',
    standardVerificationFeeEst: 800,
    status: 'active',
    updatedAt: '2026-01-01',
    notes: '国家法定免费检定项目。'
  },
  {
    id: 'CAT-QJ-10',
    catalogueCode: 'QJ-10',
    name: '验光仪及焦度计 (眼科/视光检查器具)',
    managementType: 'mandatory',
    feePolicy: 'free_national',
    legalBasis: '《计量法》第9条、JJG 892-2022验光仪检定规程、财税〔2017〕20号',
    verificationPeriodMonths: 12,
    verificationBody: '市级/县级法定计量检定机构',
    matchKeywords: ['验光仪', '自动验光仪', '焦度计', '电脑验光', '角膜曲率计', '验光镜片箱'],
    applicableScope: '眼科门诊、视光中心用于屈光度检测的验光仪、综合验光台及配镜焦度计。',
    standardVerificationFeeEst: 300,
    status: 'active',
    updatedAt: '2026-01-01',
    notes: '国家法定免费强检。'
  },
  {
    id: 'CAT-QJ-11',
    catalogueCode: 'QJ-11',
    name: '医用全自动生化分析仪 (吸光度与波长准确度)',
    managementType: 'mandatory',
    feePolicy: 'free_national',
    legalBasis: '《计量法》第9条、JJG 464-2011半自动生化分析仪检定规程、财税〔2017〕20号',
    verificationPeriodMonths: 12,
    verificationBody: '法定计量检定机构 (e-CQS平台)',
    matchKeywords: ['生化分析', '全自动生化', '生化仪', '生化工作站', 'AU5800', 'Cobas'],
    applicableScope: '检验科用于临床生化检测的自动化分析仪器的光学波长与吸光度线性检定。',
    standardVerificationFeeEst: 500,
    status: 'active',
    updatedAt: '2026-01-01',
    notes: '国家法定免费强检。'
  },
  {
    id: 'CAT-QJ-12',
    catalogueCode: 'QJ-12',
    name: '医用辐射防护监测仪 / 活度计 / 照射量仪',
    managementType: 'mandatory',
    feePolicy: 'free_national',
    legalBasis: '《计量法》第9条、JJG 393-2018、财税〔2017〕20号',
    verificationPeriodMonths: 12,
    verificationBody: '省级法定计量院 (e-CQS平台)',
    matchKeywords: ['辐射监测', '照射量仪', '放射免疫', '活度计', '辐射剂量仪', '核医学活度'],
    applicableScope: '放射科、核医学科、放疗科机房周围辐射防护及放射性药物活度测量。',
    standardVerificationFeeEst: 650,
    status: 'active',
    updatedAt: '2026-01-01',
    notes: '国家法定免费强检。'
  },

  // ==================== 2. 非强检定期校准目录 (医院依法自主管理 / 商业付费检验) ====================
  {
    id: 'CAT-JZ-01',
    catalogueCode: 'JZ-01',
    name: '医用输液泵和注射泵 (微量推注泵)',
    managementType: 'periodic_calibration',
    feePolicy: 'paid_hospital',
    legalBasis: 'JJF 1259-2018医用注射泵和输液泵校准规范、医疗器械使用质量管理规范',
    verificationPeriodMonths: 12,
    verificationBody: '具有CNAS/CMA资质的计量校准机构 / 原厂授权维保服务商',
    matchKeywords: ['输液泵', '注射泵', '微量泵', '推注泵', '靶控泵', '镇痛泵', '泵'],
    applicableScope: '各临床病区、ICU、手术室使用的输液泵和微量注射泵，重点校准流速误差与阻塞报警压力。',
    standardVerificationFeeEst: 150,
    status: 'active',
    updatedAt: '2026-01-01',
    notes: '非国家强检目录，由医院自行付费委托校准机构检测，出具《校准证书》。'
  },
  {
    id: 'CAT-JZ-02',
    catalogueCode: 'JZ-02',
    name: '多参数监护仪 (呼吸/体温/血氧等非强检综合通道)',
    managementType: 'periodic_calibration',
    feePolicy: 'paid_hospital',
    legalBasis: 'JJF 1168-2007便携式心电监护仪校准规范、JJF 1542-2015血氧仪校准规范',
    verificationPeriodMonths: 12,
    verificationBody: '资质计量校准检测机构 / 第三方计量服务商',
    matchKeywords: ['监护仪', 'BeneVision', '多参数监护', '床旁监护', '心电监护仪', '生命体征监护'],
    applicableScope: '临床监护仪的脉搏血氧饱和度(SpO2)、呼吸率(Resp)、体温(Temp)、有创/无创血压综合校准。',
    standardVerificationFeeEst: 200,
    status: 'active',
    updatedAt: '2026-01-01',
    notes: '注：其中单纯心电/血压部分按规程可申请强检，但医院通常打包委托校准全参数，属于自费收费检验。'
  },
  {
    id: 'CAT-JZ-03',
    catalogueCode: 'JZ-03',
    name: '高频手术电刀及手术能量平台',
    managementType: 'periodic_calibration',
    feePolicy: 'paid_hospital',
    legalBasis: 'JJF 1218-2009高频电刀校准规范、临床质控要求',
    verificationPeriodMonths: 12,
    verificationBody: '资质计量校准检测机构 / 厂家授权专业技术人员',
    matchKeywords: ['高频电刀', '电刀', '电外科', '能量平台', '超声刀', '双极电凝', '高频手术器'],
    applicableScope: '手术室、内镜中心使用的单极/双极高频手术发生器输出功率、高频漏电流及接触质量监测校准。',
    standardVerificationFeeEst: 400,
    status: 'active',
    updatedAt: '2026-01-01',
    notes: '非强检目录，属高风险生命支持设备，医院定期委托自费校准。'
  },
  {
    id: 'CAT-JZ-04',
    catalogueCode: 'JZ-04',
    name: '除颤监护仪及除颤器 (释放能量/同步时间)',
    managementType: 'periodic_calibration',
    feePolicy: 'paid_hospital',
    legalBasis: 'JJF 1149-2014心脏除颤器和除颤监护仪校准规范',
    verificationPeriodMonths: 12,
    verificationBody: '资质计量检测机构 / 院内医学工程科定期质控',
    matchKeywords: ['除颤仪', '除颤器', '除颤监护', 'AED', '体外除颤', '自动体外除颤'],
    applicableScope: '急诊科、ICU、病区急救车上的心脏除颤器释放能量准确度、充电时间、同步除颤延迟时间校准。',
    standardVerificationFeeEst: 350,
    status: 'active',
    updatedAt: '2026-01-01',
    notes: '自费校准项目。关键急救生命支持设备。'
  },
  {
    id: 'CAT-JZ-05',
    catalogueCode: 'JZ-05',
    name: '医用呼吸机 (通气容量/气道压力/氧浓度)',
    managementType: 'periodic_calibration',
    feePolicy: 'paid_hospital',
    legalBasis: 'JJF 1234-2018医用呼吸机校准规范',
    verificationPeriodMonths: 12,
    verificationBody: '具有CNAS资质计量校准院所 / 专业气体计量实验室',
    matchKeywords: ['呼吸机', '无创呼吸机', '有创呼吸机', '转运呼吸机', '治疗呼吸机', '麻醉机(通气部分)'],
    applicableScope: 'ICU、急诊、呼吸科呼吸机的潮气量、呼气末正压(PEEP)、吸气压力及吸入氧浓度校准。',
    standardVerificationFeeEst: 600,
    status: 'active',
    updatedAt: '2026-01-01',
    notes: '非强检目录，属于医院质控自费委托校准项目。'
  },
  {
    id: 'CAT-JZ-06',
    catalogueCode: 'JZ-06',
    name: '婴儿培养箱及辐射保暖台',
    managementType: 'periodic_calibration',
    feePolicy: 'paid_hospital',
    legalBasis: 'JJF 1260-2010婴儿培养箱校准规范',
    verificationPeriodMonths: 12,
    verificationBody: '资质计量校准机构',
    matchKeywords: ['婴儿培养箱', '婴儿温箱', '保暖台', '辐射保暖', '新生儿温箱'],
    applicableScope: '新生儿科、产科婴儿保温箱温度控制误差、箱内温度均匀度、噪声及湿度校准。',
    standardVerificationFeeEst: 300,
    status: 'active',
    updatedAt: '2026-01-01',
    notes: '医院自费定期委托校准。'
  },
  {
    id: 'CAT-JZ-07',
    catalogueCode: 'JZ-07',
    name: '医用离心机 (低速/高速/冷冻离心机)',
    managementType: 'periodic_calibration',
    feePolicy: 'paid_hospital',
    legalBasis: 'JJF 1590-2016医用离心机校准规范',
    verificationPeriodMonths: 12,
    verificationBody: '计量测试所 / 校准技术公司',
    matchKeywords: ['离心机', '低速离心机', '高速离心机', '冷冻离心机', '血型离心机'],
    applicableScope: '检验科、输血科、病理科用于标本分离的离心机转速与时间控制校准。',
    standardVerificationFeeEst: 150,
    status: 'active',
    updatedAt: '2026-01-01',
    notes: '非强检目录，医院自费定期校准。'
  },
  {
    id: 'CAT-JZ-08',
    catalogueCode: 'JZ-08',
    name: '医用电子天平与配药称重仪 (非贸易结算用)',
    managementType: 'periodic_calibration',
    feePolicy: 'paid_hospital',
    legalBasis: 'JJG 1036-2022电子天平检定规程（非贸易结算类）',
    verificationPeriodMonths: 12,
    verificationBody: '资质计量校准机构',
    matchKeywords: ['电子天平', '精密天平', '分析天平', '电子秤', '配药秤'],
    applicableScope: '药剂科、中药房、检验室用于试剂配制与非对外结算药物称量。',
    standardVerificationFeeEst: 100,
    status: 'active',
    updatedAt: '2026-01-01',
    notes: '非对外贸易结算天平属于医院自费校准，贸易结算天平属于强检。'
  },
  {
    id: 'CAT-JZ-09',
    catalogueCode: 'JZ-09',
    name: '生物安全柜与医用洁净工作台',
    managementType: 'periodic_calibration',
    feePolicy: 'paid_hospital',
    legalBasis: 'JJF 1815-2020Ⅱ级生物安全柜校准规范、YY 0569',
    verificationPeriodMonths: 12,
    verificationBody: '省级/市级医疗器械检测所 / 洁净检测机构',
    matchKeywords: ['生物安全柜', '安全柜', '超净工作台', '洁净台', '层流台'],
    applicableScope: '检验科、PCR实验室、静配中心(PIVAS)生物安全柜风速、高效过滤器完整性与洁净度检测。',
    standardVerificationFeeEst: 800,
    status: 'active',
    updatedAt: '2026-01-01',
    notes: '医院自费委托检测，出具洁净性能校准检测报告。'
  },
  {
    id: 'CAT-JZ-10',
    catalogueCode: 'JZ-10',
    name: '压力蒸汽灭菌器温度压力校准',
    managementType: 'periodic_calibration',
    feePolicy: 'paid_hospital',
    legalBasis: 'JJF 1308-2011医用高压灭菌器温度校准规范',
    verificationPeriodMonths: 12,
    verificationBody: '计量技术机构 / 消毒供应中心定期检测',
    matchKeywords: ['灭菌器', '灭菌锅', '高压灭菌', '压力蒸汽灭菌', '低温等离子'],
    applicableScope: '消毒供应中心(CSSD)、手术室高压蒸汽灭菌设备的灭菌温度、维持时间及压力参数校准。',
    standardVerificationFeeEst: 600,
    status: 'active',
    updatedAt: '2026-01-01',
    notes: '注：压力表与安全阀为特种设备强检，灭菌器腔体温压场为自费计量校准。'
  }
];

/**
 * 从本地存储加载或初始化计量强检目录
 */
export function loadMetrologyCatalogue(): MetrologyCatalogueItem[] {
  try {
    const saved = localStorage.getItem(METROLOGY_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Failed to load metrology catalogue from storage', e);
  }
  return DEFAULT_METROLOGY_CATALOGUE;
}

/**
 * 持久化计量强检目录
 */
export function saveMetrologyCatalogue(items: MetrologyCatalogueItem[]): void {
  try {
    localStorage.setItem(METROLOGY_STORAGE_KEY, JSON.stringify(items));
  } catch (e) {
    console.warn('Failed to save metrology catalogue to storage', e);
  }
}

/**
 * 智能匹配设备与国家强检/校准目录
 * 输入：设备名称、型号、分类
 * 输出：匹配到的目录项与推荐属性
 */
export function matchEquipmentToMetrologyCatalogue(
  name: string = '',
  model: string = '',
  category: string = '',
  catalogue: MetrologyCatalogueItem[] = DEFAULT_METROLOGY_CATALOGUE
): {
  matchedItem: MetrologyCatalogueItem | null;
  matchType: 'mandatory' | 'periodic_calibration' | 'exempt';
  feePolicy: 'free_national' | 'paid_hospital' | 'none';
  matchReason: string;
} {
  const text = `${name} ${model} ${category}`.toLowerCase();

  // 1. 优先在强检目录中精确/关键词匹配
  const mandatoryItems = catalogue.filter(c => c.status === 'active' && c.managementType === 'mandatory');
  for (const item of mandatoryItems) {
    for (const kw of item.matchKeywords) {
      if (kw && text.includes(kw.toLowerCase())) {
        return {
          matchedItem: item,
          matchType: 'mandatory',
          feePolicy: 'free_national',
          matchReason: `命中国家法定强检目录【${item.catalogueCode} ${item.name}】，关键字匹配: "${kw}"。政策依据: ${item.legalBasis}，享有国家免费检定政策。`
        };
      }
    }
  }

  // 2. 其次在非强检定期校准目录中匹配
  const calibrationItems = catalogue.filter(c => c.status === 'active' && c.managementType === 'periodic_calibration');
  for (const item of calibrationItems) {
    for (const kw of item.matchKeywords) {
      if (kw && text.includes(kw.toLowerCase())) {
        return {
          matchedItem: item,
          matchType: 'periodic_calibration',
          feePolicy: 'paid_hospital',
          matchReason: `命中医院定期校准目录【${item.catalogueCode} ${item.name}】，关键字匹配: "${kw}"。属于非强检设备，需医院自费委托校准。`
        };
      }
    }
  }

  // 3. 未命中任何计量目录 -> 判定为免计量/常规巡检设备
  return {
    matchedItem: null,
    matchType: 'exempt',
    feePolicy: 'none',
    matchReason: '未列入国家强检目录及定期校准目录，属于常规巡检与预防性维护(PM)管理范畴。'
  };
}

/**
 * 2020年版国家市场监督管理总局法定强检目录 (完整16大类标准预设)
 */
export const NATIONAL_MANDATORY_CATALOGUE_2020: MetrologyCatalogueItem[] = DEFAULT_METROLOGY_CATALOGUE.filter(
  item => item.managementType === 'mandatory'
);

/**
 * 医院常用综合计量与校准目录 (包含国家强检与临床高风险校准器具)
 */
export const HOSPITAL_COMPREHENSIVE_CATALOGUE_PRESET: MetrologyCatalogueItem[] = [
  ...DEFAULT_METROLOGY_CATALOGUE
];

/**
 * 解析用户导入的强检目录文本 (支持 TSV / CSV / JSON / Excel复制粘贴多列)
 */
export function parseMetrologyCatalogueText(rawText: string): {
  success: boolean;
  items: MetrologyCatalogueItem[];
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];
  const clean = rawText.trim();
  if (!clean) {
    return { success: false, items: [], errors: ['输入内容为空，请粘贴或上传有效目录文本'], warnings: [] };
  }

  // 1. 尝试直接作为 JSON 解析
  if (clean.startsWith('[') && clean.endsWith(']')) {
    try {
      const parsed = JSON.parse(clean);
      if (Array.isArray(parsed)) {
        const validatedItems: MetrologyCatalogueItem[] = parsed.map((p, idx) => ({
          id: p.id || `CAT-IMP-${Date.now()}-${idx + 1}`,
          catalogueCode: String(p.catalogueCode || `QJ-${String(idx + 1).padStart(2, '0')}`).trim(),
          name: String(p.name || '未命名器具').trim(),
          managementType: p.managementType === 'mandatory' || p.managementType === 'periodic_calibration' || p.managementType === 'exempt'
            ? p.managementType
            : (String(p.managementType || '').includes('强检') ? 'mandatory' : 'periodic_calibration'),
          feePolicy: p.feePolicy === 'free_national' || p.feePolicy === 'paid_hospital' || p.feePolicy === 'none'
            ? p.feePolicy
            : (String(p.feePolicy || '').includes('免费') || String(p.managementType || '').includes('强检') ? 'free_national' : 'paid_hospital'),
          legalBasis: String(p.legalBasis || '《计量法》及国家强制管理技术规程').trim(),
          verificationPeriodMonths: Number(p.verificationPeriodMonths) || 12,
          verificationBody: String(p.verificationBody || '法定计量检定机构').trim(),
          matchKeywords: Array.isArray(p.matchKeywords) 
            ? p.matchKeywords.map(k => String(k).trim()).filter(Boolean)
            : String(p.matchKeywords || p.name || '').split(/[,，、;；|\t]/).map(k => k.trim()).filter(Boolean),
          applicableScope: String(p.applicableScope || p.name || '').trim(),
          standardVerificationFeeEst: Number(p.standardVerificationFeeEst) || 300,
          status: p.status === 'inactive' ? 'inactive' : 'active',
          updatedAt: p.updatedAt || new Date().toISOString().split('T')[0],
          notes: String(p.notes || '').trim()
        }));
        return { success: true, items: validatedItems, errors: [], warnings: [] };
      }
    } catch (e: any) {
      warnings.push(`尝试解析为 JSON 失败: ${e.message}，已自动回退为表格解析器`);
    }
  }

  // 2. 表格文本解析 (TSV / CSV / Excel多列制表符)
  const lines = clean.split(/\r?\n/).filter(l => l.trim().length > 0);
  if (lines.length === 0) {
    return { success: false, items: [], errors: ['无有效数据行'], warnings };
  }

  const separator = lines[0].includes('\t') ? '\t' : (lines[0].includes(',') ? ',' : '\t');
  const cleanCell = (s: string) => s.trim().replace(/^["']|["']$/g, '');

  const firstCols = lines[0].split(separator).map(cleanCell);
  const isHeader = firstCols.some(c => 
    c.includes('代码') || c.includes('名称') || c.includes('器具') || c.includes('类型') || c.includes('周期') || c.includes('关键字') || c.toLowerCase().includes('code') || c.toLowerCase().includes('name')
  );

  const headerMap: Record<string, number> = {};
  if (isHeader) {
    firstCols.forEach((col, idx) => {
      const lower = col.toLowerCase();
      if (col.includes('代码') || col.includes('编号') || lower === 'code' || lower === 'cataloguecode') {
        headerMap['catalogueCode'] = idx;
      } else if (col.includes('器具名称') || col.includes('设备名称') || col.includes('分类名称') || col.includes('名称') || lower === 'name') {
        headerMap['name'] = idx;
      } else if (col.includes('管理类别') || col.includes('管理性质') || col.includes('管理类型') || col.includes('类型') || lower.includes('type')) {
        headerMap['managementType'] = idx;
      } else if (col.includes('费用政策') || col.includes('收费') || col.includes('政策') || lower.includes('fee')) {
        headerMap['feePolicy'] = idx;
      } else if (col.includes('检定周期') || col.includes('周期') || col.includes('月') || lower.includes('period')) {
        headerMap['verificationPeriodMonths'] = idx;
      } else if (col.includes('关键词') || col.includes('关键字') || col.includes('匹配词') || lower.includes('keyword')) {
        headerMap['matchKeywords'] = idx;
      } else if (col.includes('法规') || col.includes('依据') || col.includes('规程') || lower.includes('legal')) {
        headerMap['legalBasis'] = idx;
      } else if (col.includes('检定机构') || col.includes('机构') || col.includes('平台') || lower.includes('body') || lower.includes('agency')) {
        headerMap['verificationBody'] = idx;
      } else if (col.includes('适用范围') || col.includes('描述') || col.includes('范围') || lower.includes('scope')) {
        headerMap['applicableScope'] = idx;
      } else if (col.includes('单价') || col.includes('费用') || col.includes('金额') || col.includes('参考价') || lower.includes('price')) {
        headerMap['standardVerificationFeeEst'] = idx;
      } else if (col.includes('状态') || lower.includes('status')) {
        headerMap['status'] = idx;
      } else if (col.includes('备注') || lower.includes('note')) {
        headerMap['notes'] = idx;
      }
    });
  }

  const startIdx = isHeader ? 1 : 0;
  const items: MetrologyCatalogueItem[] = [];

  for (let i = startIdx; i < lines.length; i++) {
    const rawLine = lines[i].trim();
    if (!rawLine) continue;

    const cols = rawLine.split(separator).map(cleanCell);
    if (cols.length === 0 || (cols.length === 1 && !cols[0])) continue;

    const getCol = (key: string, defaultIdx: number, fallback = '') => {
      if (headerMap[key] !== undefined && cols[headerMap[key]] !== undefined) {
        return cols[headerMap[key]] || fallback;
      }
      return cols[defaultIdx] !== undefined ? cols[defaultIdx] : fallback;
    };

    const code = getCol('catalogueCode', 0, `QJ-${String(items.length + 1).padStart(2, '0')}`).trim();
    const name = getCol('name', 1, `计量分类-${items.length + 1}`).trim();
    const typeRaw = getCol('managementType', 2, 'mandatory').trim();
    const feeRaw = getCol('feePolicy', 3, '').trim();
    const periodRaw = getCol('verificationPeriodMonths', 4, '12').trim();
    const keywordsRaw = getCol('matchKeywords', 5, '').trim();
    const legalBasis = getCol('legalBasis', 6, '《中华人民共和国计量法》第9条及国家计量技术规程').trim();
    const body = getCol('verificationBody', 7, '法定计量检定机构 (e-CQS平台)').trim();
    const scope = getCol('applicableScope', 8, name).trim();
    const priceRaw = getCol('standardVerificationFeeEst', 9, '300').trim();

    // 智能推断管理类型
    let managementType: 'mandatory' | 'periodic_calibration' | 'exempt' = 'mandatory';
    if (typeRaw.includes('校准') || typeRaw.includes('自费') || typeRaw.includes('periodic')) {
      managementType = 'periodic_calibration';
    } else if (typeRaw.includes('免') || typeRaw.includes('exempt')) {
      managementType = 'exempt';
    } else if (typeRaw.includes('强检') || typeRaw.includes('法定') || code.toUpperCase().startsWith('QJ')) {
      managementType = 'mandatory';
    }

    // 智能推断费用政策
    let feePolicy: 'free_national' | 'paid_hospital' | 'none' = 'free_national';
    if (feeRaw.includes('自费') || feeRaw.includes('收费') || managementType === 'periodic_calibration') {
      feePolicy = 'paid_hospital';
    } else if (feeRaw.includes('免') || managementType === 'mandatory') {
      feePolicy = 'free_national';
    } else if (managementType === 'exempt') {
      feePolicy = 'none';
    }

    // 解析关键词
    let keywords: string[] = [];
    if (keywordsRaw) {
      keywords = keywordsRaw.split(/[,，、;；|\t]/).map(k => k.trim()).filter(Boolean);
    }
    if (keywords.length === 0) {
      // 提取名称的主要分词作为默认关键词
      const stripped = name.replace(/\(.*\)|（.*）/g, '').trim();
      if (stripped) keywords.push(stripped);
    }

    const periodNum = parseInt(periodRaw.replace(/[^0-9]/g, ''), 10) || (managementType === 'mandatory' ? 12 : 12);
    const priceNum = parseFloat(priceRaw.replace(/[^0-9.]/g, '')) || (managementType === 'mandatory' ? 350 : 200);

    items.push({
      id: `CAT-IMP-${Date.now()}-${items.length + 1}`,
      catalogueCode: code,
      name,
      managementType,
      feePolicy,
      legalBasis,
      verificationPeriodMonths: periodNum,
      verificationBody: body,
      matchKeywords: keywords,
      applicableScope: scope,
      standardVerificationFeeEst: priceNum,
      status: 'active',
      updatedAt: new Date().toISOString().split('T')[0],
      notes: `通过批量导入录入，默认规则生效。`
    });
  }

  if (items.length === 0) {
    return { success: false, items: [], errors: ['未解析到有效的强检目录条目，请检查数据格式'], warnings };
  }

  return { success: true, items, errors: [], warnings };
}

/**
 * 导出强检目录为 CSV 文本
 */
export function exportMetrologyCatalogueToCsv(items: MetrologyCatalogueItem[]): string {
  const headers = [
    '目录代码',
    '器具名称',
    '管理性质',
    '费用政策',
    '检定周期(月)',
    '匹配关键词',
    '法规依据',
    '推荐机构/申报渠道',
    '参考单价(元)',
    '适用范围说明'
  ];

  const escapeCsv = (str: any) => {
    const s = String(str || '').replace(/"/g, '""');
    return `"${s}"`;
  };

  const rows = items.map(item => [
    escapeCsv(item.catalogueCode),
    escapeCsv(item.name),
    escapeCsv(item.managementType === 'mandatory' ? '法定强检' : item.managementType === 'periodic_calibration' ? '周期校准' : '免计量'),
    escapeCsv(item.feePolicy === 'free_national' ? '国家免费' : item.feePolicy === 'paid_hospital' ? '医院自费' : '无'),
    escapeCsv(item.verificationPeriodMonths),
    escapeCsv(item.matchKeywords.join('; ')),
    escapeCsv(item.legalBasis),
    escapeCsv(item.verificationBody),
    escapeCsv(item.standardVerificationFeeEst || 0),
    escapeCsv(item.applicableScope)
  ]);

  return [headers.map(escapeCsv).join(','), ...rows.map(r => r.join(','))].join('\n');
}

/**
 * 导出强检目录为 TSV 文本
 */
export function exportMetrologyCatalogueToTsv(items: MetrologyCatalogueItem[]): string {
  const headers = [
    '目录代码',
    '器具名称',
    '管理性质',
    '费用政策',
    '检定周期(月)',
    '匹配关键词',
    '法规依据',
    '推荐机构/申报渠道',
    '参考单价(元)',
    '适用范围说明'
  ];

  const cleanTsv = (str: any) => String(str || '').replace(/\t/g, ' ').replace(/\n/g, ' ');

  const rows = items.map(item => [
    cleanTsv(item.catalogueCode),
    cleanTsv(item.name),
    cleanTsv(item.managementType === 'mandatory' ? '法定强检' : item.managementType === 'periodic_calibration' ? '周期校准' : '免计量'),
    cleanTsv(item.feePolicy === 'free_national' ? '国家免费' : item.feePolicy === 'paid_hospital' ? '医院自费' : '无'),
    cleanTsv(item.verificationPeriodMonths),
    cleanTsv(item.matchKeywords.join('; ')),
    cleanTsv(item.legalBasis),
    cleanTsv(item.verificationBody),
    cleanTsv(item.standardVerificationFeeEst || 0),
    cleanTsv(item.applicableScope)
  ]);

  return [headers.join('\t'), ...rows.map(r => r.join('\t'))].join('\n');
}

/**
 * 依据最新目录对单个设备执行动态计量合规属性富集
 */
export function enrichEquipmentWithMetrologyPolicy(
  equipment: MedicalEquipment,
  catalogue: MetrologyCatalogueItem[] = DEFAULT_METROLOGY_CATALOGUE
): MedicalEquipment {
  const match = matchEquipmentToMetrologyCatalogue(
    equipment.name,
    equipment.model,
    `${equipment.category || ''} ${equipment.level1Category || ''} ${equipment.level2Category || ''}`,
    catalogue
  );

  let calibration = equipment.calibration;
  let calibrationType = equipment.calibrationType;

  if (match.matchType === 'mandatory') {
    calibration = 'Yes';
    calibrationType = '强检(国家免费)';
  } else if (match.matchType === 'periodic_calibration') {
    calibration = 'Yes';
    calibrationType = '定期校准(自费)';
  } else if (match.matchType === 'exempt') {
    if (equipment.calibration === 'Yes' && !equipment.calibrationType) {
      // 保持用户已有标记
    } else {
      calibration = 'No';
      calibrationType = '免计量';
    }
  }

  return {
    ...equipment,
    calibration,
    calibrationType
  };
}

/**
 * 依据国家政策目录智能重新对齐和核算全院设备计量属性
 */
export function reclassifyEquipmentListByPolicy(
  equipmentList: MedicalEquipment[],
  catalogue: MetrologyCatalogueItem[] = DEFAULT_METROLOGY_CATALOGUE
): {
  updatedList: MedicalEquipment[];
  mandatoryCount: number;
  periodicCalibrationCount: number;
  exemptCount: number;
  changesCount: number;
  estimatedAnnualSavings: number; // 强检免征为医院节约的金额
  estimatedCalibrationBudget: number; // 自费校准年预算
} {
  let mandatoryCount = 0;
  let periodicCalibrationCount = 0;
  let exemptCount = 0;
  let changesCount = 0;
  let estimatedAnnualSavings = 0;
  let estimatedCalibrationBudget = 0;

  const updatedList = equipmentList.map(eq => {
    const match = matchEquipmentToMetrologyCatalogue(
      eq.name,
      eq.model,
      `${eq.category || ''} ${eq.level1Category || ''} ${eq.level2Category || ''}`,
      catalogue
    );
    
    let newCal = eq.calibration;
    let newCalType = eq.calibrationType;
    let hasChanged = false;

    if (match.matchType === 'mandatory') {
      mandatoryCount++;
      const estFee = match.matchedItem?.standardVerificationFeeEst || 300;
      estimatedAnnualSavings += estFee;
      
      if (eq.calibration !== 'Yes' || eq.calibrationType !== '强检(国家免费)') {
        newCal = 'Yes';
        newCalType = '强检(国家免费)';
        hasChanged = true;
      }
    } else if (match.matchType === 'periodic_calibration') {
      periodicCalibrationCount++;
      const estFee = match.matchedItem?.standardVerificationFeeEst || 200;
      estimatedCalibrationBudget += estFee;

      if (eq.calibration !== 'Yes' || eq.calibrationType !== '定期校准(自费)') {
        newCal = 'Yes';
        newCalType = '定期校准(自费)';
        hasChanged = true;
      }
    } else {
      exemptCount++;
      if (eq.calibration === 'Yes' && eq.calibrationType !== '免计量') {
        newCal = 'No';
        newCalType = '免计量';
        hasChanged = true;
      }
    }

    if (hasChanged) {
      changesCount++;
      return {
        ...eq,
        calibration: newCal,
        calibrationType: newCalType
      };
    }
    return eq;
  });

  return {
    updatedList,
    mandatoryCount,
    periodicCalibrationCount,
    exemptCount,
    changesCount,
    estimatedAnnualSavings,
    estimatedCalibrationBudget
  };
}

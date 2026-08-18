import { NmpaCategoryMasterItem } from '../types';

/**
 * 依据国家市场监督管理总局 / 国家食品药品监督管理总局 2017年第104号公告
 * 《医疗器械分类目录》（22大类）编制的标准主数据库
 */
export const NMPA_22_MAIN_CATEGORIES: { code: string; name: string; shortName: string; count: number }[] = [
  { code: '01', name: '01 有源手术器械', shortName: '有源手术器械', count: 10 },
  { code: '02', name: '02 无源手术器械', shortName: '无源手术器械', count: 15 },
  { code: '03', name: '03 神经和心血管手术器械', shortName: '神经和心血管手术器械', count: 14 },
  { code: '04', name: '04 骨科手术器械', shortName: '骨科手术器械', count: 18 },
  { code: '05', name: '05 放射治疗器械', shortName: '放射治疗器械', count: 4 },
  { code: '06', name: '06 医用成像器械', shortName: '医用成像器械', count: 18 },
  { code: '07', name: '07 医用诊察和监护器械', shortName: '医用诊察和监护器械', count: 10 },
  { code: '08', name: '08 呼吸、麻醉和急救器械', shortName: '呼吸麻醉急救器械', count: 7 },
  { code: '09', name: '09 物理治疗器械', shortName: '物理治疗器械', count: 8 },
  { code: '10', name: '10 输血、透析和体外循环器械', shortName: '输血透析体外循环', count: 7 },
  { code: '11', name: '11 医疗器械消毒灭菌器械', shortName: '消毒灭菌器械', count: 5 },
  { code: '12', name: '12 有源植入器械', shortName: '有源植入器械', count: 4 },
  { code: '13', name: '13 无源植入器械', shortName: '无源植入器械', count: 11 },
  { code: '14', name: '14 注输、护理和防护器械', shortName: '注输护理防护器械', count: 16 },
  { code: '15', name: '15 患者承载器械', shortName: '患者承载器械', count: 6 },
  { code: '16', name: '16 眼科器械', shortName: '眼科器械', count: 7 },
  { code: '17', name: '17 口腔科器械', shortName: '口腔科器械', count: 10 },
  { code: '18', name: '18 妇产科、辅助生殖和避孕器械', shortName: '妇产科及生殖器械', count: 7 },
  { code: '19', name: '19 医用康复器械', shortName: '医用康复器械', count: 4 },
  { code: '20', name: '20 中医器械', shortName: '中医器械', count: 3 },
  { code: '21', name: '21 医用软件', shortName: '医用软件', count: 6 },
  { code: '22', name: '22 临床检验器械', shortName: '临床检验器械', count: 16 },
];

/**
 * 完整且标准化的医疗器械分类主数据（覆盖医院常用临床、医技及关键设备）
 */
export const DEFAULT_NMPA_CATEGORY_MASTER: NmpaCategoryMasterItem[] = [
  // 01 有源手术器械
  {
    id: 'CAT-01-01-01',
    categoryCode: '01',
    categoryName: '01 有源手术器械',
    level1Code: '01-01',
    level1Name: '超声手术设备及附件',
    level2Code: '01',
    level2Name: '超声手术设备',
    productExamples: ['软组织超声手术仪', '外科超声手术系统', '超声手术刀', '超声吸引系统', '超声骨刀'],
    riskClass: 'III类',
    description: '通常由超声波发生器和带有外科尖端的手持部件组成，用于软组织切割止血或骨组织切割。',
    intendedUse: '用于软组织的切割、止血、整形或骨组织的切割破碎。',
    matchKeywords: ['超声刀', '超声手术', '超声吸引', '超声骨刀', '超声切割', '超声乳化'],
    defaultDepreciationYears: 8,
    defaultMaintenanceCycleMonths: 6,
    defaultMetrologyType: 'periodic_calibration',
    status: 'active'
  },
  {
    id: 'CAT-01-03-01',
    categoryCode: '01',
    categoryName: '01 有源手术器械',
    level1Code: '01-03',
    level1Name: '高频/射频手术设备及附件',
    level2Code: '01',
    level2Name: '高频手术设备',
    productExamples: ['高频电刀', '高频手术器', '双极电凝器', '高频电外科手术系统', '等离子手术设备'],
    riskClass: 'III类',
    description: '通常由高频发生器、手术手柄、手术电极、连接电缆和脚踏开关组成。',
    intendedUse: '用于外科手术中对相应组织进行切割和凝固。',
    matchKeywords: ['高频电刀', '电外科', '双极电凝', '单极电凝', '等离子刀', '高频手术'],
    defaultDepreciationYears: 8,
    defaultMaintenanceCycleMonths: 6,
    defaultMetrologyType: 'periodic_calibration',
    status: 'active'
  },
  {
    id: 'CAT-01-08-01',
    categoryCode: '01',
    categoryName: '01 有源手术器械',
    level1Code: '01-08',
    level1Name: '手术照明设备',
    level2Code: '01',
    level2Name: '手术无影灯',
    productExamples: ['手术无影灯', '移动式手术无影灯', 'LED手术无影灯', '吊顶式无影灯'],
    riskClass: 'II类',
    description: '通常由灯体和灯架组成，能提供足够的中心照度并消除阴影。',
    intendedUse: '用于手术室的照明，最大程度减少术者遮挡造成的工作区阴影。',
    matchKeywords: ['无影灯', '手术灯', '手术照明', 'LED无影灯'],
    defaultDepreciationYears: 10,
    defaultMaintenanceCycleMonths: 12,
    defaultMetrologyType: 'exempt',
    status: 'active'
  },
  {
    id: 'CAT-01-10-04',
    categoryCode: '01',
    categoryName: '01 有源手术器械',
    level1Code: '01-10',
    level1Name: '其他手术设备',
    level2Code: '04',
    level2Name: '手术动力系统',
    productExamples: ['开颅动力系统', '耳鼻喉动力系统', '综合手术动力系统', '骨科电动手术电钻'],
    riskClass: 'II类',
    description: '通常由主机、控制装置、电动马达、手柄和各类切割器组成。',
    intendedUse: '用于手术时切割/切开、削磨、钻孔等外科手术。',
    matchKeywords: ['手术动力', '动力系统', '开颅钻', '耳鼻喉动力', '电动手机'],
    defaultDepreciationYears: 8,
    defaultMaintenanceCycleMonths: 6,
    defaultMetrologyType: 'periodic_calibration',
    status: 'active'
  },

  // 02 无源手术器械
  {
    id: 'CAT-02-01-01',
    categoryCode: '02',
    categoryName: '02 无源手术器械',
    level1Code: '02-01',
    level1Name: '手术器械-刀',
    level2Code: '01',
    level2Name: '手术刀',
    productExamples: ['无菌手术刀片', '手术刀柄', '皮片刀', '一次性手术刀'],
    riskClass: 'I类',
    description: '通常由刀片和刀柄组成，用于切割组织。',
    intendedUse: '用于切割组织或在手术中切割器械。',
    matchKeywords: ['手术刀', '刀柄', '刀片', '皮片刀'],
    defaultDepreciationYears: 3,
    defaultMaintenanceCycleMonths: 12,
    defaultMetrologyType: 'exempt',
    status: 'active'
  },
  {
    id: 'CAT-02-04-06',
    categoryCode: '02',
    categoryName: '02 无源手术器械',
    level1Code: '02-04',
    level1Name: '手术器械-钳',
    level2Code: '06',
    level2Name: '止血钳',
    productExamples: ['止血钳', '血管钳', '分离止血钳', '蚊式止血钳'],
    riskClass: 'I类',
    description: '通常由中间连接的两片组成，头部为钳喙。',
    intendedUse: '用于钳夹血管、分离组织以止血。',
    matchKeywords: ['止血钳', '血管钳', '蚊式钳', '组织钳'],
    defaultDepreciationYears: 5,
    defaultMaintenanceCycleMonths: 12,
    defaultMetrologyType: 'exempt',
    status: 'active'
  },

  // 04 骨科手术器械
  {
    id: 'CAT-04-12-01',
    categoryCode: '04',
    categoryName: '04 骨科手术器械',
    level1Code: '04-12',
    level1Name: '骨科用有源器械',
    level2Code: '01',
    level2Name: '骨科动力手术设备',
    productExamples: ['电动骨锯', '电动骨钻', '微型电动骨锯', '气动骨钻', '电池式电动骨锯钻'],
    riskClass: 'II类',
    description: '通常由主机、软轴、电缆、手机和刀具等组成。',
    intendedUse: '用于对骨组织进行钻、切取、锯、磨、铣等。',
    matchKeywords: ['骨钻', '骨锯', '摆锯', '矢状锯', '开髓钻', '骨科动力'],
    defaultDepreciationYears: 8,
    defaultMaintenanceCycleMonths: 6,
    defaultMetrologyType: 'periodic_calibration',
    status: 'active'
  },

  // 05 放射治疗器械
  {
    id: 'CAT-05-01-01',
    categoryCode: '05',
    categoryName: '05 放射治疗器械',
    level1Code: '05-01',
    level1Name: '放射治疗设备',
    level2Code: '01',
    level2Name: '医用电子加速器',
    productExamples: ['医用电子直线加速器', '医用电子回旋加速器', '螺旋断层放射治疗系统(TOMO)'],
    riskClass: 'III类',
    description: '通常由机架、辐射头、治疗床、控制台、图像引导装置等组成。',
    intendedUse: '用于患者肿瘤或其他病灶的放射治疗。',
    matchKeywords: ['直线加速器', '放疗加速器', '电子加速器', 'TOMO', '射波刀', '瓦里安加速器'],
    defaultDepreciationYears: 10,
    defaultMaintenanceCycleMonths: 1,
    defaultMetrologyType: 'mandatory',
    status: 'active'
  },

  // 06 医用成像器械
  {
    id: 'CAT-06-01-01',
    categoryCode: '06',
    categoryName: '06 医用成像器械',
    level1Code: '06-01',
    level1Name: '诊断 X 射线机',
    level2Code: '01',
    level2Name: '血管造影 X 射线机 (DSA)',
    productExamples: ['血管造影X射线机', '数字减影血管造影机(DSA)', '平板DSA系统'],
    riskClass: 'III类',
    description: '通常由X射线发生装置、数字化影像接收装置、图像信息分析、显示系统和导管床组成。',
    intendedUse: '用于对心、脑血管和周围血管等进行造影检查和介入治疗时获得影像供临床诊断。',
    matchKeywords: ['DSA', '血管造影', '导管室DSA', '数字减影'],
    defaultDepreciationYears: 10,
    defaultMaintenanceCycleMonths: 3,
    defaultMetrologyType: 'mandatory',
    status: 'active'
  },
  {
    id: 'CAT-06-01-03',
    categoryCode: '06',
    categoryName: '06 医用成像器械',
    level1Code: '06-01',
    level1Name: '诊断 X 射线机',
    level2Code: '03',
    level2Name: '乳腺 X 射线机 (乳腺钼靶)',
    productExamples: ['数字乳腺X射线机', '数字化乳腺钼靶机', '乳腺三维断层摄影机'],
    riskClass: 'III类',
    description: '通常由机架、X射线发生装置、乳腺压迫器、影像接收装置组成。',
    intendedUse: '用于对人体乳腺组织摄影，获得影像供临床诊断用。',
    matchKeywords: ['乳腺机', '乳腺钼靶', '钼靶', '乳腺X线'],
    defaultDepreciationYears: 10,
    defaultMaintenanceCycleMonths: 6,
    defaultMetrologyType: 'mandatory',
    status: 'active'
  },
  {
    id: 'CAT-06-01-06',
    categoryCode: '06',
    categoryName: '06 医用成像器械',
    level1Code: '06-01',
    level1Name: '诊断 X 射线机',
    level2Code: '06',
    level2Name: '移动式 C 形臂 X 射线机',
    productExamples: ['移动式C形臂X射线机', '手术室C臂机', '三维小C臂', '中C臂'],
    riskClass: 'III类',
    description: '通常由移动式C形臂支架、X射线发生装置、数字平板探测器成像系统等组成。',
    intendedUse: '用于外科手术透视及摄影，获得影像供临床诊断用。',
    matchKeywords: ['C臂', 'C形臂', '移动C臂', '手术室C臂'],
    defaultDepreciationYears: 10,
    defaultMaintenanceCycleMonths: 6,
    defaultMetrologyType: 'mandatory',
    status: 'active'
  },
  {
    id: 'CAT-06-01-07',
    categoryCode: '06',
    categoryName: '06 医用成像器械',
    level1Code: '06-01',
    level1Name: '诊断 X 射线机',
    level2Code: '07',
    level2Name: '摄影 X 射线机 (DR)',
    productExamples: ['数字化医用X射线摄影系统(DR)', '悬吊DR', '双板DR', '移动DR'],
    riskClass: 'II类',
    description: '通常由X射线发生装置和摄影X射线附属设备组成。',
    intendedUse: '用于对患者的常规X射线摄影，获得单幅影像供临床诊断用。',
    matchKeywords: ['DR', 'X光机', '数字X射线', '拍片机', '放射科DR', '移动DR'],
    defaultDepreciationYears: 10,
    defaultMaintenanceCycleMonths: 6,
    defaultMetrologyType: 'mandatory',
    status: 'active'
  },
  {
    id: 'CAT-06-02-01',
    categoryCode: '06',
    categoryName: '06 医用成像器械',
    level1Code: '06-02',
    level1Name: 'X 射线计算机体层摄影设备 (CT)',
    level2Code: '01',
    level2Name: 'X 射线计算机体层摄影设备 (CT)',
    productExamples: ['64排CT机', '128层CT', '双源CT', '能谱CT', '螺旋CT扫描系统'],
    riskClass: 'III类',
    description: '通常由扫描架、X射线发生装置、探测器、图像处理系统和患者支撑装置组成。',
    intendedUse: '用于对从多方向穿过患者的X射线信号进行计算机处理，为诊断提供重建影像。',
    matchKeywords: ['CT', '计算机体层', '螺旋CT', '断层扫描', '64排CT', '128排CT'],
    defaultDepreciationYears: 10,
    defaultMaintenanceCycleMonths: 3,
    defaultMetrologyType: 'mandatory',
    status: 'active'
  },
  {
    id: 'CAT-06-07-02',
    categoryCode: '06',
    categoryName: '06 医用成像器械',
    level1Code: '06-07',
    level1Name: '超声影像诊断设备',
    level2Code: '02',
    level2Name: '彩色超声回波多普勒成像设备 (彩超)',
    productExamples: ['彩色多普勒超声诊断仪', '便携式彩超', '心脏彩超', '四维妇产彩超', '血管彩超'],
    riskClass: 'III类',
    description: '通常由探头、超声波发射/接收电路、信号处理和图像显示等组成，利用多普勒技术采集血流信息。',
    intendedUse: '用于超声成像、测量与血流运动信息采集供临床诊断检查。',
    matchKeywords: ['彩超', '超声诊断', '彩色多普勒', '超声仪', '便携彩超', '心脏超声'],
    defaultDepreciationYears: 8,
    defaultMaintenanceCycleMonths: 6,
    defaultMetrologyType: 'mandatory',
    status: 'active'
  },
  {
    id: 'CAT-06-09-03',
    categoryCode: '06',
    categoryName: '06 医用成像器械',
    level1Code: '06-09',
    level1Name: '磁共振成像设备 (MRI)',
    level2Code: '03',
    level2Name: '超导型磁共振成像系统 (MRI)',
    productExamples: ['1.5T超导磁共振成像系统', '3.0T磁共振成像系统', '医用磁共振设备'],
    riskClass: 'III类',
    description: '通常由超导型磁体、梯度系统、射频系统、射频线圈、谱仪、工作站和患者床组成。',
    intendedUse: '用于临床高分辨率软组织断层磁共振成像诊断。',
    matchKeywords: ['MRI', '磁共振', '核磁共振', '1.5T', '3.0T', '磁共振仪'],
    defaultDepreciationYears: 10,
    defaultMaintenanceCycleMonths: 3,
    defaultMetrologyType: 'mandatory',
    status: 'active'
  },
  {
    id: 'CAT-06-14-03',
    categoryCode: '06',
    categoryName: '06 医用成像器械',
    level1Code: '06-14',
    level1Name: '医用内窥镜',
    level2Code: '03',
    level2Name: '电子内窥镜',
    productExamples: ['电子胃镜', '电子结肠镜', '电子十二指肠镜', '电子腹腔镜', '电子支气管镜'],
    riskClass: 'III类',
    description: '通常由物镜系统、像阵面光电传感器、模数转换模块等组成，在监视器上输出高清晰度图像。',
    intendedUse: '通过创口或自然孔道进入人体内，用于腔道组织直视成像和诊断。',
    matchKeywords: ['胃镜', '肠镜', '电子内镜', '结肠镜', '支气管镜', '腹腔镜镜头'],
    defaultDepreciationYears: 6,
    defaultMaintenanceCycleMonths: 6,
    defaultMetrologyType: 'periodic_calibration',
    status: 'active'
  },

  // 07 医用诊察和监护器械
  {
    id: 'CAT-07-03-01',
    categoryCode: '07',
    categoryName: '07 医用诊察和监护器械',
    level1Code: '07-03',
    level1Name: '生理参数分析测量设备',
    level2Code: '01',
    level2Name: '心电测量、分析设备 (心电图机)',
    productExamples: ['十二导联同步心电图机', '单道心电图机', '动态心电记录仪(Holter)', '心电工作站'],
    riskClass: 'II类',
    description: '通过体表电极检测心电信号，经滤波、放大、模数转化形成波形供临床诊断。',
    intendedUse: '用于测量、采集、显示、记录患者心电信号，提供自动形态和节律分析。',
    matchKeywords: ['心电图机', '心电图', '十二导心电', '动态心电', 'Holter', '心电分析'],
    defaultDepreciationYears: 8,
    defaultMaintenanceCycleMonths: 6,
    defaultMetrologyType: 'mandatory',
    status: 'active'
  },
  {
    id: 'CAT-07-03-03',
    categoryCode: '07',
    categoryName: '07 医用诊察和监护器械',
    level1Code: '07-03',
    level1Name: '生理参数分析测量设备',
    level2Code: '03',
    level2Name: '无创血压测量设备 (血压计)',
    productExamples: ['医用电子血压计', '台式水银血压计', '动态血压监测仪(ABPM)'],
    riskClass: 'II类',
    description: '通过阻塞袖带和压力传感器，采用示波法或柯式音法测量血压。',
    intendedUse: '用于在手臂或手腕部位测量患者收缩压、舒张压与脉搏。',
    matchKeywords: ['血压计', '电子血压计', '水银血压计', '动态血压', '血压仪'],
    defaultDepreciationYears: 5,
    defaultMaintenanceCycleMonths: 6,
    defaultMetrologyType: 'mandatory',
    status: 'active'
  },
  {
    id: 'CAT-07-04-01',
    categoryCode: '07',
    categoryName: '07 医用诊察和监护器械',
    level1Code: '07-04',
    level1Name: '监护设备',
    level2Code: '01',
    level2Name: '病人监护设备 (多参数监护仪)',
    productExamples: ['多参数病人监护仪', '床旁监护仪', 'ICU重症监护仪', '转运监护仪'],
    riskClass: 'III类',
    description: '从单一患者处采集心电、血压、血氧、呼吸、体温等多生理参数并报警。',
    intendedUse: '用于对病区或危重症患者连续实时监护生命体征。',
    matchKeywords: ['监护仪', '多参数监护', '床旁监护', 'ICU监护仪', '生命体征监护'],
    defaultDepreciationYears: 8,
    defaultMaintenanceCycleMonths: 6,
    defaultMetrologyType: 'periodic_calibration',
    status: 'active'
  },

  // 08 呼吸、麻醉和急救器械
  {
    id: 'CAT-08-01-01',
    categoryCode: '08',
    categoryName: '08 呼吸、麻醉和急救器械',
    level1Code: '08-01',
    level1Name: '呼吸设备',
    level2Code: '01',
    level2Name: '治疗呼吸机 (生命支持)',
    productExamples: ['重症有创呼吸机', '无创呼吸机', '高频振荡呼吸机', '院内转运呼吸机'],
    riskClass: 'III类',
    description: '为增加或供给患者通气而设计的自动机械通气装置。',
    intendedUse: '用于呼吸衰竭或呼吸暂停患者的长时间呼吸支持与通气管理。',
    matchKeywords: ['呼吸机', '有创呼吸机', '无创呼吸机', '转运呼吸机', 'PB840', '迈瑞呼吸机'],
    defaultDepreciationYears: 8,
    defaultMaintenanceCycleMonths: 3,
    defaultMetrologyType: 'periodic_calibration',
    status: 'active'
  },
  {
    id: 'CAT-08-02-01',
    categoryCode: '08',
    categoryName: '08 呼吸、麻醉和急救器械',
    level1Code: '08-02',
    level1Name: '麻醉器械',
    level2Code: '01',
    level2Name: '麻醉机 / 麻醉工作站',
    productExamples: ['全能麻醉机', '麻醉工作站', '便携式麻醉机', '吸入麻醉机'],
    riskClass: 'III类',
    description: '由供气系统、流量控制、蒸发器和呼吸回路组成，配有麻醉呼吸机与气体监测。',
    intendedUse: '用于手术中患者吸入麻醉、呼吸控制及通气监测。',
    matchKeywords: ['麻醉机', '麻醉工作站', '吸入麻醉', '德尔格麻醉机'],
    defaultDepreciationYears: 8,
    defaultMaintenanceCycleMonths: 3,
    defaultMetrologyType: 'periodic_calibration',
    status: 'active'
  },
  {
    id: 'CAT-08-03-01',
    categoryCode: '08',
    categoryName: '08 呼吸、麻醉和急救器械',
    level1Code: '08-03',
    level1Name: '急救设备',
    level2Code: '01',
    level2Name: '体外除颤设备 (除颤仪 / AED)',
    productExamples: ['双相波除颤监护仪', '自动体外除颤器(AED)', '除颤起搏监护仪'],
    riskClass: 'III类',
    description: '通过体外电极将电脉冲施加在患者皮肤，实现心脏除颤与复律。',
    intendedUse: '用于心室颤动、室性心动过速等致命性心律失常患者的紧急抢救。',
    matchKeywords: ['除颤仪', '除颤监护仪', 'AED', '自动体外除颤', '除颤起搏'],
    defaultDepreciationYears: 8,
    defaultMaintenanceCycleMonths: 3,
    defaultMetrologyType: 'periodic_calibration',
    status: 'active'
  },
  {
    id: 'CAT-08-03-02',
    categoryCode: '08',
    categoryName: '08 呼吸、麻醉和急救器械',
    level1Code: '08-03',
    level1Name: '急救设备',
    level2Code: '02',
    level2Name: '婴儿培养箱 / 辐射保暖台',
    productExamples: ['婴儿培养箱', '婴儿转运温箱', '新生儿辐射保暖台'],
    riskClass: 'III类',
    description: '提供温湿度适宜的洁净微环境，用于新生儿恒温培养与抢救。',
    intendedUse: '用于早产儿、低体重儿的保暖、监护与危重救治。',
    matchKeywords: ['婴儿培养箱', '婴儿温箱', '保暖台', '新生儿温箱', '辐射保暖台'],
    defaultDepreciationYears: 8,
    defaultMaintenanceCycleMonths: 6,
    defaultMetrologyType: 'mandatory',
    status: 'active'
  },

  // 10 输血、透析和体外循环器械
  {
    id: 'CAT-10-03-01',
    categoryCode: '10',
    categoryName: '10 输血、透析和体外循环器械',
    level1Code: '10-03',
    level1Name: '血液净化及腹膜透析设备',
    level2Code: '01',
    level2Name: '血液透析设备 / CRRT机',
    productExamples: ['血液透析机', '血液透析滤过机', '连续性血液净化装置(CRRT)'],
    riskClass: 'III类',
    description: '利用半透膜弥散与超滤对流原理，清除患者体内毒素和过多水分。',
    intendedUse: '用于慢性肾衰竭、尿毒症及急性中毒患者的体外血液净化治疗。',
    matchKeywords: ['血液透析机', '血透机', 'CRRT', '连续性血液净化', '透析滤过机'],
    defaultDepreciationYears: 8,
    defaultMaintenanceCycleMonths: 3,
    defaultMetrologyType: 'periodic_calibration',
    status: 'active'
  },

  // 11 医疗器械消毒灭菌器械
  {
    id: 'CAT-11-01-03',
    categoryCode: '11',
    categoryName: '11 医疗器械消毒灭菌器械',
    level1Code: '11-01',
    level1Name: '湿热消毒灭菌设备',
    level2Code: '03',
    level2Name: '压力蒸汽灭菌器',
    productExamples: ['大型脉动真空压力蒸汽灭菌器', '台式卡式灭菌器', '立式压力蒸汽灭菌锅'],
    riskClass: 'II类',
    description: '利用高温饱和水蒸汽破坏微生物蛋白质，实现医疗器械高效灭菌。',
    intendedUse: '用于耐湿耐热手术器械、敷料、玻璃器皿等的灭菌。',
    matchKeywords: ['压力蒸汽灭菌器', '高温高压灭菌', '脉动真空灭菌器', '高压灭菌锅', '消毒锅'],
    defaultDepreciationYears: 10,
    defaultMaintenanceCycleMonths: 6,
    defaultMetrologyType: 'mandatory',
    status: 'active'
  },
  {
    id: 'CAT-11-03-05',
    categoryCode: '11',
    categoryName: '11 医疗器械消毒灭菌器械',
    level1Code: '11-03',
    level1Name: '化学消毒灭菌设备',
    level2Code: '05',
    level2Name: '过氧化氢低温等离子灭菌器',
    productExamples: ['过氧化氢低温等离子体灭菌器', '低温等离子灭菌机'],
    riskClass: 'II类',
    description: '通过汽化过氧化氢与等离子体结合，在低温下完成不耐热器械灭菌。',
    intendedUse: '用于腔镜、光学仪器、电子线缆等不耐湿热器械的灭菌。',
    matchKeywords: ['等离子灭菌器', '过氧化氢灭菌', '低温灭菌器'],
    defaultDepreciationYears: 8,
    defaultMaintenanceCycleMonths: 6,
    defaultMetrologyType: 'periodic_calibration',
    status: 'active'
  },

  // 14 注输、护理和防护器械
  {
    id: 'CAT-14-01-01',
    categoryCode: '14',
    categoryName: '14 注输、护理和防护器械',
    level1Code: '14-01',
    level1Name: '注射、穿刺器械',
    level2Code: '01',
    level2Name: '微量注射泵 / 镇痛泵',
    productExamples: ['微量注射泵', '双道注射泵', '靶控注射泵(TCI)', '患者自控镇痛泵(PCA)'],
    riskClass: 'II类',
    description: '通过机械传动精准推注注射器活塞，实现微量药液恒速输注。',
    intendedUse: '用于重症、麻醉、心血管病房中精确控制血管活性药物输注。',
    matchKeywords: ['微量泵', '注射泵', '微量注射泵', '双道泵', '镇痛泵'],
    defaultDepreciationYears: 6,
    defaultMaintenanceCycleMonths: 6,
    defaultMetrologyType: 'periodic_calibration',
    status: 'active'
  },
  {
    id: 'CAT-14-02-01',
    categoryCode: '14',
    categoryName: '14 注输、护理和防护器械',
    level1Code: '14-02',
    level1Name: '血管内输液器械',
    level2Code: '01',
    level2Name: '输液泵',
    productExamples: ['医用输液泵', '容积式输液泵', '智能输液泵'],
    riskClass: 'II类',
    description: '通过蠕动指压泵体控制输液管路滴速，实现药液均匀持续输注。',
    intendedUse: '用于需要严格控制输液速度与总量的临床补液治疗。',
    matchKeywords: ['输液泵', '恒速输液泵', '容积泵', '智能输液泵'],
    defaultDepreciationYears: 6,
    defaultMaintenanceCycleMonths: 6,
    defaultMetrologyType: 'periodic_calibration',
    status: 'active'
  },

  // 15 患者承载器械
  {
    id: 'CAT-15-01-01',
    categoryCode: '15',
    categoryName: '15 患者承载器械',
    level1Code: '15-01',
    level1Name: '手术台',
    level2Code: '01',
    level2Name: '电动综合手术床',
    productExamples: ['电动综合手术床', '电动液压手术台', '碳纤维骨科透视手术台'],
    riskClass: 'II类',
    description: '多体位电动液压升降调节手术床台。',
    intendedUse: '用于外科手术中承载患者并实现屈曲、倾斜、平移等手术体位调整。',
    matchKeywords: ['手术床', '手术台', '电动手术床', '液压手术台'],
    defaultDepreciationYears: 10,
    defaultMaintenanceCycleMonths: 12,
    defaultMetrologyType: 'exempt',
    status: 'active'
  },
  {
    id: 'CAT-15-03-01',
    categoryCode: '15',
    categoryName: '15 患者承载器械',
    level1Code: '15-03',
    level1Name: '医用病床',
    level2Code: '01',
    level2Name: '电动多功能病床 / ICU病床',
    productExamples: ['电动多功能病床', 'ICU五功能电动床', '称重病床'],
    riskClass: 'II类',
    description: '具备电动背板、腿板升降、整床高低调节及CPR快速释放功能的病床。',
    intendedUse: '用于病房及ICU中支撑患者身体并协助护理。',
    matchKeywords: ['电动病床', 'ICU病床', '多功能病床', '医用病床'],
    defaultDepreciationYears: 8,
    defaultMaintenanceCycleMonths: 12,
    defaultMetrologyType: 'exempt',
    status: 'active'
  },

  // 17 口腔科器械
  {
    id: 'CAT-17-03-01',
    categoryCode: '17',
    categoryName: '17 口腔科器械',
    level1Code: '17-03',
    level1Name: '口腔治疗设备',
    level2Code: '01',
    level2Name: '牙科综合治疗机 (牙椅)',
    productExamples: ['牙科综合治疗台', '口腔综合治疗椅', '连体式牙科治疗机'],
    riskClass: 'II类',
    description: '集成口腔灯、高速/低速手机、三用枪、吸唾器、漱口供水装置的一体化设备。',
    intendedUse: '用于口腔科门诊检查、洁牙、补牙及拔牙等诊疗操作。',
    matchKeywords: ['牙椅', '牙科治疗台', '口腔综合治疗机', '牙科机'],
    defaultDepreciationYears: 8,
    defaultMaintenanceCycleMonths: 6,
    defaultMetrologyType: 'periodic_calibration',
    status: 'active'
  },

  // 21 医用软件
  {
    id: 'CAT-21-02-01',
    categoryCode: '21',
    categoryName: '21 医用软件',
    level1Code: '21-02',
    level1Name: '影像处理软件',
    level2Code: '01',
    level2Name: '医学影像存储与传输系统软件 (PACS)',
    productExamples: ['PACS系统软件', '医学影像归档与通信系统', '三维影像后处理工作站软件'],
    riskClass: 'II类',
    description: '接收、存储、传输、显示和管理DICOM医学影像的独立软件系统。',
    intendedUse: '用于医疗机构各科室之间医学影像的调阅、测量与辅助诊断。',
    matchKeywords: ['PACS', '影像系统', '三维后处理', '影像归档', 'DICOM'],
    defaultDepreciationYears: 5,
    defaultMaintenanceCycleMonths: 12,
    defaultMetrologyType: 'exempt',
    status: 'active'
  },

  // 22 临床检验器械
  {
    id: 'CAT-22-01-02',
    categoryCode: '22',
    categoryName: '22 临床检验器械',
    level1Code: '22-01',
    level1Name: '血液学分析设备',
    level2Code: '02',
    level2Name: '全自动血细胞分析仪 (五分类血常规)',
    productExamples: ['全自动五分类血细胞分析仪', '血球计数仪', '全自动血液体液分析仪'],
    riskClass: 'II类',
    description: '采用流式激光散射与电阻抗技术，对全血中白细胞五分类、红细胞及血小板进行定量分析。',
    intendedUse: '用于临床血常规检验及细胞分类计数。',
    matchKeywords: ['血细胞分析仪', '血球仪', '五分类', '全血分析仪', '血常规仪'],
    defaultDepreciationYears: 8,
    defaultMaintenanceCycleMonths: 6,
    defaultMetrologyType: 'periodic_calibration',
    status: 'active'
  },
  {
    id: 'CAT-22-02-01',
    categoryCode: '22',
    categoryName: '22 临床检验器械',
    level1Code: '22-02',
    level1Name: '生化分析设备',
    level2Code: '01',
    level2Name: '全自动生化分析仪',
    productExamples: ['全自动生化分析仪', '干式生化分析仪', '急诊生化分析系统'],
    riskClass: 'II类',
    description: '基于比色分光光度法与离子选择电极法，自动化分析血清/血浆中肝肾功能、心肌酶、电解质等生化指标。',
    intendedUse: '用于临床生化标本的大通量定量检测。',
    matchKeywords: ['生化仪', '生化分析仪', '全自动生化', '肝肾功检测仪'],
    defaultDepreciationYears: 8,
    defaultMaintenanceCycleMonths: 6,
    defaultMetrologyType: 'periodic_calibration',
    status: 'active'
  },
  {
    id: 'CAT-22-04-02',
    categoryCode: '22',
    categoryName: '22 临床检验器械',
    level1Code: '22-04',
    level1Name: '免疫分析设备',
    level2Code: '02',
    level2Name: '全自动化学发光免疫分析仪',
    productExamples: ['全自动化学发光免疫分析仪', '电化学发光分析仪', '磁微粒化学发光测定仪'],
    riskClass: 'II类',
    description: '利用化学发光或电化学发光标记物进行高灵敏度抗原抗体免疫反应检测。',
    intendedUse: '用于肿瘤标志物、甲状腺激素、传染病、心肌标志物等定量检测。',
    matchKeywords: ['化学发光', '发光仪', '免疫分析仪', '电化学发光', '磁微粒发光'],
    defaultDepreciationYears: 8,
    defaultMaintenanceCycleMonths: 6,
    defaultMetrologyType: 'periodic_calibration',
    status: 'active'
  },
  {
    id: 'CAT-22-05-03',
    categoryCode: '22',
    categoryName: '22 临床检验器械',
    level1Code: '22-05',
    level1Name: '分子生物学分析设备',
    level2Code: '03',
    level2Name: '实时荧光定量 PCR 仪',
    productExamples: ['实时荧光定量PCR仪', '全自动核酸扩增分析系统', '恒温荧光PCR仪'],
    riskClass: 'III类',
    description: '通过精密热循环与荧光检测系统，实时监测靶基因扩增产物。',
    intendedUse: '用于病毒核酸检测、基因突变及病原体分子诊断。',
    matchKeywords: ['PCR', '核酸扩增', '荧光PCR', '基因扩增仪', '定量PCR'],
    defaultDepreciationYears: 8,
    defaultMaintenanceCycleMonths: 6,
    defaultMetrologyType: 'mandatory',
    status: 'active'
  }
];

/**
 * 根据设备名称/型号智能推导最佳匹配的 NMPA 分类主数据
 */
export function matchEquipmentToNmpaCategory(
  name: string,
  model: string = '',
  catalogue: NmpaCategoryMasterItem[] = DEFAULT_NMPA_CATEGORY_MASTER
): {
  matchedItem: NmpaCategoryMasterItem | null;
  score: number;
  reason: string;
} {
  const target = `${name} ${model}`.toLowerCase();
  let bestItem: NmpaCategoryMasterItem | null = null;
  let highestScore = 0;
  let bestReason = '';

  for (const item of catalogue) {
    let score = 0;
    const hitKeywords: string[] = [];

    for (const kw of item.matchKeywords) {
      if (target.includes(kw.toLowerCase())) {
        score += kw.length * 5;
        hitKeywords.push(kw);
      }
    }

    if (target.includes(item.level2Name.toLowerCase())) {
      score += 20;
      hitKeywords.push(item.level2Name);
    }

    for (const ex of item.productExamples) {
      if (target.includes(ex.toLowerCase())) {
        score += 15;
        hitKeywords.push(ex);
      }
    }

    if (score > highestScore) {
      highestScore = score;
      bestItem = item;
      bestReason = `命中标准产品关键词【${hitKeywords.join(', ')}】`;
    }
  }

  if (highestScore >= 10 && bestItem) {
    return {
      matchedItem: bestItem,
      score: highestScore,
      reason: bestReason
    };
  }

  return {
    matchedItem: null,
    score: 0,
    reason: '未找到明确标准分类'
  };
}

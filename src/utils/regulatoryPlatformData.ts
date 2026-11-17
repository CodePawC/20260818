import { RegulatoryPlatform, RegulatoryDocument, PlatformAccessLog } from '../types/regulatoryPlatformTypes';

export const INITIAL_REGULATORY_PLATFORMS: RegulatoryPlatform[] = [
  {
    id: 1,
    superiorMinistry: '中华人民共和国生态环境部',
    affiliationRelation: '同一部门',
    managingAuthority: '中华人民共和国生态环境部',
    platformName: '全国核技术利用辐射安全申报系统',
    username: 'cuiwei',
    password: 'Qmie!@12',
    url: 'http://rr.mee.gov.cn/rsmsreq/login.jsp',
    remarks: '放射源转移纸质材料邮寄：济南市市中区站前路9号山东省政务服务中心三楼C10窗口 收件人 C10窗口 0531 82083225 0531 68966231',
    category: 'radiation',
    systemLevel: '国家级',
    lastLoginDate: '2026-11-02',
    totalLogins: 42,
    docCount: 8
  },
  {
    id: 2,
    superiorMinistry: '中华人民共和国生态环境部',
    affiliationRelation: '同一部门',
    managingAuthority: '中华人民共和国生态环境部',
    platformName: '建设项目环境影响登记表备案系统',
    username: 'wlxrmyy',
    password: 'qmie369&&17',
    url: 'https://beian.china-eia.com/a/login',
    remarks: '医院改扩建、放射诊疗机房新建改造环境影响评价登记备案，生成全国统一备案号',
    category: 'environmental',
    systemLevel: '国家级',
    lastLoginDate: '2026-10-18',
    totalLogins: 19,
    docCount: 5
  },
  {
    id: 3,
    superiorMinistry: '中华人民共和国生态环境部',
    affiliationRelation: '直属',
    managingAuthority: '生态环境部核与辐射安全中心',
    platformName: '国家辐射安全教育平台',
    username: '医院管理员统一开户',
    password: '（学员自主登录考核）',
    url: 'http://fushe.mee.gov.cn/index.php/campus/',
    remarks: '医院放射工作人员辐射安全与防护法规培训、上岗前考核及每两年定期复训发证平台',
    category: 'radiation',
    systemLevel: '国家级',
    lastLoginDate: '2026-10-25',
    totalLogins: 68,
    docCount: 3
  },
  {
    id: 4,
    superiorMinistry: '国家市场监督管理总局',
    affiliationRelation: '隶属',
    managingAuthority: '山东省市场监督管理局',
    platformName: '山东省特种设备企业端管理平台',
    username: '12371121494574329G',
    password: 'a1586599&&17',
    url: 'http://218.57.139.17:9070/QYSE/',
    remarks: '医院统一社会信用代码登录。高压蒸汽灭菌器、医用氧舱、乘客电梯、压力管道等特种设备使用登记与年度自查上报',
    category: 'special_equipment',
    systemLevel: '省级',
    lastLoginDate: '2026-11-05',
    totalLogins: 54,
    docCount: 12
  },
  {
    id: 5,
    superiorMinistry: '山东省市场监督管理局',
    affiliationRelation: '下辖指导',
    managingAuthority: '日照市市场监督管理局',
    platformName: '日照特种设备服务平台（企业）',
    username: 'wlxrmyy',
    password: 'wlxrmyy7717.',
    url: 'http://58.59.43.19:9080/RzBigData/index/index!index.action',
    remarks: '市级特种设备大数据服务，用于属地市场监管局日常安全检查、隐患排查治理及汛期特种设备安全防范上报',
    category: 'special_equipment',
    systemLevel: '市级',
    lastLoginDate: '2026-10-29',
    totalLogins: 28,
    docCount: 4
  },
  {
    id: 6,
    superiorMinistry: '国家市场监督管理总局',
    affiliationRelation: '直属业务',
    managingAuthority: '国家药品监督管理局/药品评价中心',
    platformName: '国家医疗器械不良事件监测信息系统',
    username: 'cuiwei',
    password: 'Qmie369&&17',
    url: 'https://maers.adrs.org.cn/console/login.ftl',
    remarks: '医疗器械使用单位法定义务平台。监测上报高风险医疗器械可疑不良事件，月度零报告与突发事件24小时直报',
    category: 'medical_device',
    systemLevel: '国家级',
    lastLoginDate: '2026-11-08',
    totalLogins: 86,
    docCount: 16
  },
  {
    id: 7,
    superiorMinistry: '国家卫生健康委员会',
    affiliationRelation: '直属指导',
    managingAuthority: '国家疾控局/职业健康司',
    platformName: '职业病危害申报系统',
    username: 'z15074482',
    password: 'Wlxrmyy494574329',
    url: 'https://www.zybwhsb.com/',
    remarks: '放射性职业病危害（CT室、介入导管室、核医学科、牙片机房）及化学毒物危害因素申报、年度危害申报回执归档',
    category: 'occupational_health',
    systemLevel: '国家级',
    lastLoginDate: '2026-10-15',
    totalLogins: 14,
    docCount: 6
  },
  {
    id: 8,
    superiorMinistry: '国家卫生健康委员会',
    affiliationRelation: '直属',
    managingAuthority: '山东省卫生健康委员会',
    platformName: '山东省大型医用设备综合监管平台',
    username: '12371121494574329G',
    password: 'Wlwlxrmyy_20210419',
    url: 'http://60.216.53.86:81/login.aspx',
    remarks: '医院统一社会信用代码登录。CT、1.5T/3.0T磁共振(MRI)、医用直线加速器、DSA等乙类大型医用设备配置许可证申请与月度利用效率报送',
    category: 'medical_device',
    systemLevel: '省级',
    lastLoginDate: '2026-11-06',
    totalLogins: 47,
    docCount: 9
  },
  {
    id: 9,
    superiorMinistry: '山东省市场监督管理局',
    affiliationRelation: '直属事业单位',
    managingAuthority: '山东省特种设备检验研究院',
    platformName: '山东特种设备检验业务网上服务平台',
    username: '15865997717',
    password: 'syqy@15865997717',
    url: 'https://bj.sei.sd.cn/#/user/login?redirect=%2F',
    remarks: '氧舱报检、压力容器定检、压力管道定检申请，在线下载检验报告及电子特种设备使用标志',
    category: 'special_equipment',
    systemLevel: '省级',
    lastLoginDate: '2026-11-04',
    totalLogins: 36,
    docCount: 15
  },
  {
    id: 10,
    superiorMinistry: '国家市场监督管理总局',
    affiliationRelation: '直属业务',
    managingAuthority: '中国电子质量监督公共服务门户',
    platformName: '中国电子质量监督(e-CQS)公共服务门户',
    username: 'wlxrmyy',
    password: 'Wlxrmyy12345-',
    url: 'http://psp.e-cqs.cn/egov/shIndex.html?ysp=1',
    remarks: '全国国家法定强制检定工作计量器具业务管理系统。心电图机、多参数监护仪、脑电图机、放射治疗机、超声诊断仪强检预约与合格证书下载',
    category: 'metrology',
    systemLevel: '国家级',
    lastLoginDate: '2026-10-22',
    totalLogins: 52,
    docCount: 22
  },
  {
    id: 11,
    superiorMinistry: '中华人民共和国生态环境部',
    affiliationRelation: '同一部门',
    managingAuthority: '中华人民共和国生态环境部',
    platformName: '全国建设项目竣工环境保护验收信息系统',
    username: '12371121494574329G',
    password: '494574329G.',
    url: 'https://cepc.lem.org.cn/',
    remarks: '2024年DSA和加速器环评验收时注册，环评验收用。放射诊疗机房新建扩建工程竣工环保自主验收信息公示与向生态环保部门报备',
    category: 'environmental',
    systemLevel: '国家级',
    lastLoginDate: '2026-09-30',
    totalLogins: 11,
    docCount: 7
  },
  {
    id: 12,
    superiorMinistry: '国家市场监督管理总局',
    affiliationRelation: '隶属',
    managingAuthority: '日照市市场监督管理局',
    platformName: '安全阀数智化监管平台',
    username: '15865997717',
    password: 'Wlrmyy@202511',
    url: 'http://113.128.210.190:83/safetyvalve/dashboard/console',
    remarks: '医用氧气储罐安全阀、蒸汽管道安全阀、高压消毒锅安全阀在线送检委托、校验二维码生成及电子校验报告查验',
    category: 'special_equipment',
    systemLevel: '市级',
    lastLoginDate: '2026-11-09',
    totalLogins: 24,
    docCount: 18
  },
  {
    id: 13,
    superiorMinistry: '国家市场监督管理总局',
    affiliationRelation: '隶属',
    managingAuthority: '山东省市场监督管理局 / 山东特检院',
    platformName: '山东省特种设备综合检验与监管平台',
    username: '12371121494574329G',
    password: 'a1586599&&17',
    url: 'https://tzsb.amr.shandong.gov.cn:1443/login?redirect=/dashboard/jydw/index',
    remarks: '全省特种设备检验单位与使用单位协同监管专网，包含定期检验计划比对、监察指令书网上签收及整改闭环反馈',
    category: 'special_equipment',
    systemLevel: '省级',
    lastLoginDate: '2026-10-31',
    totalLogins: 33,
    docCount: 10
  }
];

export const INITIAL_REGULATORY_DOCS: RegulatoryDocument[] = [
  {
    id: 'DOC-2026-001',
    platformId: 1,
    platformName: '全国核技术利用辐射安全申报系统',
    managingAuthority: '中华人民共和国生态环境部',
    docTitle: '辐射安全许可证（正本及副本变更备案表）',
    docNumber: '鲁环辐证[2024]第0219号',
    docCategory: '许可证照',
    issueDate: '2024-06-15',
    expiryDate: '2029-06-14',
    fileType: 'pdf',
    fileSize: '4.8 MB',
    uploader: '崔伟',
    uploadDate: '2024-06-20',
    summary: '涵盖医院DSA介入导管室、医用直线加速器机房、CT机房及放射科DR摄片机。包含辐射工作场所等级与放射源同位素转让核准。',
    tags: ['辐射安全', '生态环境部', 'DSA', '直线加速器']
  },
  {
    id: 'DOC-2026-002',
    platformId: 11,
    platformName: '全国建设项目竣工环境保护验收信息系统',
    managingAuthority: '中华人民共和国生态环境部',
    docTitle: '2024年度新门诊综合楼DSA及医用直线加速器建设项目竣工环保验收意见',
    docNumber: '验收备[2024]第088号',
    docCategory: '批复批文',
    issueDate: '2024-11-20',
    expiryDate: '长期有效',
    fileType: 'pdf',
    fileSize: '12.4 MB',
    uploader: '崔伟',
    uploadDate: '2024-11-22',
    summary: '专家组对DSA与医用直线加速器机房电离辐射屏蔽效能、周围辐射环境剂量率检测及应急防护措施的竣工环保验收合格意见。',
    tags: ['竣工验收', '环评验收', '加速器', 'DSA']
  },
  {
    id: 'DOC-2026-003',
    platformId: 8,
    platformName: '山东省大型医用设备综合监管平台',
    managingAuthority: '山东省卫生健康委员会',
    docTitle: '中华人民共和国乙类大型医用设备配置许可证（3.0T MRI与超高端CT）',
    docNumber: '鲁卫大设字[2023]第0047号',
    docCategory: '许可证照',
    issueDate: '2023-09-10',
    expiryDate: '2028-09-09',
    fileType: 'pdf',
    fileSize: '3.6 MB',
    uploader: '医学工程科',
    uploadDate: '2023-09-15',
    summary: '山东省卫健委核发的大型医用设备阶梯配置许可证，核准配置3.0T磁共振与256排超高端CT各1台。',
    tags: ['大型医用设备', '卫健委', 'MRI', 'CT配置许可']
  },
  {
    id: 'DOC-2026-004',
    platformId: 10,
    platformName: '中国电子质量监督(e-CQS)公共服务门户',
    managingAuthority: '国家市场监督管理总局计量司',
    docTitle: '国家法定计量检定机构强检工作计量器具检定证书汇总（2026年度）',
    docNumber: '检字(鲁量)2026-QJ03982',
    docCategory: '检验报告',
    issueDate: '2026-04-12',
    expiryDate: '2027-04-11',
    fileType: 'pdf',
    fileSize: '8.2 MB',
    uploader: '计量管理员',
    uploadDate: '2026-04-15',
    summary: '涵盖全院急救类生命支持类监护仪、除颤仪、心电图机及高频电刀的强制检定合格凭证，并在e-CQS系统完成核销备案。',
    tags: ['e-CQS', '强检证书', '计量器具', '市场监管总局']
  },
  {
    id: 'DOC-2026-005',
    platformId: 9,
    platformName: '山东特种设备检验业务网上服务平台',
    managingAuthority: '山东省特种设备检验研究院',
    docTitle: '高压医用氧舱定期检验报告与使用标志电子凭证',
    docNumber: '鲁特检(容)2026-01584',
    docCategory: '检验报告',
    issueDate: '2026-05-18',
    expiryDate: '2027-05-17',
    fileType: 'pdf',
    fileSize: '5.1 MB',
    uploader: '崔伟',
    uploadDate: '2026-05-20',
    summary: '山东特检院对医院多人医用空气加压氧舱的罐体壁厚、安全联锁装置、供排氧管路气密性及配电系统的定期法定检验报告。',
    tags: ['特检院', '高压氧舱', '特种设备', '检验报告']
  },
  {
    id: 'DOC-2026-006',
    platformId: 12,
    platformName: '安全阀数智化监管平台',
    managingAuthority: '日照市市场监督管理局',
    docTitle: '中心供氧储罐与高压灭菌蒸汽管路安全阀校验报告（附数智化二维码）',
    docNumber: '日特安校[2026]第0521号',
    docCategory: '检验报告',
    issueDate: '2026-07-08',
    expiryDate: '2027-07-07',
    fileType: 'pdf',
    fileSize: '2.9 MB',
    uploader: '设备科',
    uploadDate: '2026-07-10',
    summary: '日照市特种设备检验所对液氧储罐安全阀（开启压力1.65MPa）及供应室灭菌器安全阀的整定压力和密封性校验合格报告。',
    tags: ['安全阀', '日照市监局', '数智化监管', '整定压力']
  },
  {
    id: 'DOC-2026-007',
    platformId: 6,
    platformName: '国家医疗器械不良事件监测信息系统',
    managingAuthority: '国家药品监督管理局/药品评价中心',
    docTitle: '2026年第三季度医疗器械不良事件监测例行自查与评价报告',
    docNumber: 'MDR-REP-2026-Q3-01',
    docCategory: '备案凭证',
    issueDate: '2026-10-10',
    fileType: 'doc',
    fileSize: '1.4 MB',
    uploader: '崔伟',
    uploadDate: '2026-10-10',
    summary: '完成全院第三季度三类植入性器械与高风险生命支持设备不良事件监测数据自查，系统平台回执审核通过。',
    tags: ['不良事件', 'MDR', '药监局', '季度自查']
  },
  {
    id: 'DOC-2026-008',
    platformId: 7,
    platformName: '职业病危害申报系统',
    managingAuthority: '国家疾控局/职业健康司',
    docTitle: '放射性职业病危害项目申报回执及危害因素定期检测评价',
    docNumber: '鲁卫职申备[2025]0188号',
    docCategory: '备案凭证',
    issueDate: '2025-12-05',
    expiryDate: '2026-12-04',
    fileType: 'pdf',
    fileSize: '4.2 MB',
    uploader: '院感办/设备科',
    uploadDate: '2025-12-10',
    summary: '依法申报放射线（X射线、γ射线）、麻醉废气等重点职业病危害作业场所岗位名单与个人剂量计检测汇总。',
    tags: ['职业病危害', '国家卫健委', '疾控局', '放射卫生']
  }
];

export const INITIAL_ACCESS_LOGS: PlatformAccessLog[] = [
  {
    id: 'LOG-2026-1109-01',
    platformId: 12,
    platformName: '安全阀数智化监管平台',
    accessTime: '2026-11-09 14:35',
    operator: '崔伟',
    department: '医学工程科',
    actionType: '报检预约',
    businessSummary: '录入新采购制氧机组伴随的2只高压安全阀铭牌信息与出厂合格证，在线提交日照市特检所校验预约申请。',
    resultReceiptNo: 'AQF-RZ-20261109-0042',
    status: '办理完成',
    nextFollowUpDate: '2026-11-16',
    remarks: '已生成日照市特种设备数智二维码，贴附于安全阀阀体。'
  },
  {
    id: 'LOG-2026-1108-01',
    platformId: 6,
    platformName: '国家医疗器械不良事件监测信息系统',
    accessTime: '2026-11-08 09:20',
    operator: '崔伟',
    department: '医学工程科/不良事件监测专员',
    actionType: '例行申报',
    businessSummary: '登录国家药监局MDR系统完成2026年10月份医疗器械不良事件月度例行巡查与零报告报送。',
    resultReceiptNo: 'MDR-SUB-20261108-8831',
    status: '办理完成',
    nextFollowUpDate: '2026-12-05',
    remarks: '系统自动生成月度回执，未见突发严重不良事件。'
  },
  {
    id: 'LOG-2026-1106-01',
    platformId: 8,
    platformName: '山东省大型医用设备综合监管平台',
    accessTime: '2026-11-06 16:10',
    operator: '李工',
    department: '医学工程科',
    actionType: '定期自查',
    businessSummary: '报送2026年10月份CT与3.0T磁共振的开机运行时长、检查人次数及阳性率统计数据，更新设备台账。',
    resultReceiptNo: 'SDE-REG-20261106-192',
    status: '办理完成',
    nextFollowUpDate: '2026-12-05',
    remarks: '数据与医院PACS/RIS系统对接核对无误。'
  },
  {
    id: 'LOG-2026-1105-01',
    platformId: 4,
    platformName: '山东省特种设备企业端管理平台',
    accessTime: '2026-11-05 10:45',
    operator: '崔伟',
    department: '医学工程科',
    actionType: '年度校验',
    businessSummary: '核对全院18台乘客及医用病床电梯的定期检验合格标志电子证照，更新电梯维保单位合同期限。',
    resultReceiptNo: 'SD-QYSE-20261105-776',
    status: '办理完成',
    nextFollowUpDate: '2026-12-01',
    remarks: '18台电梯检验合格证全部在有效期内，下一检验周期为2027年3月。'
  },
  {
    id: 'LOG-2026-1102-01',
    platformId: 1,
    platformName: '全国核技术利用辐射安全申报系统',
    accessTime: '2026-11-02 11:15',
    operator: '崔伟',
    department: '医学工程科/辐射防护安全办',
    actionType: '许可延续',
    businessSummary: '查询辐射安全许可证变更进展。并核对山东省政务服务中心三楼C10窗口的纸质收件材料签收情况。',
    resultReceiptNo: 'MEE-RS-20261102-0941',
    status: '需补充纸质材料',
    nextFollowUpDate: '2026-11-15',
    remarks: '窗口电话沟通已确认收到纸质件，正等待省厅专家复核签发。'
  }
];

const STORAGE_PLATFORMS_KEY = 'wh_regulatory_platforms_v1';
const STORAGE_DOCS_KEY = 'wh_regulatory_docs_v1';
const STORAGE_LOGS_KEY = 'wh_regulatory_logs_v1';

export function getStoredPlatforms(): RegulatoryPlatform[] {
  try {
    const raw = localStorage.getItem(STORAGE_PLATFORMS_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Failed to parse stored regulatory platforms:', e);
  }
  return INITIAL_REGULATORY_PLATFORMS;
}

export function saveStoredPlatforms(platforms: RegulatoryPlatform[]): void {
  try {
    localStorage.setItem(STORAGE_PLATFORMS_KEY, JSON.stringify(platforms));
  } catch (e) {
    console.error('Failed to save regulatory platforms:', e);
  }
}

export function getStoredDocs(): RegulatoryDocument[] {
  try {
    const raw = localStorage.getItem(STORAGE_DOCS_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Failed to parse stored regulatory docs:', e);
  }
  return INITIAL_REGULATORY_DOCS;
}

export function saveStoredDocs(docs: RegulatoryDocument[]): void {
  try {
    localStorage.setItem(STORAGE_DOCS_KEY, JSON.stringify(docs));
  } catch (e) {
    console.error('Failed to save regulatory docs:', e);
  }
}

export function getStoredLogs(): PlatformAccessLog[] {
  try {
    const raw = localStorage.getItem(STORAGE_LOGS_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Failed to parse stored regulatory logs:', e);
  }
  return INITIAL_ACCESS_LOGS;
}

export function saveStoredLogs(logs: PlatformAccessLog[]): void {
  try {
    localStorage.setItem(STORAGE_LOGS_KEY, JSON.stringify(logs));
  } catch (e) {
    console.error('Failed to save regulatory logs:', e);
  }
}

import { MedicalEquipment, RepairRecord } from '../types';

export interface CalibrationAgencyProfile {
  name: string;
  shortName: string;
  level: '国家级法定计量机构' | '省级计量科学研究院' | '市级计量质量检测院' | '第三方CNAS认可实验室';
  cmaCertNo: string; // CMA资质认定
  cnasCertNo: string; // CNAS实验室认可
  legalAuthNo: string; // 法定计量检定机构授权证书号
  contactPerson: string; // 业务负责人
  contactTitle: string; // 职务/职称
  contactPhone: string; // 电话
  hotline: string; // 24小时应急服务热线
  email: string; // 邮箱
  address: string; // 实验室地址
  website: string; // 网上送检与证书查询系统
  contractNo: string; // 年度合作协议编号
  contractPeriod: string; // 协议有效期
  serviceScope: string[]; // 重点检定授权项目
  turnaroundTime: string; // 常规出证周期
  emergencyResponse: string; // 应急响应时效
  settlementTerms: string; // 结算周期与方式
  bankAccount: {
    bankName: string;
    accountNo: string;
    taxNo: string;
  };
}

export const KNOWN_AGENCIES: Record<string, CalibrationAgencyProfile> = {
  '广东省计量科学研究院': {
    name: '广东省计量科学研究院 (省级)',
    shortName: '广东计量院',
    level: '省级计量科学研究院',
    cmaCertNo: '2023190124Z',
    cnasCertNo: 'CNAS L0192',
    legalAuthNo: '(粤)法计(2023) 0102号',
    contactPerson: '陈建明',
    contactTitle: '医学装备检定室 主任 / 教授级高工',
    contactPhone: '020-89232188 / 13800208866',
    hotline: '400-882-9018 (24小时临床抢修绿色通道)',
    email: 'med-calib@scm.com.cn',
    address: '广州市天河区广通路10号国家医学计量检验检测基地',
    website: 'https://yjjy.scm.com.cn (广东省计量院证书验证服务平台)',
    contractNo: 'GD-METRO-2026-MED088',
    contractPeriod: '2026-01-01 至 2026-12-31 (履约中)',
    serviceScope: [
      'X射线计算机体层摄影设备(CT)法定强检',
      '医用磁共振成像系统(MRI)场强与信噪比定标',
      '医用数字X射线摄影系统(DR)剂量与分辨力校准',
      '高频电刀、双相除颤监护仪能量释放精准度检测',
      '麻醉机与重症呼吸机潮气量及气道压力校验',
      '血液透析装置电导率与温度安全保护性能检测'
    ],
    turnaroundTime: '常规现场检定后 3 个工作日出具电子证书',
    emergencyResponse: '急救重症设备 2 小时内响应，24 小时内上门定标',
    settlementTerms: '按季度汇总对账核销，开具增值税专用发票',
    bankAccount: {
      bankName: '中国工商银行广州市分行营业部',
      accountNo: '3602000109000188992',
      taxNo: '91440000455829108K'
    }
  },
  '深圳市计量质量检测研究院': {
    name: '深圳市计量质量检测研究院 (市级)',
    shortName: '深圳SMQ',
    level: '市级计量质量检测院',
    cmaCertNo: '2023190882A',
    cnasCertNo: 'CNAS L0255',
    legalAuthNo: '(粤)法计(2023) 0215号',
    contactPerson: '林晓峰',
    contactTitle: '生物医药与医学计量中心 资深高级工程师',
    contactPhone: '0755-26995888 / 13922886600',
    hotline: '0755-26995800 (智慧计量定标专线)',
    email: 'medservice@smq.com.cn',
    address: '深圳市南山区西丽同发南路4号国家质检基地',
    website: 'https://www.smq.com.cn (SMQ云检服务系统)',
    contractNo: 'SZ-SMQ-2026-HOSP012',
    contractPeriod: '2026-01-01 至 2026-12-31 (履约中)',
    serviceScope: [
      '超声多普勒胎儿监护仪及便携彩超声功率定标',
      '心电图机、多参数监护仪电气安全与灵敏度校准',
      '全自动生化分析仪与光度计波长与吸光度检测',
      '输液泵与微量注射泵流速与阻塞报警压力定标',
      '血管造影X射线机(DSA)及C型臂几何尺寸与管电压校准'
    ],
    turnaroundTime: '现场定标当天生成临时质检单，2 个工作日出具CMA报告',
    emergencyResponse: '本市内 1 小时应急响应，提供备用周转校验设备',
    settlementTerms: '半年度集中结算，支持医院专属财务接口对账',
    bankAccount: {
      bankName: '招商银行深圳分行科苑支行',
      accountNo: '755901238810901',
      taxNo: '91440300455776129M'
    }
  },
  '中国计量科学研究院': {
    name: '中国计量科学研究院 (国家级)',
    shortName: '中国计量院 (NIM)',
    level: '国家级法定计量机构',
    cmaCertNo: '2022000001Z',
    cnasCertNo: 'CNAS L0001',
    legalAuthNo: '(国)法计(2022) 0001号',
    contactPerson: '张弘扬',
    contactTitle: '医学与电离辐射计量研究所 研究员',
    contactPhone: '010-64525114 / 13601008899',
    hotline: '010-64525888 (国家高精尖装备计量基准服务中心)',
    email: 'nim-medical@nim.ac.cn',
    address: '北京市朝阳区北三环东路18号 / 昌平院区',
    website: 'https://www.nim.ac.cn (国家计量基准数据服务平台)',
    contractNo: 'NIM-NAT-2026-KEY003',
    contractPeriod: '2025-06-01 至 2027-05-31 (长期国家基准对接合作)',
    serviceScope: [
      '医用电子直线加速器与伽玛刀高能辐射绝对剂量定标',
      '正电子发射断层显像(PET-CT/PET-MR)放射性活度校准',
      '手术机器人空间定位重复性及高精度传感器基准传递',
      '高场强超导磁共振(3.0T/7.0T)主磁场均匀性与梯度线性度校准'
    ],
    turnaroundTime: '国家级基准传递检定，5 个工作日出具国家级检定证书',
    emergencyResponse: '国家重点专科放疗设备绿色特约专家专班',
    settlementTerms: '按项目专项立项划拨结算，支持财政统筹支付',
    bankAccount: {
      bankName: '中国建设银行北京安华支行',
      accountNo: '11001018500056012888',
      taxNo: '12100000400001234F'
    }
  }
};

/**
 * 规范化匹配计量检测单位
 */
export function getAgencyProfile(rawAgencyName: string): CalibrationAgencyProfile {
  const cleanName = (rawAgencyName || '').trim();
  
  if (cleanName.includes('广东') || cleanName.includes('省级')) {
    return KNOWN_AGENCIES['广东省计量科学研究院'];
  }
  if (cleanName.includes('深圳') || cleanName.includes('市级') || cleanName.includes('市计量')) {
    return KNOWN_AGENCIES['深圳市计量质量检测研究院'];
  }
  if (cleanName.includes('中国') || cleanName.includes('国家级') || cleanName.includes('NIM')) {
    return KNOWN_AGENCIES['中国计量科学研究院'];
  }

  // 默认动态生成专属法定机构档案
  return {
    name: cleanName || '法定医学计量检定检测所',
    shortName: cleanName.slice(0, 8) || '计量检测所',
    level: '市级计量质量检测院',
    cmaCertNo: '2023190899Z',
    cnasCertNo: 'CNAS L0388',
    legalAuthNo: '(市)法计(2023) 0399号',
    contactPerson: '王建平',
    contactTitle: '医学装备检定科 工程师',
    contactPhone: '020-83391200 / 13700008899',
    hotline: '400-800-6677 (计量检定热线)',
    email: 'calib-service@metrology.org.cn',
    address: '医学计量检测中心大楼4层',
    website: 'https://service.metrology.org.cn',
    contractNo: 'METRO-2026-HOSP-FRAME',
    contractPeriod: '2026-01-01 至 2026-12-31 (履约中)',
    serviceScope: [
      '医用电气设备安全性能检测与接地电阻定标',
      '监护、除颤、输液类急救设备周期性强检',
      '医用影像与检验诊断设备量值溯源'
    ],
    turnaroundTime: '常规 3 个工作日出具检测证书',
    emergencyResponse: '24 小时内到达现场进行检测',
    settlementTerms: '季度结算，对公转账',
    bankAccount: {
      bankName: '中国工商银行本地营业部',
      accountNo: '3600000000000012345',
      taxNo: '914400000000000000'
    }
  };
}

export interface AgencyInspectionLog {
  id: string;
  equipmentId: string;
  equipmentName: string;
  equipmentSn: string;
  department: string;
  inspectionDate: string;
  expiryDate: string;
  inspectionType: '周期法定强检' | '首次验收检定' | '修理后定标检定' | '常规校准校验';
  testItems: string;
  inspector: string;
  result: '合格 (颁发强检证书)' | '合格 (颁发校准证书)' | '准用 (降级使用)' | '不合格';
  certificateNo: string;
  fee: number;
  reportStatus: '已归档 (电子证书可用)' | '生成中';
}

/**
 * 依据全院设备列表生成该机构的往来检定与校准历史
 */
export function generateAgencyInspectionHistory(
  agencyProfile: CalibrationAgencyProfile,
  associatedEquipment: MedicalEquipment[]
): AgencyInspectionLog[] {
  const logs: AgencyInspectionLog[] = [];

  associatedEquipment.forEach((eq, index) => {
    const certNo = eq.calibrationCertificateNo || `JL-2025-${eq.id}`;
    const lastDate = eq.lastCalibrationDate || '2025-08-15';
    const nextDate = eq.nextCalibrationDate || '2026-08-15';

    logs.push({
      id: `CAL-LOG-${eq.id}-2025`,
      equipmentId: eq.id,
      equipmentName: eq.name,
      equipmentSn: eq.sn,
      department: eq.department,
      inspectionDate: lastDate,
      expiryDate: nextDate,
      inspectionType: '周期法定强检',
      testItems: eq.category.includes('成像') 
        ? '辐射剂量、管电压准确度、高对比分辨力、机械运动定位安全'
        : eq.category.includes('呼吸') || eq.category.includes('急救')
        ? '潮气量输出误差、气道压力报警限、双相除颤释放能量值、漏电流'
        : '电气绝缘强度、量值溯源线性度、测量重复性误差',
      inspector: agencyProfile.contactPerson || '主检工程师',
      result: '合格 (颁发强检证书)',
      certificateNo: certNo,
      fee: eq.purchasePrice && eq.purchasePrice > 1000000 ? 3200 : 850,
      reportStatus: '已归档 (电子证书可用)'
    });

    // 为有历史维保或投用较早的设备补充往年检定记录
    if (index % 2 === 0) {
      logs.push({
        id: `CAL-LOG-${eq.id}-2024`,
        equipmentId: eq.id,
        equipmentName: eq.name,
        equipmentSn: eq.sn,
        department: eq.department,
        inspectionDate: '2024-08-12',
        expiryDate: lastDate,
        inspectionType: '周期法定强检',
        testItems: '整机电气安全与关键计量参数定标',
        inspector: '技术主管 严工',
        result: '合格 (颁发强检证书)',
        certificateNo: `JL-2024-${eq.id}`,
        fee: eq.purchasePrice && eq.purchasePrice > 1000000 ? 3000 : 800,
        reportStatus: '已归档 (电子证书可用)'
      });
    }
  });

  // 按检定日期降序排
  return logs.sort((a, b) => b.inspectionDate.localeCompare(a.inspectionDate));
}

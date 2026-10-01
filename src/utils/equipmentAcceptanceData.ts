import { 
  MedicalEquipment, 
  EquipmentAcceptanceDossier, 
  UnboxingInspectionItem, 
  TechnicalPerformanceTestItem, 
  ClinicalTrainingRecord,
  TrainingPhoto,
  AcceptanceSheetCoupon
} from '../types';
import { INITIAL_EQUIPMENT } from '../mockData';

/**
 * 标准四联单配置 (根据医疗卫生机构仪器设备档案管理规范设计)
 */
export const ACCEPTANCE_COUPONS: AcceptanceSheetCoupon[] = [
  {
    couponIndex: 1,
    couponName: '第一联 (白联)',
    couponTitle: '医学装备科留存 · 固定资产主档案归档联',
    bgTone: 'bg-white',
    textColor: 'text-slate-800',
    borderColor: 'border-slate-300'
  },
  {
    couponIndex: 2,
    couponName: '第二联 (红联)',
    couponTitle: '财务资产处留存 · 价值核算与入账支付联',
    bgTone: 'bg-rose-50/70',
    textColor: 'text-rose-900',
    borderColor: 'border-rose-200'
  },
  {
    couponIndex: 3,
    couponName: '第三联 (黄联)',
    couponTitle: '临床使用科室留存 · 责任科室现场保管与备查联',
    bgTone: 'bg-amber-50/70',
    textColor: 'text-amber-900',
    borderColor: 'border-amber-200'
  },
  {
    couponIndex: 4,
    couponName: '第四联 (蓝联)',
    couponTitle: '中标供货厂商留存 · 竣工结算与售后保修凭证联',
    bgTone: 'bg-sky-50/70',
    textColor: 'text-sky-900',
    borderColor: 'border-sky-200'
  }
];

/**
 * 格式化日期为 YYYY-MM-DD
 */
function normalizeDateStr(dateStr?: string, defaultFallback = '2023-01-15'): string {
  if (!dateStr) return defaultFallback;
  const cleaned = dateStr.replace(/\//g, '-');
  const parts = cleaned.split('-');
  if (parts.length === 3) {
    const y = parts[0];
    const m = parts[1].padStart(2, '0');
    const d = parts[2].padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  return cleaned;
}

/**
 * 根据日期推导此前几天的日期
 */
function offsetDateDays(baseDate: string, offsetDays: number): string {
  try {
    const d = new Date(baseDate);
    d.setDate(d.getDate() + offsetDays);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  } catch {
    return baseDate;
  }
}

/**
 * 基于设备品类智能生成开箱清点清单 (Unboxing Checklist)
 */
function buildUnboxingItems(eq: MedicalEquipment): UnboxingInspectionItem[] {
  const name = eq.name || '';
  const cat = `${eq.category || ''} ${eq.level1Category || ''} ${name}`.toLowerCase();

  // 1. 通用基础资质与资料
  const items: UnboxingInspectionItem[] = [
    {
      id: 'ub-01',
      category: '包装与外箱',
      itemName: '重载医用防震木箱 / 瓦楞运输包装箱',
      specification: '符合医用精密设备冷链及抗震运输标准，包装封条完好，无挤压受潮渗水',
      standardQuantity: 1,
      actualQuantity: 1,
      unit: '套',
      checkResult: 'pass',
      remarks: '防震与防倾斜物理指示标签 (ShockWatch/TiltWatch) 未触发变色，封条完整'
    },
    {
      id: 'ub-02',
      category: '三证与资质',
      itemName: '医疗器械注册证与原厂出厂质量合格证',
      specification: `核验 NMPA 注册证号、设备出厂检验批次号与出厂 SN【${eq.sn}】完全一致`,
      standardQuantity: 1,
      actualQuantity: 1,
      unit: '份',
      checkResult: 'pass',
      remarks: '加盖原厂质检合格红色钢印，注册证附表核定型号完全一致'
    },
    {
      id: 'ub-03',
      category: '技术资料与图纸',
      itemName: '中英文操作使用手册、维修工程图纸及软件备份光盘/U盘',
      specification: '含系统恢复备份介质、电路方框图、接口引脚图、日常维护清洁指引',
      standardQuantity: 1,
      actualQuantity: 1,
      unit: '套',
      checkResult: 'pass',
      remarks: '原厂加密启动认证密钥与正版系统授权序列号核销归档'
    },
    {
      id: 'ub-04',
      category: '主机与铭牌',
      itemName: `${eq.name} 主机系统`,
      specification: `规格型号: ${eq.model || '标配'} | 额定工作电压与铭牌清晰激光蚀刻，三包序列号无涂改`,
      standardQuantity: 1,
      actualQuantity: 1,
      unit: '台',
      checkResult: 'pass',
      remarks: '外观无任何机械刮痕、凹坑或漆面脱落，按键与接口插座手感顺畅'
    }
  ];

  // 2. 根据不同品类生成专用附件
  if (cat.includes('ct') || cat.includes('体层') || cat.includes('计算机体层') || cat.includes('x射线')) {
    items.push(
      {
        id: 'ub-05',
        category: '标配附件与线缆',
        itemName: '高精度碳纤维电动患者检查床系统',
        specification: '承重 205kg，低衰减碳纤维床面，含床头托架、患者束缚带及床垫',
        standardQuantity: 1,
        actualQuantity: 1,
        unit: '套',
        checkResult: 'pass',
        remarks: '升降及进床平稳无异响，激光定位灯十字对准'
      },
      {
        id: 'ub-06',
        category: '标配附件与线缆',
        itemName: '主控采集工作站与高压机柜通讯高压电缆',
        specification: '低衰减抗干扰屏蔽信号总线组及高压软电缆组',
        standardQuantity: 1,
        actualQuantity: 1,
        unit: '套',
        checkResult: 'pass',
        remarks: '端接良好，穿线管隐蔽工程规范，接地屏蔽层接触电阻 < 0.1Ω'
      },
      {
        id: 'ub-07',
        category: '选配组件与专用工具',
        itemName: 'Catphan 性能校准水模体与头部/体部剂量模体',
        specification: '含专用悬挂支架、校准几何定位环与专用模体收纳箱',
        standardQuantity: 1,
        actualQuantity: 1,
        unit: '套',
        checkResult: 'pass',
        remarks: '原厂带编号标准校准模体，随机检定证书齐全'
      },
      {
        id: 'ub-08',
        category: '选配组件与专用工具',
        itemName: '医用防护铅衣、铅帽、铅围脖及铅眼镜',
        specification: '防护当量 0.50mmPb，符合放射防护强制卫生标准',
        standardQuantity: 2,
        actualQuantity: 2,
        unit: '套',
        checkResult: 'pass',
        remarks: '无铅橡胶环保材料，出厂检测防护合格证齐全'
      }
    );
  } else if (cat.includes('超声') || cat.includes('ultrasound') || cat.includes('彩超')) {
    items.push(
      {
        id: 'ub-05',
        category: '标配附件与线缆',
        itemName: '宽频腹部凸阵探头 (Abdominal Convex Probe)',
        specification: '工作频率 1.5~6.0 MHz，带微声透镜防护套与防尘盖',
        standardQuantity: 1,
        actualQuantity: 1,
        unit: '支',
        checkResult: 'pass',
        remarks: '声束晶片完好无死晶，声学透镜光滑无气泡'
      },
      {
        id: 'ub-06',
        category: '标配附件与线缆',
        itemName: '高频浅表线阵探头 (High Frequency Linear Probe)',
        specification: '工作频率 4.0~15.0 MHz，支持小器官/浅表/肌骨血管成像',
        standardQuantity: 1,
        actualQuantity: 1,
        unit: '支',
        checkResult: 'pass',
        remarks: '高频信号灵敏度极高，接口插拔锁紧机构顺滑'
      },
      {
        id: 'ub-07',
        category: '选配组件与专用工具',
        itemName: '心脏相控阵探头或腔内微凸探头',
        specification: '工作频率 1.5~4.5 MHz，支持连续多普勒 (CW) 与组织多普勒',
        standardQuantity: 1,
        actualQuantity: 1,
        unit: '支',
        checkResult: 'pass',
        remarks: '匹配原机软件版本，已激活连续多普勒高级分析授权包'
      },
      {
        id: 'ub-08',
        category: '标配附件与线缆',
        itemName: '医用三联防水脚踏开关与耦合剂恒温加热底座',
        specification: 'IPX8 级防水脚踏，底座支持 37℃ 人体恒温加热',
        standardQuantity: 1,
        actualQuantity: 1,
        unit: '套',
        checkResult: 'pass',
        remarks: '温度恒定精度 ±0.5℃，踏板响应灵敏无延迟'
      }
    );
  } else if (cat.includes('呼吸机') || cat.includes('ventilator') || cat.includes('麻醉')) {
    items.push(
      {
        id: 'ub-05',
        category: '标配附件与线缆',
        itemName: '高精度电磁呼气阀组件与超声流量传感器',
        specification: '耐受高温高压灭菌 (134℃)，微压差数字感测',
        standardQuantity: 2,
        actualQuantity: 2,
        unit: '套',
        checkResult: 'pass',
        remarks: '一用一备，完成初始零点自动校准'
      },
      {
        id: 'ub-06',
        category: '标配附件与线缆',
        itemName: '伺服控制加热加湿器系统 (带加热导丝管路)',
        specification: '含温度探头接口、湿化罐及双加热成人/儿童回路',
        standardQuantity: 1,
        actualQuantity: 1,
        unit: '套',
        checkResult: 'pass',
        remarks: '温度显示与过温声光双重保护自测合格'
      },
      {
        id: 'ub-07',
        category: '标配附件与线缆',
        itemName: '医疗高压氧气与压缩空气进气软管 (NIST标准快速接头)',
        specification: '额定工作耐压 1.0 MPa，符合 GB 颜色识别与防误插结构',
        standardQuantity: 2,
        actualQuantity: 2,
        unit: '根',
        checkResult: 'pass',
        remarks: '气密性检测无任何微漏，快速插拔自锁牢靠'
      },
      {
        id: 'ub-08',
        category: '选配组件与专用工具',
        itemName: '医用气动无油压缩机系统或专用移动阻尼支架推车',
        specification: '静音运行 < 48dB(A)，带双重大容量水汽自动过滤排水阀',
        standardQuantity: 1,
        actualQuantity: 1,
        unit: '台',
        checkResult: 'pass',
        remarks: '推车带四个防静电万向刹车脚轮，推行顺畅'
      }
    );
  } else if (cat.includes('除颤') || cat.includes('defibrillator')) {
    items.push(
      {
        id: 'ub-05',
        category: '标配附件与线缆',
        itemName: '多功能体外成人/儿童双用组合除颤电极板',
        specification: '内置能量释放确认按钮、充电指示灯及接触阻抗指示柱',
        standardQuantity: 1,
        actualQuantity: 1,
        unit: '对',
        checkResult: 'pass',
        remarks: '成人/小儿滑轨卡扣转换灵活，表面镀层光洁无氧化'
      },
      {
        id: 'ub-06',
        category: '标配附件与线缆',
        itemName: '5导联防除颤心电监护电缆及一次性除颤起搏多功能电极贴片',
        specification: '内置过压瞬态抑制保护 (耐受 5000V 脉冲抗电击)',
        standardQuantity: 2,
        actualQuantity: 2,
        unit: '套',
        checkResult: 'pass',
        remarks: '电缆柔软抗拉扯，导联脱落检测功能正常'
      },
      {
        id: 'ub-07',
        category: '标配附件与线缆',
        itemName: '大容量智能医用锂电池组 (内置电量LED指示灯)',
        specification: '标称容量 5600mAh/14.8V，满电支持 360J 连续放电 ≥ 200 次',
        standardQuantity: 2,
        actualQuantity: 2,
        unit: '块',
        checkResult: 'pass',
        remarks: '原厂A品电芯，自检健康度 100%，充放电循环测试正常'
      },
      {
        id: 'ub-08',
        category: '选配组件与专用工具',
        itemName: '50mm 高速热敏记录打印纸及除颤能量测试负载插头',
        specification: '打印清晰耐褪色，测试负载用于开机每日自动放电自检',
        standardQuantity: 10,
        actualQuantity: 10,
        unit: '卷',
        checkResult: 'pass',
        remarks: '插头已安装于主机测试座，自动自检打印测试单正常'
      }
    );
  } else if (cat.includes('监护') || cat.includes('monitor')) {
    items.push(
      {
        id: 'ub-05',
        category: '标配附件与线缆',
        itemName: '医用防缠绕 5 导联心电导联线与防摔血氧探头',
        specification: '耐弯折环保TPU线材，双波长红外光电传感器',
        standardQuantity: 2,
        actualQuantity: 2,
        unit: '套',
        checkResult: 'pass',
        remarks: '弱灌注指夹测试灵敏，抗工频干扰良好'
      },
      {
        id: 'ub-06',
        category: '标配附件与线缆',
        itemName: '抗磨损无创血压袖带组 (成人标准型 + 大号型)',
        specification: 'TPU 气囊防爆耐压，魔术贴粘性高，带快速金属自锁公母接头',
        standardQuantity: 2,
        actualQuantity: 2,
        unit: '条',
        checkResult: 'pass',
        remarks: '气密性保压测试合格，无脱胶漏气'
      },
      {
        id: 'ub-07',
        category: '标配附件与线缆',
        itemName: '医用体温体表/体腔探头及电源适配器线缆',
        specification: '高精度 NTC 热敏电阻传感器，测量精度 ±0.1℃',
        standardQuantity: 2,
        actualQuantity: 2,
        unit: '根',
        checkResult: 'pass',
        remarks: '读数准确，与恒温水槽比对误差在允许范围内'
      },
      {
        id: 'ub-08',
        category: '选配组件与专用工具',
        itemName: '快速装卸输液架挂钩与专用床边转运吊臂',
        specification: '高强度铝合金压铸成型，承重 15kg，带防滑旋钮',
        standardQuantity: 1,
        actualQuantity: 1,
        unit: '套',
        checkResult: 'pass',
        remarks: '锁紧稳固，适合病床护栏与转运平车挂载'
      }
    );
  } else {
    // 通用常规设备
    items.push(
      {
        id: 'ub-05',
        category: '标配附件与线缆',
        itemName: '医用三芯标准阻燃接地电源线 (GB 9706.1)',
        specification: '铜芯截面积 3×1.5mm²，带注塑一体化插头及锁扣夹具',
        standardQuantity: 1,
        actualQuantity: 1,
        unit: '根',
        checkResult: 'pass',
        remarks: '导通电阻实测 0.04Ω，绝缘良好'
      },
      {
        id: 'ub-06',
        category: '标配附件与线缆',
        itemName: '原装标配连接导线、电缆及管路配件',
        specification: '与主机接口严格物理匹配，防误插防脱落锁止结构',
        standardQuantity: 1,
        actualQuantity: 1,
        unit: '套',
        checkResult: 'pass',
        remarks: '全新原封无挤压形变，信号传输稳定'
      },
      {
        id: 'ub-07',
        category: '选配组件与专用工具',
        itemName: '日常维护与校准专用调试工具包',
        specification: '含专用内六角、测试导线、校准接头及保险丝备品',
        standardQuantity: 1,
        actualQuantity: 1,
        unit: '套',
        checkResult: 'pass',
        remarks: '品类齐全，收纳包标识清晰'
      }
    );
  }

  return items;
}

/**
 * 根据设备品类生成技术与电气安全性能实测表 (Technical Performance Tests)
 */
function buildTechnicalTests(eq: MedicalEquipment): TechnicalPerformanceTestItem[] {
  const name = eq.name || '';
  const cat = `${eq.category || ''} ${eq.level1Category || ''} ${name}`.toLowerCase();

  const tests: TechnicalPerformanceTestItem[] = [
    {
      id: 'tt-01',
      testCategory: '供电及安装环境',
      parameterName: '供电电源电压与稳压性能',
      standardRequirement: cat.includes('ct') ? '三相 380V ± 5% (361V ~ 399V)' : '单相 AC 220V ± 10% (198V ~ 242V)',
      measuredValue: cat.includes('ct') ? '381.5 V (三相平衡度 0.4%)' : '221.8 V (50.0 Hz)',
      testResult: 'pass',
      testInstrument: 'Fluke 289 真有效值工业万用表'
    },
    {
      id: 'tt-02',
      testCategory: '供电及安装环境',
      parameterName: '设备专用保护接地电阻 (PE Ground)',
      standardRequirement: cat.includes('ct') ? '< 1.0 Ω (医用放射设备专用地线)' : '< 4.0 Ω (常规临床医用接地)',
      measuredValue: cat.includes('ct') ? '0.28 Ω' : '0.45 Ω',
      testResult: 'pass',
      testInstrument: 'Fluke 1625-2 智能接地电阻测试仪'
    },
    {
      id: 'tt-03',
      testCategory: '供电及安装环境',
      parameterName: '机房温湿度与洁净通风环境',
      standardRequirement: '环境温度 18℃~24℃ | 相对湿度 40%~65% RH',
      measuredValue: '温度: 21.6 ℃ | 湿度: 48.2% RH',
      testResult: 'pass',
      testInstrument: 'Testo 625 精密温湿度测定仪'
    },
    {
      id: 'tt-04',
      testCategory: '电气安全指标',
      parameterName: '保护接地导通阻抗 (GB 9706.1 标准)',
      standardRequirement: '接地阻抗 ≤ 0.10 Ω (含可拆卸电源线)',
      measuredValue: '0.042 Ω',
      testResult: 'pass',
      testInstrument: 'Fluke ESA620 医用电气安全分析仪'
    },
    {
      id: 'tt-05',
      testCategory: '电气安全指标',
      parameterName: '对地漏电流 (Earth Leakage Current)',
      standardRequirement: '正常状态 (NC) ≤ 500 μA | 单一故障状态 (SFC) ≤ 1000 μA',
      measuredValue: 'NC: 88.4 μA | SFC: 174.2 μA',
      testResult: 'pass',
      testInstrument: 'Fluke ESA620 医用电气安全分析仪'
    },
    {
      id: 'tt-06',
      testCategory: '电气安全指标',
      parameterName: '外壳漏电流 (Enclosure Leakage Current)',
      standardRequirement: '正常状态 (NC) ≤ 100 μA | 单一故障状态 (SFC) ≤ 500 μA',
      measuredValue: 'NC: 14.6 μA | SFC: 42.1 μA',
      testResult: 'pass',
      testInstrument: 'Fluke ESA620 医用电气安全分析仪'
    }
  ];

  // 针对不同设备的专业核心技术性能测试
  if (cat.includes('ct') || cat.includes('体层')) {
    tests.push(
      {
        id: 'tt-07',
        testCategory: '关键性能与参数',
        parameterName: '水模体中心 CT 值校准偏差 (0 HU Baseline)',
        standardRequirement: '0.0 ± 4.0 HU',
        measuredValue: '+0.3 HU (均一性优良)',
        testResult: 'pass',
        testInstrument: 'Catphan 500/600 性能标准体模'
      },
      {
        id: 'tt-08',
        testCategory: '关键性能与参数',
        parameterName: '高对比空间分辨力 (High Contrast Resolution)',
        standardRequirement: '≥ 15.0 lp/cm (0% MTF)',
        measuredValue: '17.2 lp/cm (极高解析度)',
        testResult: 'pass',
        testInstrument: 'Catphan 高对比铝制线对模块'
      },
      {
        id: 'tt-09',
        testCategory: '关键性能与参数',
        parameterName: '加权 CT 剂量指数 (CTDIw 头部模体标准)',
        standardRequirement: '头部剂量 ≤ 50 mGy',
        measuredValue: '36.8 mGy (绿色超低剂量扫描)',
        testResult: 'pass',
        testInstrument: 'RaySafe X2 宽频半导体剂量仪'
      }
    );
  } else if (cat.includes('超声') || cat.includes('ultrasound') || cat.includes('彩超')) {
    tests.push(
      {
        id: 'tt-07',
        testCategory: '关键性能与参数',
        parameterName: '腹部凸阵探头最大探测深度 (Penetration Depth)',
        standardRequirement: '≥ 200 mm',
        measuredValue: '235 mm (穿透力充沛)',
        testResult: 'pass',
        testInstrument: 'KS107BD 医用超声仿组织体模'
      },
      {
        id: 'tt-08',
        testCategory: '关键性能与参数',
        parameterName: '轴向与侧向分辨力 (Axial & Lateral Resolution)',
        standardRequirement: '轴向 ≤ 1.0 mm | 侧向 ≤ 2.0 mm',
        measuredValue: '轴向 0.6 mm | 侧向 1.2 mm',
        testResult: 'pass',
        testInstrument: 'KS107BD 医用超声仿组织体模'
      },
      {
        id: 'tt-09',
        testCategory: '关键性能与参数',
        parameterName: '超声声输出安全性指数 (机械指数 MI / 热指数 TI)',
        standardRequirement: 'MI < 1.9 | TI < 1.0 (符合人体安全声学标准)',
        measuredValue: '最大 MI: 0.82 | TI: 0.35',
        testResult: 'pass',
        testInstrument: '原厂主机实时声能监测系统'
      }
    );
  } else if (cat.includes('呼吸机') || cat.includes('ventilator') || cat.includes('麻醉')) {
    tests.push(
      {
        id: 'tt-07',
        testCategory: '关键性能与参数',
        parameterName: '潮气量输出准确度 (Tidal Volume Accuracy @ 500ml)',
        standardRequirement: '允许误差在 ± 10% 以内 (450ml ~ 550ml)',
        measuredValue: '实测 496 ml (误差仅 -0.8%)',
        testResult: 'pass',
        testInstrument: 'TSI Certifier Pro 医用气流分析仪'
      },
      {
        id: 'tt-08',
        testCategory: '关键性能与参数',
        parameterName: '呼气末正压精度 (PEEP Accuracy @ 10 cmH2O)',
        standardRequirement: '误差 ≤ ± 2.0 cmH2O',
        measuredValue: '实测 10.2 cmH2O (误差 +0.2 cmH2O)',
        testResult: 'pass',
        testInstrument: 'TSI Certifier Pro 医用气流分析仪'
      },
      {
        id: 'tt-09',
        testCategory: '关键性能与参数',
        parameterName: '吸入氧浓度监控准确度 (FiO2 Accuracy @ 40% & 80%)',
        standardRequirement: '误差 ≤ ± 3.0 %',
        measuredValue: '40%档实测 39.8% | 80%档实测 80.4%',
        testResult: 'pass',
        testInstrument: 'Maxtec 医用精密顺磁式定氧仪'
      }
    );
  } else if (cat.includes('除颤') || cat.includes('defibrillator')) {
    tests.push(
      {
        id: 'tt-07',
        testCategory: '关键性能与参数',
        parameterName: '除颤释放能量误差 (全档位释放精度 50Ω 标准阻抗)',
        standardRequirement: '各能量档位释放误差 ≤ ± 15% 或 ± 3J',
        measuredValue: '10J(10.1J) | 50J(49.8J) | 200J(198.4J) | 360J(358.1J)',
        testResult: 'pass',
        testInstrument: 'Fluke Impulse 7000DP 除颤测试仪'
      },
      {
        id: 'tt-08',
        testCategory: '关键性能与参数',
        parameterName: '同步复律放电延迟时间 (Sync Discharge Delay)',
        standardRequirement: 'R 波峰值至能量释放延迟 ≤ 60 ms',
        measuredValue: '18.4 ms (高度同步，无室颤风险)',
        testResult: 'pass',
        testInstrument: 'Fluke Impulse 7000DP 同步示波采集分析仪'
      },
      {
        id: 'tt-09',
        testCategory: '关键性能与参数',
        parameterName: '最大能量充电时间 (Charge Time to Max Energy)',
        standardRequirement: '交流/电池满电至 360J 充电时间 ≤ 10.0 秒',
        measuredValue: '4.2 秒 (极速就绪)',
        testResult: 'pass',
        testInstrument: '高精度数字秒表与电流波形传感器'
      }
    );
  } else if (cat.includes('监护') || cat.includes('monitor')) {
    tests.push(
      {
        id: 'tt-07',
        testCategory: '关键性能与参数',
        parameterName: '心电心率测量精度 (ECG HR Accuracy @ 60/120/180 bpm)',
        standardRequirement: '误差 ≤ ± 1% 或 ± 1 bpm',
        measuredValue: '60(60.0) | 120(119.8) | 180(180.1) bpm',
        testResult: 'pass',
        testInstrument: 'Fluke ProSim 8 生命体征多功能模拟器'
      },
      {
        id: 'tt-08',
        testCategory: '关键性能与参数',
        parameterName: '无创血压重复性与静态压力示值误差 (NIBP Accuracy)',
        standardRequirement: '静态压力误差 ≤ ± 3 mmHg',
        measuredValue: '实测误差 +0.8 mmHg (重复性变异系数 0.6%)',
        testResult: 'pass',
        testInstrument: 'Fluke BP Pump 2 血压模拟校验仪'
      },
      {
        id: 'tt-09',
        testCategory: '关键性能与参数',
        parameterName: '脉搏血氧饱和度测定准确度 (SpO2 Accuracy 70%~100%)',
        standardRequirement: '误差 ≤ ± 2.0 % (低灌注指数 PI 0.2% 模拟测试)',
        measuredValue: '实测 98.2% (设定值 98.0%, 误差 +0.2%)',
        testResult: 'pass',
        testInstrument: 'Fluke Index 2 血氧饱和度模拟测试仪'
      }
    );
  } else {
    tests.push(
      {
        id: 'tt-07',
        testCategory: '关键性能与参数',
        parameterName: '设备关键技术指标与标称功能复核',
        standardRequirement: '各项机械传动、电子显示与按键响应均符合出厂产品标准',
        measuredValue: '全功能连续循环测试 100% 正常响应无报错',
        testResult: 'pass',
        testInstrument: '综合功能标定检具'
      }
    );
  }

  // 试运行连续带载考核
  tests.push({
    id: 'tt-10',
    testCategory: '连续带载试运行',
    parameterName: '设备 72 小时带载连续通电与模拟负荷试运行',
    standardRequirement: '连续带载运行 72h 无任何异常报警、无过温停机、通讯链路无丢包',
    measuredValue: '连续运行 72.0 小时，机箱关键温升 < 12℃，稳定性考核 100% 达标',
    testResult: 'pass',
    testInstrument: '智能温湿度及在线电源负载监测仪'
  });

  return tests;
}

export const DEFAULT_TRAINING_PHOTOS: TrainingPhoto[] = [
  {
    id: 'tp-def-01',
    url: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=900&auto=format&fit=crop&q=80',
    caption: '原厂资深临床应用专家主持理论大纲培训，系统讲解开机自检与参数调节规程',
    uploadedAt: '2023-08-14 09:30',
    category: 'lecture',
    takenBy: '张工 (医学装备科)'
  },
  {
    id: 'tp-def-02',
    url: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=900&auto=format&fit=crop&q=80',
    caption: '科室责任医护人员在工程师指导下进行盲机故障模拟与危急报警应急排障实操',
    uploadedAt: '2023-08-14 14:15',
    category: 'operation',
    takenBy: '王雪莲 (护士长)'
  },
  {
    id: 'tp-def-03',
    url: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=900&auto=format&fit=crop&q=80',
    caption: '临床技能实操考核全员达标，科室主任与装备科主检工程师现场签署移交凭据',
    uploadedAt: '2023-08-14 16:40',
    category: 'handover',
    takenBy: '李峰 (原厂工程师)'
  }
];

/**
 * 获取设备专属培训现场照片 (优先读本地缓存，若无则使用默认真实照片)
 */
export function getStoredTrainingPhotos(equipmentId: string): TrainingPhoto[] {
  try {
    const key = `wl_training_photos_${equipmentId}`;
    const saved = localStorage.getItem(key);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('获取本地存储培训照片失败:', e);
  }
  return DEFAULT_TRAINING_PHOTOS;
}

/**
 * 持久化保存设备专属培训照片
 */
export function saveStoredTrainingPhotos(equipmentId: string, photos: TrainingPhoto[]): void {
  try {
    const key = `wl_training_photos_${equipmentId}`;
    localStorage.setItem(key, JSON.stringify(photos));
  } catch (e) {
    console.error('保存培训照片失败:', e);
  }
}

/**
 * 构建临床科室操作与日常维护培训档案
 */
function buildClinicalTrainingRecord(eq: MedicalEquipment, acceptanceDate: string): ClinicalTrainingRecord {
  const dept = eq.department || '临床科室';
  const trainerComp = eq.manufacturer || eq.supplier || '原厂技术服务中心';
  const trainingDate = offsetDateDays(acceptanceDate, -1);
  const rawCleanId = String(eq?.id || '10159').replace(/[^0-9]/g, '') || '10159';
  const storedPhotos = getStoredTrainingPhotos(eq?.id || '10159');

  return {
    trainingNo: `PX-${trainingDate.slice(0, 4)}-${rawCleanId.padStart(4, '0')}`,
    trainingDate,
    trainingHours: 8,
    trainingLocation: eq.usageLocation || eq.location || `${dept} 诊疗实操示教室 (1号楼3层)`,
    trainerName: '张敏捷',
    trainerTitle: '大中华区高级临床应用培训专员',
    trainerCompany: trainerComp,
    trainerPhone: '138-0019-8201',
    topics: [
      { id: 'top-1', category: '理论架构与设备原理', title: `【${eq.name}】电气系统原理、核心构造、自检流程及临床工作模式解析`, durationHours: 2 },
      { id: 'top-2', category: '临床规范化实机操作', title: '标准开机上机流程、参数精细化设定、波形与数据监测判读', durationHours: 2 },
      { id: 'top-3', category: '危急报警与应急排错', title: '高危生理/技术报警阈值设定、盲机模拟故障处置与快速排错', durationHours: 2 },
      { id: 'top-4', category: '日常维护与院感质控', title: '传感器/导联线消毒保养规范、一级点检交接及不良事件防范', durationHours: 2 },
    ],
    trainees: [
      {
        id: 'trainee-1',
        name: '杜晓光',
        department: dept,
        role: '科室主任 / 主任医师',
        assessmentResult: '优秀',
        score: 98,
        theoryScore: 97,
        practicalScore: 99,
        signature: '杜晓光',
        traineeSignature: '杜晓光'
      },
      {
        id: 'trainee-2',
        name: '王雪莲',
        department: dept,
        role: '护士长 / 副主任护师',
        assessmentResult: '优秀',
        score: 97,
        theoryScore: 96,
        practicalScore: 98,
        signature: '王雪莲',
        traineeSignature: '王雪莲'
      },
      {
        id: 'trainee-3',
        name: '张建军',
        department: dept,
        role: '主治医师 / 科室质控员',
        assessmentResult: '良好',
        score: 95,
        theoryScore: 94,
        practicalScore: 96,
        signature: '张建军',
        traineeSignature: '张建军'
      },
      {
        id: 'trainee-4',
        name: '刘芳',
        department: dept,
        role: '主管技师 / 设备首要保管人',
        assessmentResult: '优秀',
        score: 99,
        theoryScore: 98,
        practicalScore: 100,
        signature: '刘芳',
        traineeSignature: '刘芳'
      }
    ],
    courseContent: `1. 【${eq.name}】系统开机自检流程、各工作模式设置与核心临床参数调节；\n` +
      `2. 规范化临床操作流程、危急报警阈值设置与典型报警故障现场排除方法；\n` +
      `3. 专用探头/管路/线缆附件的日常消毒灭菌规范与存放保养注意事项；\n` +
      `4. 医院医学工程科快速一键扫码报修、日常点检保养规范与不良事件应急处置预案。`,
    assessmentSummary: `全体受训 4 名临床骨干人员全程参与理论讲解与盲机实操演练，均通过现场技能考核，考核成绩平均 97.2 分，全员具备独立规范上机操作资格与日常规范维护能力。`,
    photos: storedPhotos,
    trainerSignature: '张敏捷 (原厂认证专家)',
    departmentDirectorSignature: '杜晓光 (科室主任)',
    equipmentEngineerSignature: `${eq.manager || '崔工程师'} (医学工程科)`
  };
}

/**
 * 构建五方联合签署与会签明细 (厂商工程师、设备科工程师、临床主任、装备科科长、财务入账)
 */
function buildSignoffs(eq: MedicalEquipment, acceptanceDate: string) {
  const dept = eq.department || '临床科室';
  const vendorComp = eq.manufacturer || eq.supplier || '设备原厂技术服务中心';

  return {
    vendorEngineer: {
      roleCode: 'vendor_engineer' as const,
      roleTitle: '供货厂商 · 原厂现场安装工程师',
      departmentOrCompany: `${vendorComp} 现场工程部`,
      signatoryName: '李峰',
      employeeNoOrCert: 'CERT-VENDOR-ENG-9941',
      jobTitle: '资深现场工程专家',
      phone: '139-2041-8891',
      signDate: acceptanceDate,
      opinion: `本批次设备为全新未拆封原装出厂正品，外包装完好无损，经现场标准环境安装调试，接地、供电、硬件及软件自检均通过，关键技术指标与合同约定完全一致。随机标配备件与手册已如数移交，完成临床人员培训，质保服务自今日起正式生效。`,
      signatureImage: '李峰 (原厂技术认证)',
      stampType: 'vendor' as const
    },
    biomedicalEngineer: {
      roleCode: 'biomedical_engineer' as const,
      roleTitle: '医院医学工程科 · 设备验收主检工程师',
      departmentOrCompany: '五莲县人民医院 医学装备科',
      signatoryName: eq.manager || '崔工程师',
      employeeNoOrCert: 'EMP-MED-7001',
      jobTitle: '主管医疗设备工程师',
      phone: '0633-7991820',
      signDate: acceptanceDate,
      opinion: `经会同厂商工程师进行开箱清点，设备三证资质真实有效，序列号与报关单完全一致。使用 Fluke ESA620 及专业检具完成电气安全检测，对地漏电流及接地电阻优于国家标准；连续 72h 试运行稳定可靠。技术档案已建档并生成专属资产追溯编码，核准验收合格。`,
      signatureImage: `${eq.manager || '崔工程师'} (印)`,
      stampType: 'biomedical' as const
    },
    clinicalHead: {
      roleCode: 'clinical_head' as const,
      roleTitle: '临床使用科室 · 科室主任 / 护士长',
      departmentOrCompany: `${dept} (资产使用与管理责任科室)`,
      signatoryName: '杜晓光',
      employeeNoOrCert: 'EMP-CLIN-3012',
      jobTitle: '科室主任 / 主任医师',
      phone: eq.nursePhone || '0633-7991498',
      signDate: acceptanceDate,
      opinion: `设备在本科室安装就位，试运行操作流程顺畅，界面显示正常，参数符合临床诊疗精度要求。科室医生、护士及技师已按要求参加专项操作与保养培训，考核合格。相关随机线缆与附件已清点接收并录入科室保管台账，同意正式投入临床使用。`,
      signatureImage: '杜晓光',
      stampType: 'clinical' as const
    },
    equipmentDirector: {
      roleCode: 'equipment_director' as const,
      roleTitle: '医学装备委员会 / 医学装备科 · 科长',
      departmentOrCompany: '五莲县人民医院 医学装备管理委员会',
      signatoryName: '杜科长',
      employeeNoOrCert: 'EMP-ADM-1002',
      jobTitle: '医学装备科科长 / 委员会副主任',
      phone: '0633-7991008',
      signDate: acceptanceDate,
      opinion: `综合审核开箱检验记录、电气安全检测报告、试运行考核记录及临床科室试用反馈意见，本台设备符合国家医疗器械准入标准及医院采购合同全部技术条款。同意通过竣工验收，正式计入医院在役固定资产台账，准予办理财务挂账与付款手续。`,
      signatureImage: '杜科长 (核审同意)',
      stampType: 'hospital_official' as const
    },
    financeAuditor: {
      roleCode: 'finance_auditor' as const,
      roleTitle: '财务资产处 · 固定资产入账复核员',
      departmentOrCompany: '五莲县人民医院 财务科资产核算组',
      signatoryName: '赵洁',
      employeeNoOrCert: 'EMP-FIN-2008',
      jobTitle: '资产会计',
      phone: '0633-7991120',
      signDate: acceptanceDate,
      opinion: `增值税发票、采购合同、政府采购中标通知书与本验收单实物金额完全核对无误。已在医院财务固定资产系统生成入账凭证，按折旧年限与科室成本核算单元自动归集，凭据手续齐备，同意归档。`,
      signatureImage: '赵洁',
      stampType: 'hospital_official' as const
    }
  };
}

/**
 * 为任意设备生成唯一且深度保真的新机入库开箱验收全套档案
 */
export function getEquipmentAcceptanceDossier(equipmentInput: MedicalEquipment | string): EquipmentAcceptanceDossier {
  // 解析并兼容传入设备对象或设备 ID 字符串
  let equipment: MedicalEquipment;
  if (typeof equipmentInput === 'string') {
    let found: MedicalEquipment | undefined;
    try {
      const stored = localStorage.getItem('medical_equipment_data');
      if (stored) {
        const list: MedicalEquipment[] = JSON.parse(stored);
        found = list.find(e => e.id === equipmentInput);
      }
    } catch {}
    if (!found) {
      found = INITIAL_EQUIPMENT.find(e => e.id === equipmentInput);
    }
    equipment = found || ({
      id: equipmentInput,
      name: '医疗仪器设备',
      model: 'MED-STANDARD',
      department: '医学装备科',
      category: '通用诊疗设备',
      manufacturer: '原厂制造中心',
      supplier: '原厂技术服务中心',
      sn: `SN-${equipmentInput}`,
      status: '正常运行',
      enableDate: '2023-08-15',
      purchasePrice: 180000,
      manager: '崔工程师',
      location: '科室诊疗室',
      acceptanceDate: '2023-08-15',
      repairCount: 0,
      repairRecords: [],
      statusLogs: []
    } as unknown as MedicalEquipment);
  } else {
    equipment = equipmentInput;
  }

  // 1. 如果设备本身已经挂载了保存好的验收档案，直接返回
  if (equipment?.acceptanceDossier) {
    return equipment.acceptanceDossier;
  }

  // 2. 检查本地持久化存储
  const storageKey = `wl_acceptance_dossier_${equipment?.id || '10159'}`;
  try {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (
        parsed && 
        parsed.acceptanceNo && 
        parsed.acceptanceDate && 
        parsed.trainingRecord && 
        parsed.trainingRecord.trainingDate && 
        parsed.signoffs
      ) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('读取本地验收单档案缓存失败:', e);
  }

  // 3. 基于设备数据确定验收相关基准时间
  const enableDate = normalizeDateStr(equipment.enableDate, '2023-08-15');
  const acceptanceDate = enableDate;
  const deliveryDate = offsetDateDays(acceptanceDate, -7);
  const installationStartDate = offsetDateDays(acceptanceDate, -5);

  const rawCleanId = String(equipment?.id || '10159').replace(/[^0-9]/g, '') || '10159';
  const acceptanceNo = `YS-${acceptanceDate.slice(0, 4)}-${rawCleanId.padStart(6, '0')}`;
  const contractNo = `HT-${acceptanceDate.slice(0, 4)}-MED-${rawCleanId}`;
  const biddingNo = `ZB-${acceptanceDate.slice(0, 4)}-WLH-${rawCleanId.slice(-3).padStart(3, '0')}`;

  // 4. 三证信息
  const yearCode = acceptanceDate.slice(0, 4);
  const isImported = (equipment.manufacturer || '').includes('西门子') || 
                     (equipment.manufacturer || '').includes('飞利浦') || 
                     (equipment.manufacturer || '').includes('GE') ||
                     (equipment.manufacturer || '').includes('奥林巴斯');
  
  const registrationCertNo = isImported
    ? `国械注进${yearCode}3${rawCleanId.slice(-6).padStart(6, '2019')}`
    : `国械注准${yearCode}3${rawCleanId.slice(-6).padStart(6, '3018')}`;
  
  const registrationCertExpiry = `${parseInt(yearCode, 10) + 5}-12-31`;
  const productionLicenseNo = isImported ? '境外制造厂商原产地准入备案' : `鲁食药监械生产许${yearCode}0088号`;
  const customsDeclarationNo = isImported ? `CUSTOMS-QDAO-${yearCode}-88192014` : undefined;
  const certificateOfOrigin = isImported ? 'GERMANY / CERT-EUR-991204' : '中国 · 山东 / 原厂质量技术保证书';
  const qualityInspectionCertNo = `QC-PASSED-${yearCode}-${rawCleanId}`;

  // 5. 开箱清点清单
  const unboxingItems = buildUnboxingItems(equipment);

  // 6. 技术实测指标
  const technicalTests = buildTechnicalTests(equipment);

  // 7. 培训记录
  const trainingRecord = buildClinicalTrainingRecord(equipment, acceptanceDate);

  // 8. 五方会签
  const signoffs = buildSignoffs(equipment, acceptanceDate);

  // 9. 质保与SLA
  const purchasePrice = equipment.purchasePrice || 100000;
  const warrantyMonths = purchasePrice >= 1000000 ? 36 : 24;
  const corePartWarrantyYears = purchasePrice >= 1000000 ? 5 : 3;

  const dossier: EquipmentAcceptanceDossier = {
    acceptanceNo,
    contractNo,
    biddingNo,
    procurementMethod: purchasePrice >= 500000 ? '公开招标' : '竞争性磋商',
    fundingSource: purchasePrice >= 1000000 ? '省级重点学科建设专项补助与医院配套资金' : '医院事业发展自有运营资金',
    invoiceCode: '3700203130',
    invoiceNo: `88${rawCleanId.padStart(6, '0')}`,
    deliveryDate,
    installationStartDate,
    acceptanceDate,
    installationLocation: equipment.usageLocation || equipment.location || `${equipment.department} 诊疗区 (1号楼)`,

    registrationCertNo,
    registrationCertExpiry,
    productionLicenseNo,
    customsDeclarationNo,
    certificateOfOrigin,
    qualityInspectionCertNo,

    unboxingItems,
    unboxingConclusion: `现场开箱核对全部 ${unboxingItems.length} 项物品，外包装防震指示完好，随机技术资料与注册证附件齐全，序列号 SN【${equipment.sn}】完全吻合，无机械损伤，清点合格。`,

    technicalTests,
    testingConclusion: `全部 ${technicalTests.length} 项供电环境、接地阻抗、电气安全漏电流及核心技术参数实测值均符合 GB 9706.1 标准与合同技术规范，72 小时带载负荷试运行连续无故障，考核达标。`,

    trainingRecord,

    warrantyMonths,
    corePartWarrantyYears,
    responseSlaHours: 2,
    onsiteSlaHours: 24,
    preventiveMaintenancePerYear: purchasePrice >= 500000 ? 4 : 2,
    postWarrantyPolicy: `质保期满后，供货方承诺提供原厂备件 8.5 折优惠供应保障，软件终身免费同版本升级，终身免收远程诊断服务工时费。`,

    finalAcceptanceConclusion: '合格同意入库投用',
    acceptanceSummaryNotes: `该仪器设备经医学装备科、供货商技术工程师及临床使用科室三方联合开箱核验、安装调试及技术性能实测，各项技术指标均符合临床诊疗精度规范，电气安全检验合格。科室操作培训考核通过。准予正式计入全院固定资产台账并办理入账结算手续。`,

    signoffs,

    securityVerificationCode: `WL-SEC-${rawCleanId.padStart(6, '0')}`,
    officialStampText: '五莲县人民医院 医学装备科 设备验收入库专用章'
  };

  return dossier;
}

/**
 * 持久化保存验收档案修改 (支持科室用户补充验收备忘或调整结论)
 */
export function saveEquipmentAcceptanceDossier(equipmentId: string, dossier: EquipmentAcceptanceDossier): void {
  try {
    const storageKey = `wl_acceptance_dossier_${equipmentId}`;
    localStorage.setItem(storageKey, JSON.stringify(dossier));
  } catch (e) {
    console.error('保存验收档案失败:', e);
  }
}

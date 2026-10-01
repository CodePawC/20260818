import { MedicalEquipment } from '../types';

export interface AccessoryPresetOption {
  id: string;
  name: string;
  categoryTag: string;
  isDefaultSelected?: boolean;
}

export interface EquipmentAccessoryRecommendation {
  equipmentTypeTitle: string;
  recommendations: AccessoryPresetOption[];
  generalPresets: AccessoryPresetOption[];
}

/**
 * 根据设备名称、类别、型号智能匹配推荐的随借附件清单
 */
export function getRecommendedAccessoriesForEquipment(equipment?: MedicalEquipment | null): EquipmentAccessoryRecommendation {
  if (!equipment) {
    return {
      equipmentTypeTitle: '通用医疗设备',
      recommendations: DEFAULT_GENERAL_ACCESSORIES,
      generalPresets: DEFAULT_GENERAL_ACCESSORIES
    };
  }

  const text = `${equipment.name} ${equipment.model} ${equipment.category || ''} ${equipment.level1Category || ''} ${equipment.level2Category || ''}`.toLowerCase();

  // 1. 超声影像类
  if (text.includes('超声') || text.includes('彩超') || text.includes('多普勒') || text.includes('ultrasound')) {
    return {
      equipmentTypeTitle: '超声影像诊断设备',
      recommendations: [
        { id: 'us-pwr', name: '主机专用电源线与电源适配器', categoryTag: '供电', isDefaultSelected: true },
        { id: 'us-probe-cardio', name: '心脏相控阵探头 (Phase Array / S5-1)', categoryTag: '探头' },
        { id: 'us-probe-abdo', name: '腹部凸阵探头 (Convex / C5-1)', categoryTag: '探头', isDefaultSelected: true },
        { id: 'us-probe-linear', name: '浅表高频线阵探头 (Linear / L12-4)', categoryTag: '探头' },
        { id: 'us-probe-endo', name: '腔内/经阴道探头', categoryTag: '探头' },
        { id: 'us-cart', name: '便携专用防震推车与探头挂架', categoryTag: '配件', isDefaultSelected: true },
        { id: 'us-gel', name: '医用超声耦合剂 (备用装)', categoryTag: '耗材' },
        { id: 'us-box', name: '探头防尘抗震专用收纳保护箱', categoryTag: '防护', isDefaultSelected: true },
        { id: 'us-printer', name: '热敏视频图像打印机及连接线', categoryTag: '配件' }
      ],
      generalPresets: DEFAULT_GENERAL_ACCESSORIES
    };
  }

  // 2. 呼吸麻醉与急救转运类
  if (text.includes('呼吸机') || text.includes('麻醉机') || text.includes('无创呼吸') || text.includes('ventilator')) {
    return {
      equipmentTypeTitle: '呼吸麻醉与转运通气设备',
      recommendations: [
        { id: 'vent-pwr', name: '主机电源适配器及内置锂电池组', categoryTag: '供电', isDefaultSelected: true },
        { id: 'vent-circuit', name: '成人/儿童硅胶呼吸管路回路 (含集水杯)', categoryTag: '管路', isDefaultSelected: true },
        { id: 'vent-o2', name: '高压氧气连接软管 (国标快插接头)', categoryTag: '气源', isDefaultSelected: true },
        { id: 'vent-lung', name: '硅胶测试模拟肺 (定标测试专用)', categoryTag: '质控', isDefaultSelected: true },
        { id: 'vent-humidifier', name: '医用加热湿化器及加热导线', categoryTag: '配件' },
        { id: 'vent-valve', name: '呼气阀组件与近端流量传感器', categoryTag: '传感器', isDefaultSelected: true },
        { id: 'vent-cart', name: '急救转运病床挂架/移动推车', categoryTag: '配件', isDefaultSelected: true },
        { id: 'vent-mask', name: '口鼻无创呼吸面罩与头带固定套件', categoryTag: '耗材' }
      ],
      generalPresets: DEFAULT_GENERAL_ACCESSORIES
    };
  }

  // 3. 监护除颤与抢救生命支持类
  if (text.includes('除颤') || text.includes('监护') || text.includes('defibrillator') || text.includes('monitor')) {
    const isDefib = text.includes('除颤');
    return {
      equipmentTypeTitle: isDefib ? '心脏除颤起搏监护设备' : '多参数病人监护设备',
      recommendations: [
        { id: 'mon-pwr', name: '主机专用电源线与后备电池组', categoryTag: '供电', isDefaultSelected: true },
        { id: 'mon-ecg', name: '心电五导联/三导联电缆及导联线', categoryTag: '电缆', isDefaultSelected: true },
        { id: 'mon-spo2', name: '指夹式成人/儿童血氧探头 (SpO2)', categoryTag: '传感器', isDefaultSelected: true },
        { id: 'mon-nibp', name: '无创血压成人袖带与加长充气管 (NIBP)', categoryTag: '气管', isDefaultSelected: true },
        { id: 'mon-temp', name: '体表/体腔温度监测探头', categoryTag: '传感器' },
        ...(isDefib ? [
          { id: 'def-paddle', name: '成人/儿童一体式体外除颤电极板对', categoryTag: '电极', isDefaultSelected: true },
          { id: 'def-patch', name: '除颤起搏多功能电极贴片连接适配线', categoryTag: '电极' },
          { id: 'def-test', name: '除颤自检50Ω假负载测试接口', categoryTag: '质控' }
        ] : []),
        { id: 'mon-mount', name: '床旁快速锁紧挂架与把手', categoryTag: '配件', isDefaultSelected: true }
      ],
      generalPresets: DEFAULT_GENERAL_ACCESSORIES
    };
  }

  // 4. 心肺复苏机 / 按压机
  if (text.includes('按压') || text.includes('复苏') || text.includes('cpr') || text.includes('胸外')) {
    return {
      equipmentTypeTitle: '便携式心肺复苏按压设备',
      recommendations: [
        { id: 'cpr-pwr', name: '主机电源适配器与车载充电电缆', categoryTag: '供电', isDefaultSelected: true },
        { id: 'cpr-battery', name: '智能锂电池模块 (备用组*2)', categoryTag: '供电', isDefaultSelected: true },
        { id: 'cpr-board', name: '专用碳纤维轻质固定背板', categoryTag: '构件', isDefaultSelected: true },
        { id: 'cpr-cup', name: '胸部吸盘/按压柱套件', categoryTag: '配件', isDefaultSelected: true },
        { id: 'cpr-strap', name: '病人躯干稳定约束绑带组', categoryTag: '配件', isDefaultSelected: true },
        { id: 'cpr-bag', name: '防震防水应急急救便携包', categoryTag: '防护', isDefaultSelected: true }
      ],
      generalPresets: DEFAULT_GENERAL_ACCESSORIES
    };
  }

  // 5. 注射泵 / 输液泵 / 靶控泵
  if (text.includes('注射泵') || text.includes('输液泵') || text.includes('靶控') || text.includes('pump')) {
    return {
      equipmentTypeTitle: '微量输注与注射泵设备',
      recommendations: [
        { id: 'pump-pwr', name: '主机交流电源线及适配器', categoryTag: '供电', isDefaultSelected: true },
        { id: 'pump-clamp', name: '输液架万向旋转固定夹具', categoryTag: '配件', isDefaultSelected: true },
        { id: 'pump-drop', name: '红外光电滴速传感器 (输液泵专用)', categoryTag: '传感器' },
        { id: 'pump-bat', name: '内置可充电锂电池模块', categoryTag: '供电', isDefaultSelected: true },
        { id: 'pump-block', name: '注射器推杆锁止卡槽组件', categoryTag: '配件' }
      ],
      generalPresets: DEFAULT_GENERAL_ACCESSORIES
    };
  }

  // 6. 心电图机
  if (text.includes('心电图') || text.includes('ecg') || text.includes('ekg')) {
    return {
      equipmentTypeTitle: '十二导联心电图机',
      recommendations: [
        { id: 'ecg-pwr', name: '主机电源线与可靠接地引线', categoryTag: '供电', isDefaultSelected: true },
        { id: 'ecg-cable', name: '十二导联一体式心电患者电缆', categoryTag: '电缆', isDefaultSelected: true },
        { id: 'ecg-limb', name: '四肢夹心电电极 (红/黄/绿/黑 4只一套)', categoryTag: '电极', isDefaultSelected: true },
        { id: 'ecg-chest', name: '胸部吸球电极 (V1-V6 6只一套)', categoryTag: '电极', isDefaultSelected: true },
        { id: 'ecg-paper', name: '热敏心电记录纸 (已装填+备用1卷)', categoryTag: '耗材', isDefaultSelected: true },
        { id: 'ecg-bag', name: '便携收纳保护包', categoryTag: '防护' }
      ],
      generalPresets: DEFAULT_GENERAL_ACCESSORIES
    };
  }

  // 7. 内窥镜与微创手术系统
  if (text.includes('内窥镜') || text.includes('腔镜') || text.includes('胃镜') || text.includes('肠镜') || text.includes('硬镜') || text.includes('冷光源')) {
    return {
      equipmentTypeTitle: '医用内窥镜与微创摄像设备',
      recommendations: [
        { id: 'endo-optical', name: '内窥镜镜头光学组件 (0°/30°硬镜或电子软镜)', categoryTag: '镜头', isDefaultSelected: true },
        { id: 'endo-fiber', name: '冷光源高导光光纤光缆', categoryTag: '光纤', isDefaultSelected: true },
        { id: 'endo-video', name: '高清/4K视频传输信号电缆', categoryTag: '电缆', isDefaultSelected: true },
        { id: 'endo-box', name: '镜头专用密闭消毒转运盒', categoryTag: '防护', isDefaultSelected: true },
        { id: 'endo-cap', name: '防水盖与镜头光学保护帽', categoryTag: '防护', isDefaultSelected: true },
        { id: 'endo-valve', name: '气腹机高压注气管路与减压阀', categoryTag: '管路' }
      ],
      generalPresets: DEFAULT_GENERAL_ACCESSORIES
    };
  }

  // 8. 医用影像与X射线设备 (DR / C臂 / DSA / 移动X光)
  if (text.includes('x射线') || text.includes('血管造影') || text.includes('dr') || text.includes('c臂') || text.includes('ct')) {
    return {
      equipmentTypeTitle: '医用放射影像诊断设备',
      recommendations: [
        { id: 'rad-switch', name: '手控曝光手闸及弹簧伸缩控制线', categoryTag: '控制', isDefaultSelected: true },
        { id: 'rad-fpd', name: '无线数字平板探测器 (FPD)', categoryTag: '探测器', isDefaultSelected: true },
        { id: 'rad-bat', name: '平板探测器专用锂电池与双槽充电座', categoryTag: '供电', isDefaultSelected: true },
        { id: 'rad-lead', name: '医用防护铅衣、铅围脖与铅眼镜套件', categoryTag: '防护', isDefaultSelected: true },
        { id: 'rad-cal', name: '几何定标校准板/剂量质控体模', categoryTag: '质控' }
      ],
      generalPresets: DEFAULT_GENERAL_ACCESSORIES
    };
  }

  // 9. 升降温与控温设备 (控温毯 / 输血加温仪)
  if (text.includes('温') || text.includes('毯') || text.includes('加温') || text.includes('降温')) {
    return {
      equipmentTypeTitle: '医用控温与体温管理设备',
      recommendations: [
        { id: 'temp-pwr', name: '主机专用电源线与地线', categoryTag: '供电', isDefaultSelected: true },
        { id: 'temp-blanket', name: '水循环循环毯垫/加温套毯', categoryTag: '耗材', isDefaultSelected: true },
        { id: 'temp-pipe', name: '快速自密封循环水管管路', categoryTag: '管路', isDefaultSelected: true },
        { id: 'temp-sensor', name: '连续体温监测体表/直肠探头', categoryTag: '传感器', isDefaultSelected: true }
      ],
      generalPresets: DEFAULT_GENERAL_ACCESSORIES
    };
  }

  // 10. 默认通用医疗设备
  return {
    equipmentTypeTitle: '通用临床医疗设备',
    recommendations: DEFAULT_GENERAL_ACCESSORIES,
    generalPresets: DEFAULT_GENERAL_ACCESSORIES
  };
}

export const DEFAULT_GENERAL_ACCESSORIES: AccessoryPresetOption[] = [
  { id: 'gen-pwr', name: '主机专用电源线与电源适配器', categoryTag: '供电', isDefaultSelected: true },
  { id: 'gen-manual', name: '中文临床操作规程与应急手册', categoryTag: '文档', isDefaultSelected: true },
  { id: 'gen-cable', name: '专用传感器与信号连接导线组', categoryTag: '电缆', isDefaultSelected: true },
  { id: 'gen-cart', name: '设备专用移动推车/床旁固定支架', categoryTag: '支架' },
  { id: 'gen-cover', name: '专用防尘防护罩与收纳箱', categoryTag: '防护' },
  { id: 'gen-parts', name: '标准随机备件与易损消耗品包', categoryTag: '备件' }
];

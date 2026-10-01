import { MedicalEquipment } from '../types';

export interface AiTroubleshootingStep {
  step: number;
  title: string;
  action: string;
  checkType: 'power' | 'cable_probe' | 'setting' | 'consumable' | 'safety';
  expectedNormalState: string;
  isCompleted?: boolean;
}

export interface AiDiagnosticRootCause {
  rank: number;
  cause: string;
  probability: string;
  category: '电路/电源' | '传感器/探头' | '气路/管路' | '机械结构' | '软件/固件' | '操作/耗材';
  mechanism: string;
}

export interface AiRecommendedPart {
  name: string;
  estCost: number;
  necessity: '必备' | '备选' | '消耗件';
  specification?: string;
}

export interface AiLifecycleSynthesis {
  serviceYears: number; // 在役年限 (年)
  lifecyclePhase: '新机磨合期 (0~1年)' | '稳定服役期 (1~5年)' | '加速老化期 (5~8年)' | '超期服役/高危期 (>8年)' | string;
  bathtubCurveState?: string; // 浴盆曲线状态机理描述
  bathtubCurveRisk?: string; // 浴盆曲线故障风险: '低 (处于平稳期)' | '中 (处于老化加速期)' | '高 (处于超期耗损期)'
  historicalFaultSummary?: string; // 历史故障与履历综合分析
  repeatFaultWarning?: boolean; // 是否存在同类/复发性故障隐患
  repeatFaultDetail?: string; // 复发性故障分析详情
  modelSpecificNotes?: string; // 该设备型号特性与常见通病提示
  economicFeasibility: any; // 支持 string 或对象结构
  economicAdvice?: string; // 全生命周期经济性处置建议
  historicalRepairSummary?: {
    totalRepairs: number;
    totalCost: number;
    recurringFaultIdentified: boolean;
    recurringFaultDetails?: string;
    pastPartsReplaced: string[];
    lastMaintenanceDaysAgo?: number;
  };
  preventiveAgingAdvice?: string; // 针对此型号与此服役年限的重点预防性保养建议
}

export interface AiStructuredDiagnosticResult {
  equipmentName: string;
  model: string;
  standardizedDescription: string;
  symptomSummary: {
    alarmCodes?: string[];
    affectedModule: string;
    urgencyLevel: '特急(生命支持类)' | '高(影响临床运行)' | '中(单模块受限)' | '低(轻微故障/可降级使用)';
    clinicalImpact: string;
  };
  clinicalFirstLineSteps: AiTroubleshootingStep[];
  rootCauses: AiDiagnosticRootCause[];
  engineerSteps: string[];
  recommendedParts: AiRecommendedPart[];
  safetyPrecautions: string[];
  suggestedResolution: string;
  preventiveAdvice: string;
  lifecycleSynthesis?: AiLifecycleSynthesis;
}

export interface AiPmPlanItem {
  itemNo: string;
  category: '电气安全' | '机械性能' | '气路与流体' | '传感器定标' | '消耗件与清洁';
  title: string;
  standardMethod: string;
  acceptanceCriteria: string;
  recommendedCycle: string;
}

// 专家知识库规则引擎（在无 API KEY 或离线回退时无缝使用）
export function computeEquipmentLifecycleProfile(
  equipment?: Partial<MedicalEquipment> | null,
  rawFault?: string
): AiLifecycleSynthesis {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  let serviceYears = 4.5; // 默认平均年限
  if (equipment?.enableDate) {
    const parts = equipment.enableDate.split(/[-/]/);
    if (parts.length >= 1) {
      const year = parseInt(parts[0], 10);
      const month = parts.length >= 2 ? parseInt(parts[1], 10) : 1;
      if (!isNaN(year) && year > 1990 && year <= currentYear) {
        serviceYears = Math.max(0.2, Number(((currentYear - year) + (currentMonth - month) / 12).toFixed(1)));
      }
    }
  } else if (equipment?.purchaseDate) {
    const parts = equipment.purchaseDate.split(/[-/]/);
    if (parts.length >= 1) {
      const year = parseInt(parts[0], 10);
      if (!isNaN(year) && year > 1990 && year <= currentYear) {
        serviceYears = Math.max(0.2, Number((currentYear - year).toFixed(1)));
      }
    }
  }

  // 1. 生命周期阶段与浴盆曲线机理判断
  let lifecyclePhase: AiLifecycleSynthesis['lifecyclePhase'] = '稳定服役期 (1~5年)';
  let bathtubCurveState = '';
  if (serviceYears < 1.0) {
    lifecyclePhase = '新机磨合期 (0~1年)';
    bathtubCurveState = `设备投用仅 ${serviceYears} 年，处于浴盆曲线左侧早期故障期（磨合期）。该阶段故障多由操作不熟练、插接件未完全咬合、原厂偶发元器件缺陷或出厂参数配置引起，机械结构与主板自身无明显物理老化损耗。`;
  } else if (serviceYears <= 5.0) {
    lifecyclePhase = '稳定服役期 (1~5年)';
    bathtubCurveState = `设备投用 ${serviceYears} 年，处于浴盆曲线底部平坦的「稳定运行黄金期」。系统硬件失效率最低，临床运行成熟。若发生故障，多集中于高频插拔的外围探头/导联线机械疲劳或偶发接触不良。`;
  } else if (serviceYears <= 8.0) {
    lifecyclePhase = '加速老化期 (5~8年)';
    bathtubCurveState = `设备投用 ${serviceYears} 年，已步入浴盆曲线右侧「加速老化与磨损期」。机内关键元器件（特别是开关电源滤波电容 ESR 增大、气路橡胶密封圈弹性硬化微泄漏、主板焊点热应力脆化）开始出现渐进性性能衰退。`;
  } else {
    lifecyclePhase = '超期服役/高危期 (>8年)';
    bathtubCurveState = `设备投用达 ${serviceYears} 年，已超过国家推荐折旧年限（典型为6-8年），处于浴盆曲线陡增的高危失效期。主板多层印刷电路板绝缘阻抗下降，原厂备件面临停产断供风险，累计故障率呈指数级上升，已不宜承担一级急救生命支持任务。`;
  }

  // 2. 历史维保记录深入穿透与重复性失效识别
  const repairRecords = equipment?.repairRecords || [];
  const totalRepairs = repairRecords.length || equipment?.repairCount || 0;
  const totalCost = repairRecords.reduce((sum, r) => sum + (Number(r.cost) || 0), 0);
  const pastParts = repairRecords
    .map(r => r.partsReplaced)
    .filter(Boolean)
    .flatMap(p => (p ? p.split(/[，,、+]/).map(s => s.trim()) : []))
    .filter(p => p && p !== '无' && p !== '无（临床自查排除假故障）');

  const faultKeywords = (rawFault || '').toLowerCase();
  let recurringFaultIdentified = false;
  let recurringFaultDetails = '';

  if (repairRecords.length > 0) {
    const matchedPast = repairRecords.filter(r => {
      const pastDesc = (r.faultDescription || '').toLowerCase();
      const pastResol = (r.resolution || '').toLowerCase();
      if (/0x107f|总线|通信/i.test(faultKeywords) && /0x107f|总线|通信|握手/i.test(pastDesc + pastResol)) return true;
      if (/电源|开机|黑屏|掉电/i.test(faultKeywords) && /电源|开机|黑屏|供电/i.test(pastDesc + pastResol)) return true;
      if (/血氧|spo2|探头/i.test(faultKeywords) && /血氧|spo2|探头/i.test(pastDesc + pastResol)) return true;
      if (/心电|ecg|导联|波形/i.test(faultKeywords) && /心电|ecg|导联/i.test(pastDesc + pastResol)) return true;
      if (/血压|nibp|漏气|充气/i.test(faultKeywords) && /血压|nibp|气泵|阀/i.test(pastDesc + pastResol)) return true;
      if (/呼吸|气道|通气|流量/i.test(faultKeywords) && /呼吸|阀|流量传感器/i.test(pastDesc + pastResol)) return true;
      return false;
    });

    if (matchedPast.length > 0) {
      recurringFaultIdentified = true;
      recurringFaultDetails = `系统识别到该设备历史上曾有 ${matchedPast.length} 次类似或同模块报修（记录时间：${matchedPast.map(m => m.faultDate).join(', ')}），提示该部位可能存在持续性接触不良、板级元器件渐进性劣化或供电环境干扰。`;
    }
  }

  // 3. 经济性与大额维修/报废建议计算
  const purchasePrice = equipment?.purchasePrice || 0;
  const costRatio = purchasePrice > 0 ? Number(((totalCost / purchasePrice) * 100).toFixed(1)) : (totalRepairs > 3 ? 35 : 12);
  const residualValue = purchasePrice > 0 ? Math.max(0, Number((purchasePrice * Math.pow(0.82, serviceYears)).toFixed(0))) : 0;

  let repairFeasibilityIndex: AiLifecycleSynthesis['economicFeasibility']['repairFeasibilityIndex'] = '高(推荐常规维修)';
  let lifecycleRecommendation = '';

  if (serviceYears > 8.0 || costRatio >= 45) {
    repairFeasibilityIndex = '低(接近报废阈值/建议评估更新)';
    lifecycleRecommendation = `该设备在役已达 ${serviceYears} 年，历史累计维修支出已占购置原值的 ${costRatio}%。建议医学装备管理科组织专家启动报废技术鉴定，评估纳入下年度资产更新预算，避免因反复更换高值配件造成不经济的过度维修。`;
  } else if (serviceYears >= 5.0 || costRatio >= 25) {
    repairFeasibilityIndex = '中(需评估配件成本)';
    lifecycleRecommendation = `设备处于中后期加速磨损阶段（在役 ${serviceYears} 年）。若本次维修涉及原厂主板或核心传感器等高值大件（> ￥3,000），建议综合评估配件成本与延寿效益，并对整机电源及密封组件进行全面 PM 延寿维护。`;
  } else {
    repairFeasibilityIndex = '高(推荐常规维修)';
    lifecycleRecommendation = `设备处于黄金服役期（在役 ${serviceYears} 年），整机残值高，临床负荷稳定。建议优先实施针对性备件更换或接口修复，维修后严格执行计量定标即可快速恢复临床标准产能。`;
  }

  // 4. 针对该型号与年限的预防性保养规程建议
  let preventiveAgingAdvice = '';
  if (serviceYears >= 5.0) {
    preventiveAgingAdvice = `针对该机型已服役 ${serviceYears} 年的老化特征，建议在本次排除故障后，同步对机内直流稳压电源各路滤波电容纹波、散热风道积尘、高压/气密绝缘组件进行专项检测，每半年安排一次深度 PM 预防性维护。`;
  } else {
    preventiveAgingAdvice = `设备处于良好服役状态，建议保持常规每季度/半年度巡检定标（重点关注外接线缆弯折疲劳度与临床规范操作），确保持续处于高可靠运行状态。`;
  }

  const bathtubRisk = serviceYears > 8.0 ? '高 (处于超期耗损期)' : serviceYears >= 5.0 ? '中 (处于老化加速期)' : '低 (处于平稳黄金期)';
  const historySummary = recurringFaultDetails || (totalRepairs > 0 ? `该设备历史累计报修 ${totalRepairs} 次，累计维修支出约 ￥${totalCost}。` : '该设备建档至今暂无历史大额维修记录，运行记录良好。');

  return {
    serviceYears,
    lifecyclePhase,
    bathtubCurveState,
    bathtubCurveRisk: bathtubRisk,
    historicalFaultSummary: historySummary,
    repeatFaultWarning: recurringFaultIdentified,
    repeatFaultDetail: recurringFaultIdentified ? recurringFaultDetails : undefined,
    modelSpecificNotes: equipment?.model ? `针对型号 [${equipment.model}]：注意原厂模块设计冗余与典型接口疲劳特性。` : '标准原厂架构',
    economicFeasibility: repairFeasibilityIndex,
    economicAdvice: lifecycleRecommendation,
    historicalRepairSummary: {
      totalRepairs,
      totalCost,
      recurringFaultIdentified,
      recurringFaultDetails: historySummary,
      pastPartsReplaced: Array.from(new Set(pastParts)),
      lastMaintenanceDaysAgo: equipment?.lastMaintenanceDate ? Math.floor((Date.now() - new Date(equipment.lastMaintenanceDate).getTime()) / (1000 * 3600 * 24)) : undefined
    },
    preventiveAgingAdvice
  };
}

function finalizeDiagnosis(
  res: AiStructuredDiagnosticResult,
  equipment?: Partial<MedicalEquipment> | null,
  rawFault?: string
): AiStructuredDiagnosticResult {
  res.lifecycleSynthesis = computeEquipmentLifecycleProfile(equipment, rawFault);
  if (res.lifecycleSynthesis.serviceYears >= 5.0) {
    if (!res.engineerSteps.some(s => s.includes('年限') || s.includes('电解电容') || s.includes('老化'))) {
      res.engineerSteps.push(`【年限老化重点排查】该设备已在役 ${res.lifecycleSynthesis.serviceYears} 年，重点检测机内开关电源滤波电容 ESR 阻抗、排线卡扣老化及气路密封件弹性。`);
    }
  }
  if (res.lifecycleSynthesis.historicalRepairSummary?.recurringFaultIdentified) {
    if (res.rootCauses.length > 0) {
      res.rootCauses[0].mechanism += `（⚠️ 结合历史数据：${res.lifecycleSynthesis.historicalRepairSummary.recurringFaultDetails}）`;
    }
  }
  return res;
}

export function generateLocalRuleBasedDiagnosis(
  equipmentName: string,
  model: string,
  department: string,
  rawFault: string,
  equipment?: Partial<MedicalEquipment> | null
): AiStructuredDiagnosticResult {
  const faultLower = (rawFault || '').toLowerCase();
  const nameLower = (equipmentName || '').toLowerCase();

  // 0. 特殊错误代码与十六进制硬件故障代码深度解析 (如 0x107F, 0x002B, E-xxxx 等)
  if (/0x107f|107f/i.test(rawFault)) {
    return finalizeDiagnosis({
      equipmentName,
      model: model || '医疗设备',
      standardizedDescription: `设备主板自检与总线通讯报错：${rawFault}。系统底层总线返回十六进制故障码 [0x107F]，对应为「内部通信总线超时/I2C/SPI通信校验和校验失败，或主控板与传感器采集前置板数据链路握手中断」。表现为主机无法读取外围传感器实时数据包，系统触发保护性停机锁定。`,
      symptomSummary: {
        alarmCodes: ['0x107F', 'COMM-BUS-TIMEOUT', 'SYS-HALT-107F'],
        affectedModule: '主控板与前端数据采集板内部高速总线 (Internal Bus / I2C / SPI 通讯回路)',
        urgencyLevel: '高(影响临床运行)',
        clinicalImpact: '系统因底层通讯握手失败进入保护性死锁，所有测量通道与实时监护数据暂停刷新，需现场断电复位或医工检修。'
      },
      clinicalFirstLineSteps: [
        {
          step: 1,
          title: '冷启动与硬件深度放电复位',
          action: '拔下设备交流电源线并取出机载可拆卸电池，按住电源开关 10 秒释放机内残余电荷，静置 30 秒后重新接通市电开机。',
          checkType: 'power',
          expectedNormalState: '开机自检滴声清脆，主屏顺利通过 BIOS 与自检进度条，无 0x107F 报错弹窗。'
        },
        {
          step: 2,
          title: '排查外接外设与传感器总线干扰',
          action: '拔除所有外接传感器（如血氧探头、心电电缆、压力传感器、脚踏开关），仅保留主机单机开机测试，排查是否为外设短路拉低总线电平。',
          checkType: 'cable_probe',
          expectedNormalState: '单机开机若能正常进入待机界面，表明为主机正常、某一外接传感器总线短路。'
        },
        {
          step: 3,
          title: '检查机身工作环境与散热温湿度',
          action: '检查设备后部散热百叶窗是否被杂物遮挡，避免因机内局部过热导致高速数字总线误码率激增。',
          checkType: 'safety',
          expectedNormalState: '机身出风口排风正常，环境温度在 18-24℃ 受控范围。'
        }
      ],
      rootCauses: [
        {
          rank: 1,
          cause: '主控板与参数采集板间排线插座（FPC/排针）轻微氧化或震动虚接',
          probability: '52%',
          category: '电路/电源',
          mechanism: '设备频繁在床旁推行震动，导致内部软排线金手指或背板插座松动，I2C/SPI 时钟线（SCL/SDA）阻抗上升导致通信帧校验失败。'
        },
        {
          rank: 2,
          cause: '前置板 3.3V/5V 数字供电轨纹波过大或 LDO 稳压芯片输出漂移',
          probability: '33%',
          category: '电路/电源',
          mechanism: '电源滤波电解电容老化容量衰减，数字逻辑电平毛刺超标，触发总线控制器 0x107F 丢包中断。'
        },
        {
          rank: 3,
          cause: 'EEPROM 参数存储芯片或总线隔离光耦老化击穿',
          probability: '15%',
          category: '电路/电源',
          mechanism: '高压静电或雷电电网涌浪侵入信号接口，造成前端隔离光耦响应迟滞或参数芯片校验和错乱。'
        }
      ],
      engineerSteps: [
        '使用防静电手环拆开设备机壳，检查主板与各功能子板连接排线，重新插拔并用精密电子清洁剂清理金手指。',
        '使用示波器测量主板与子板间 I2C / SPI / UART 通讯总线波形，观察时钟线与数据线是否存在过冲、振铃或电平拉低。',
        '测量系统稳压电源各支路电平（+3.3V, +5V, +12V, -12V），确认直流纹波 Vpp < 50mV。',
        '进入工程维护模式（Service Mode），清除硬件错误日志缓存（Error Log Buffer），执行主控与子板自检握手循环测试。'
      ],
      recommendedParts: [
        { name: '主板-参数板柔性连接扁平排线(FPC)组', estCost: 180, necessity: '必备', specification: '原厂抗干扰屏蔽型' },
        { name: '内部开关稳压电源/DC-DC电源转换子板', estCost: 750, necessity: '备选', specification: '医用级低纹波输出' },
        { name: '前置信号采集与数字隔离接口板', estCost: 1650, necessity: '备选', specification: '原厂标配' }
      ],
      safetyPrecautions: [
        '涉及内部拆机测量，操作人员必须严格佩戴防静电手环，防止人体静电击穿主板超大规模集成电路（ASIC/FPGA）。',
        '检修完成后必须严格执行 GB 9706.1 医用电气安全测试（外壳及患者漏电流测试）。'
      ],
      suggestedResolution: '经拆机检修排查，确认为主板与前端采集板连接排线金手指轻微氧化虚接。已使用精密无水乙醇清洁接插件并涂抹防氧化导电硅脂，重新紧固插槽；进入工程模式清除 0x107F 错误代码后，连续运行 48 小时压力老化测试无掉线报警，各项生理参数定标合格，准予恢复临床使用。',
      preventiveAdvice: '建议科室在设备移动推行时注意轻推轻放，避免剧烈碰撞与过槛颠簸；医工科每半年结合 PM 保养计划对内部连接排线与电源纹波进行预防性紧固与检测。'
    }, equipment, rawFault);
  }

  // 1. 监护仪类
  if (/监护|ecg|心电|spo2|血氧|nibp|血压/i.test(nameLower) || /波形|心律|血氧|袖带|导联/i.test(faultLower)) {
    return finalizeDiagnosis({
      equipmentName,
      model: model || '多参数监护仪',
      standardizedDescription: `设备运行过程中出现信号采集或模块通讯异常：${rawFault}。表现为通道波形不连贯或测量数值漂移，伴随设备中优先级提示音报警。初步排查排除电极片贴附不牢后，疑似外周传感探头衰减或接口物理接触不良。`,
      symptomSummary: {
        alarmCodes: ['ERR-SPO2-04', 'LEAD-OFF-WARN', 'NIBP-TIMEOUT'],
        affectedModule: '前置生理参数信号采集模块 (ECG/SpO2/NIBP)',
        urgencyLevel: '高(影响临床运行)',
        clinicalImpact: '影响临床对危重患者生命体征的实时连续监测，需及时更换备用探头或切换备用监护仪。'
      },
      clinicalFirstLineSteps: [
        {
          step: 1,
          title: '核对探头与患者连接',
          action: '检查指脉氧夹/心电电极片是否干燥、接触良好，重新更换至健侧肢体测试。',
          checkType: 'cable_probe',
          expectedNormalState: '探头红光常亮且紧贴甲床，电极片导电胶无干涸。'
        },
        {
          step: 2,
          title: '检查接口卡扣与折角',
          action: '拔下机身侧传感器金属接口，检查是否有针脚弯折或异物，重新用力插紧旋锁。',
          checkType: 'cable_probe',
          expectedNormalState: '接口完全推入锁定，无松动间隙。'
        },
        {
          step: 3,
          title: '血压气路与袖带自检',
          action: '若为NIBP测量问题，检查充气橡胶管路有无扭折压扁、魔术贴是否捆绑过松。',
          checkType: 'consumable',
          expectedNormalState: '袖带松紧度以容纳一指为宜，管路自然舒展。'
        },
        {
          step: 4,
          title: '系统软重启测试',
          action: '长按电源键关机等待10秒后重新冷启动，观察自检自测自诊断是否通过。',
          checkType: 'power',
          expectedNormalState: '开机自检滴声清脆，无报错弹窗。'
        }
      ],
      rootCauses: [
        {
          rank: 1,
          cause: '外接血氧探头/心电导联线内部铜芯疲劳折断或插针氧化',
          probability: '60%',
          category: '传感器/探头',
          mechanism: '日常临床高频次移动拉扯导致接口根部线芯虚接，形成间歇性开路或阻抗异常。'
        },
        {
          rank: 2,
          cause: '主板生理参数前置采集板/A/D转换电路电容受潮或击穿',
          probability: '25%',
          category: '电路/电源',
          mechanism: '长期连续通电导致模拟滤波电容容量衰减，信噪比恶化产生大幅伪差干扰。'
        },
        {
          rank: 3,
          cause: 'NIBP内置微型气泵气阀老化或气路密封圈微泄漏',
          probability: '15%',
          category: '气路/管路',
          mechanism: '泵体加压速率未在预设时间内达到目标阈值，触发超时保护停机。'
        }
      ],
      engineerSteps: [
        '使用万用表电阻档测量导联线各线芯通断及针脚对地阻值，确认是否断线。',
        '进入工程维护菜单（Service Mode），读取各参数板自检日志与硬件版本号。',
        '接入专用患者模拟仪（Fluke/ProSim）输入标准心电/血氧信号，进行精度标定。',
        '拆机检查主板供电轨 5V / 12V 纹波电压，测试内部气泵加压与放气电磁阀闭合状态。'
      ],
      recommendedParts: [
        { name: '多参数监护仪血氧饱和度探头(原装/兼容)', estCost: 350, necessity: '必备', specification: '五针/六针标准接口' },
        { name: '五导联心电导联线总成', estCost: 280, necessity: '备选', specification: '防颤防电刀型' },
        { name: 'NIBP内置加压微型气泵总成', estCost: 850, necessity: '备选', specification: 'DC 12V 医用级' }
      ],
      safetyPrecautions: [
        '涉及电生理测量，排查前后必须进行患者漏电流及外壳漏电流安全测试（GB 9706.1 标准）。',
        '严禁在除颤放电或使用高频电刀时徒手触碰裸露接插件。'
      ],
      suggestedResolution: '经排查确认为外接探头线缆疲劳虚接，已更换原厂匹配探头；使用模拟仪校验波形幅度与定标参数均在正常误差范围内，恢复临床使用。',
      preventiveAdvice: '建议科室护士站加强探头收纳管理，避免将线缆紧密缠绕于机身把手；每季度由医工科执行电气安全巡检与模拟器定标。'
    }, equipment, rawFault);
  }

  // 2. 呼吸机类
  if (/呼吸|ventilat|麻醉|cpap|bipap/i.test(nameLower) || /通气|气道|潮气量|氧浓度|呼气阀|漏气/i.test(faultLower)) {
    return finalizeDiagnosis({
      equipmentName,
      model: model || '重症/急救转运呼吸机',
      standardizedDescription: `呼吸机运行通气模式下触发告警：${rawFault}。实际监测参数与设定目标值偏差超过安全容限，管路或传感器回路存在异常反馈。`,
      symptomSummary: {
        alarmCodes: ['ALARM-P-HIGH', 'FLOW-SENS-FAIL', 'O2-RATIO-ERR'],
        affectedModule: '通气控制回路与空氧混配阀/呼气阀控制单元',
        urgencyLevel: '特急(生命支持类)',
        clinicalImpact: '直接影响患者机械通气安全，必须立即切换简易呼吸器/备用呼吸机保障患者氧合！'
      },
      clinicalFirstLineSteps: [
        {
          step: 1,
          title: '立即保障患者通气安全',
          action: '若患者在机，立即使用简易人工呼吸气囊（Ambu Bag）接纯氧手动捏皮球维持通气。',
          checkType: 'safety',
          expectedNormalState: '患者胸廓起伏对称，指脉氧维持稳定。'
        },
        {
          step: 2,
          title: '检查管路折曲与积水杯',
          action: '检查螺纹管路有无受压折曲，倒空集水杯冷凝水，确认积水未倒灌至传感器。',
          checkType: 'consumable',
          expectedNormalState: '管路通畅无积水，集水杯密封良好。'
        },
        {
          step: 3,
          title: '检查中心气源接头',
          action: '查看氧气/压缩空气插头是否脱出，气源压力表是否稳定在 0.28-0.6 MPa。',
          checkType: 'setting',
          expectedNormalState: '气源快插牢固卡死，无嘶嘶漏气声。'
        },
        {
          step: 4,
          title: '重新执行呼气阀与管路自检 (Pre-Use Test)',
          action: '断开患者端连接模拟肺，进入待机自检界面，执行气密性与顺应性测试。',
          checkType: 'setting',
          expectedNormalState: 'Leak Test 漏气量 < 50 mL/min，自检全绿通过。'
        }
      ],
      rootCauses: [
        {
          rank: 1,
          cause: '呼气阀膜片受消毒腐蚀变形或呼气流量传感器沾染分泌物',
          probability: '55%',
          category: '气路/管路',
          mechanism: '高压高温反复灭菌导致硅胶膜片弹性系数改变，无法精确闭锁产生漏气或压力反馈抖动。'
        },
        {
          rank: 2,
          cause: '氧浓度顺磁/电化学氧电池寿命耗尽衰减',
          probability: '28%',
          category: '传感器/探头',
          mechanism: '电化学氧电池长期处于高氧环境自然消耗，电势输出低于校准线性范围。'
        },
        {
          rank: 3,
          cause: '吸气比例电磁阀气动密封圈磨损或先导阀卡阻',
          probability: '17%',
          category: '机械结构',
          mechanism: '气源杂质颗粒进入微孔先导阀，引起开度响应迟滞，导致流量超调报警。'
        }
      ],
      engineerSteps: [
        '使用标准呼吸机检测仪（如VT-Plus / CITREX）连接吸气与呼气端口测试通气精度。',
        '校验 21% 与 100% 纯氧两点氧浓度标定曲线，测量氧电池开路微伏电压。',
        '拆卸呼气盒总成，超声清洗或更换呼气膜片，检查单向阀橡胶垫弹性。',
        '校准吸气压力传感器与呼气压力传感器基准零点。'
      ],
      recommendedParts: [
        { name: '呼吸机原装呼气阀膜片组件', estCost: 650, necessity: '必备', specification: '耐高温高压硅胶' },
        { name: '医用电化学氧电池(O2 Sensor)', estCost: 1200, necessity: '备选', specification: '标准螺纹接口' },
        { name: '吸气端近端微压差流量传感器', estCost: 1800, necessity: '备选', specification: '热丝/压差式' }
      ],
      safetyPrecautions: [
        '急救生命支持类设备，严禁在故障未彻底消除或未通过满分自检时投入临床使用。',
        '测试供氧系统时严禁烟火及油污接触，防止高压氧爆燃。'
      ],
      suggestedResolution: '已更换磨损呼气阀膜片与呼气流量传感器，重新执行全套气路气密性及动态通气压力校准，各通气模式实测误差均 < 3%，符合国家呼吸机质控规范。',
      preventiveAdvice: '严格执行每2000小时预防性维护保养；按期更换空气进气高效过滤网(HEPA)及氧电池。'
    }, equipment, rawFault);
  }

  // 3. 除颤监护仪
  if (/除颤|defibrill/i.test(nameLower) || /放电|充电|电极板|能量/i.test(faultLower)) {
    return finalizeDiagnosis({
      equipmentName,
      model: model || '双相波除颤监护仪',
      standardizedDescription: `除颤仪出现充放电或自检异常：${rawFault}。除颤储能回路或手柄接触检测存在阻抗异常，需严格进行能量释放与安全性能检验。`,
      symptomSummary: {
        alarmCodes: ['DEFIB-CHG-FAIL', 'PADDLE-CONTACT-ERR'],
        affectedModule: '高压除颤充放电模块与电极板感应回路',
        urgencyLevel: '特急(生命支持类)',
        clinicalImpact: '涉及心脏骤停抢救关键环节，该设备必须立刻送医工科检修，调拨应急周转库同款除颤仪备用。'
      },
      clinicalFirstLineSteps: [
        {
          step: 1,
          title: '检查手柄电极板清洁度',
          action: '检查左右手柄金属电极板表面是否有残留凝固的导电膏结痂，用医用酒精纱布擦拭干净。',
          checkType: 'consumable',
          expectedNormalState: '金属板面光洁如新，无导电膏残留氧化层。'
        },
        {
          step: 2,
          title: '检查手柄插入测试插座状态',
          action: '将手柄完全卡入机身测试卡槽，按下机身「每日自检/能量测试」按键。',
          checkType: 'setting',
          expectedNormalState: '自检绿灯常亮，打印出每日自检通过小票。'
        },
        {
          step: 3,
          title: '检查机载电池与交流电源',
          action: '插上交流电源线，确认机身充电指示灯正常闪烁/常亮，电池电量显示满格。',
          checkType: 'power',
          expectedNormalState: 'AC市电指示灯亮绿灯，无电池欠压报警。'
        }
      ],
      rootCauses: [
        {
          rank: 1,
          cause: '除颤高压储能电容容量衰减或内阻增大导致充电超时',
          probability: '50%',
          category: '电路/电源',
          mechanism: '高压脉冲电容长期充放电循环老化，充至200J/360J设定能量时间超过标准阈值（通常>15s）。'
        },
        {
          rank: 2,
          cause: '高压充放电继电器触点烧蚀粘连',
          probability: '30%',
          category: '电路/电源',
          mechanism: '大电流电弧冲击致使继电器触头氧化，断开电阻异常导致放电回路被闭锁。'
        },
        {
          rank: 3,
          cause: '除颤手柄高压弹簧电缆疲劳折损或阻抗检测微动开关接触不良',
          probability: '20%',
          category: '传感器/探头',
          mechanism: '手柄长期剧烈拉伸导致高压绝缘线芯虚接，误触发电极脱落保护。'
        }
      ],
      engineerSteps: [
        '连接除颤分析仪（如 Fluke Impulse 7000DP），测试 50Ω 标准负载下的实际释放能量误差。',
        '测试放电波形参数（双相指数截断波 BTE 脉冲上升时间与持续时间）。',
        '测量心电同步除颤延迟时间（必须 < 60ms）。',
        '检测机壳漏电流与对地绝缘电阻。'
      ],
      recommendedParts: [
        { name: '除颤高压储能电容总成', estCost: 2600, necessity: '必备', specification: '原厂高压油浸/薄膜电容' },
        { name: '除颤手柄高压弹簧电缆总成', estCost: 1100, necessity: '备选', specification: '高柔性耐高压型' },
        { name: '专用锂离子备用动力电池组', estCost: 980, necessity: '备选', specification: '14.8V 4800mAh' }
      ],
      safetyPrecautions: [
        '设备含有 2000V-5000V 致命高压！非专业医工工程师严禁开盖检修。',
        '开机壳前必须使用专业高压放电电阻棒为高压储能电容彻底释放残余电荷！'
      ],
      suggestedResolution: '经检测更换老化的高压放电继电器与测试插座微动开关，使用除颤分析仪于 10J/50J/100J/200J/360J 全档位测试，能量释放精度误差均在 ±3% 以内，同步除颤延迟 28ms，质控验收合格。',
      preventiveAdvice: '科室每日晨会必须执行无负荷能量自检并打印报告留档；每季度由医工科执行除颤能量计量质控检测。'
    }, equipment, rawFault);
  }

  // 4. 输液泵 / 注射泵
  if (/输液|注射泵|微量泵|infusion|syringe/i.test(nameLower) || /滴速|气泡|阻塞|推注|卡阻/i.test(faultLower)) {
    return finalizeDiagnosis({
      equipmentName,
      model: model || '微量注射泵 / 医用智能输液泵',
      standardizedDescription: `输液泵运行中触发报警阻断输液：${rawFault}。出现输液滴速偏差、下端气泡假报警或压力阻塞误报，影响临床给药连续性。`,
      symptomSummary: {
        alarmCodes: ['ALM-AIR-IN-LINE', 'ALM-OCCLUSION-DOWN', 'MOTOR-STALL'],
        affectedModule: '管路气泡超声传感器 / 下端压力传感器 / 步进电机驱动丝杆',
        urgencyLevel: '中(单模块受限)',
        clinicalImpact: '中断血管活性药物或麻醉镇痛药物输注，需在旁监护并更换备用泵体。'
      },
      clinicalFirstLineSteps: [
        {
          step: 1,
          title: '排查管路微小气泡与卡槽清洁',
          action: '打开泵门，取出输液管，检查超声波气泡传感器卡槽是否有药液干涸污渍，用酒精棉签擦净。',
          checkType: 'consumable',
          expectedNormalState: '传感器光学/超声凹槽无污渍药渍，管路拉直紧贴凹槽。'
        },
        {
          step: 2,
          title: '检查输液器品牌规格匹配度',
          action: '确认当前使用的输液器品牌与泵机菜单内设定的品牌代号（如威高/双鸽/贝朗）完全一致。',
          checkType: 'setting',
          expectedNormalState: '管径规格匹配无偏差，弹性系数校准一致。'
        },
        {
          step: 3,
          title: '排查下端通路是否通畅',
          action: '检查患者端静脉留置针有无回血凝固、三通阀是否处于打开连通位置。',
          checkType: 'consumable',
          expectedNormalState: '三通阀全开，留置针通畅无阻力。'
        }
      ],
      rootCauses: [
        {
          rank: 1,
          cause: '超声气泡传感器表面药液残留结晶导致声阻抗失真',
          probability: '48%',
          category: '传感器/探头',
          mechanism: '微量药液渗入卡槽，干燥后形成晶体附着层，散射超声波引发误判气泡。'
        },
        {
          rank: 2,
          cause: '压力传感器应变片受潮或弹性元件机械变形漂移',
          probability: '32%',
          category: '传感器/探头',
          mechanism: '下端阻塞压力检测基准零点漂移，导致极小静脉阻力即触发上限阻塞阈值。'
        },
        {
          rank: 3,
          cause: '注射泵滑块传动丝杆干涸、导轨积灰卡阻',
          probability: '20%',
          category: '机械结构',
          mechanism: '长期运行油脂挥发，步进电机力矩不足引发失步堵转报警。'
        }
      ],
      engineerSteps: [
        '使用输液泵分析仪（IDA-4 Plus / Infutest）连接测试输液流速精度与阻塞压力报警阈值。',
        '进入工程模式进行气泡传感器 AD 采样本底电压校零。',
        '清理传动丝杆并涂抹医用食品级特种润滑脂（如克uber白油）。',
        '校准推注离合器微动开关与空针/残余量光学传感器。'
      ],
      recommendedParts: [
        { name: '超声波气泡检测传感器模块', estCost: 450, necessity: '备选', specification: '标准管径自适应型' },
        { name: '管路压力应变片传感器总成', estCost: 520, necessity: '备选', specification: '高灵敏度医用级' },
        { name: '传动丝杆专用医用级润滑脂', estCost: 60, necessity: '消耗件', specification: '低阻尼耐温型' }
      ],
      safetyPrecautions: [
        '校准流速时必须使用蒸馏水，避免使用生理盐水腐蚀分析仪高精度压力室。'
      ],
      suggestedResolution: '清洁气泡传感器感应凹槽并对下端阻塞压力阈值执行三点标定，使用输液泵分析仪进行 25ml/h、100ml/h 流量测试，流速误差为 +0.8%（在国标 ±5% 允许范围），恢复正常。',
      preventiveAdvice: '临床使用中若药液洒入机身应立即擦拭，严禁带药液残留封存；每半年由医工科进行流速与阻塞报警定标。'
    }, equipment, rawFault);
  }

  // 默认通用医疗设备诊断
  return finalizeDiagnosis({
    equipmentName,
    model: model || '通用医疗装备',
    standardizedDescription: `临床设备使用中反馈异常：${rawFault}。表现为设备自检未通过或功能模块输出受阻，需进行电路、外围附件及机械连接标准化排查。`,
    symptomSummary: {
      alarmCodes: ['DEVICE-ERR-01'],
      affectedModule: '核心电源供电与主控制逻辑单元',
      urgencyLevel: '中(单模块受限)',
      clinicalImpact: '部分功能受限或需停机检修，建议科室使用同类备用设备保障日常诊疗业务。'
    },
    clinicalFirstLineSteps: [
      {
        step: 1,
        title: '检查电源与插座接地',
        action: '更换墙壁应急电源插座，确认电源指示灯是否正常点亮，排查插头松动。',
        checkType: 'power',
        expectedNormalState: '电源指示灯稳定常亮，插头牢固。'
      },
      {
        step: 2,
        title: '检查外围线缆与附件',
        action: '检查输入输出线缆连接器，确认各旋钮、按键及探头接口无松脱或异物卡阻。',
        checkType: 'cable_probe',
        expectedNormalState: '接口插接到位，锁紧装置卡实。'
      },
      {
        step: 3,
        title: '设备冷重启与自检',
        action: '关闭主电源，静置 15 秒后重新开机，观察自检代码及显示屏报错提示。',
        checkType: 'setting',
        expectedNormalState: '开机流程顺畅，屏幕无异常报错代码。'
      }
    ],
    rootCauses: [
      {
        rank: 1,
        cause: '外部供电电源或机内开关电源模块滤波电路异常',
        probability: '45%',
        category: '电路/电源',
        mechanism: '电网波动或滤波电容老化造成二次供电纹波过大，触发系统欠压/过流保护。'
      },
      {
        rank: 2,
        cause: '外接探头/附件连接线缆接触不良或接口针脚氧化',
        probability: '35%',
        category: '传感器/探头',
        mechanism: '高频插拔拉扯导致接口接触电阻上升，信号衰减失真。'
      },
      {
        rank: 3,
        cause: '控制主板固件异常或参数存储器配置丢失',
        probability: '20%',
        category: '软件/固件',
        mechanism: '纽扣电池欠压或静电干扰造成 EEPROM 校验和错误，自检中断。'
      }
    ],
    engineerSteps: [
      '测量交流输入电压与直流开关电源各路稳压输出电压（+5V, +12V, -12V, +24V）。',
      '使用绝缘测试仪检测设备电气安全指标（保护接地阻抗、对地漏电流）。',
      '检查主控板晶振波形及复位电路电平状态。',
      '重置设备出厂校准参数并执行全功能质控测试。'
    ],
    recommendedParts: [
      { name: '医用级内置开关电源模块', estCost: 950, necessity: '备选', specification: '通用输入 100-240V' },
      { name: '外围连接线缆与接插件套件', estCost: 320, necessity: '备选', specification: '原厂标准规格' }
    ],
    safetyPrecautions: [
      '检修前断开主电源，注意内部大容量高压电容放电。',
      '维修后必须执行电气安全测试并贴附合格标识方可放行。'
    ],
    suggestedResolution: '经现场排查排除电源供电故障，清理接口氧化层并重做系统校准测试，各项指标恢复出厂标准，准予恢复临床使用。',
    preventiveAdvice: '建议定期清洁设备风道与散热滤网，保持环境温湿度在标准受控区间（温度 18-25℃，湿度 40-70%）。'
  }, equipment, rawFault);
}

// 自动生成 PM 预防性维护规程
export function generateLocalPmPlan(equipment: MedicalEquipment): AiPmPlanItem[] {
  const name = equipment.name || '';
  const isLifeSupport = /呼吸|除颤|麻醉|监护|体外循环|ecmo/i.test(name);

  return [
    {
      itemNo: 'PM-01',
      category: '电气安全',
      title: 'GB 9706.1 医疗电气安全检测',
      standardMethod: '使用专用电气安全分析仪（如 Fluke ESA615）测试保护接地阻抗、外壳漏电流、患者漏电流及绝缘电阻。',
      acceptanceCriteria: '保护接地阻抗 < 0.1 Ω；正常状态外壳漏电流 < 100 μA；单一故障状态 < 500 μA。',
      recommendedCycle: isLifeSupport ? '每 3 个月' : '每 6 个月'
    },
    {
      itemNo: 'PM-02',
      category: '机械性能',
      title: '机身外观、紧固件与活动结构润滑',
      standardMethod: '检查机身外壳有无破损开裂，紧固把手、脚轮刹车、支架转轴；对导轨丝杆涂抹医用特种润滑油脂。',
      acceptanceCriteria: '外壳无贯通裂纹，脚轮制动有效可靠，机械部件运转顺畅无异响。',
      recommendedCycle: '每 6 个月'
    },
    {
      itemNo: 'PM-03',
      category: '传感器定标',
      title: '计量性能与核心参数精度标定',
      standardMethod: '使用标准医用模拟仪输入标准参考量（如标准心电信号/标准通气压力/标准除颤能量），校验示值误差。',
      acceptanceCriteria: '各项参数测量误差均在设备制造技术说明书及国家强检/校准规程允许误差范围内。',
      recommendedCycle: isLifeSupport ? '每 6 个月' : '每年 1 次'
    },
    {
      itemNo: 'PM-04',
      category: '气路与流体',
      title: '气路气密性与管道滤网清洁更换',
      standardMethod: '执行系统管路密闭性压力测试，拆卸清洗或更换进气除尘高效滤网（HEPA）及防尘棉。',
      acceptanceCriteria: '气密性测试漏气率合格，滤网清洁无积尘遮挡。',
      recommendedCycle: '每 3 个月'
    },
    {
      itemNo: 'PM-05',
      category: '消耗件与清洁',
      title: '机载备用电池容量放电与充放电校准',
      standardMethod: '断开市电，仅靠内置电池供电进行全负荷放电测试，记录电池供电持续时间并重新充满电。',
      acceptanceCriteria: '电池实际供电时间达到出厂标称时间的 80% 以上，无欠压虚电现象。',
      recommendedCycle: '每 6 个月'
    }
  ];
}

// ---------------------------------------------------------------------------
// 现场故障现象与工程师技术鉴定专用 AI 辅助函数
// ---------------------------------------------------------------------------

/**
 * 1. AI 规范生成【现场故障现象与临床损坏情况】描述
 */
export function generateAiFaultSymptomsDraft(
  equipment?: Partial<MedicalEquipment> | null,
  rawText?: string
): string {
  const eqName = equipment?.name || '医疗设备';
  const eqModel = equipment?.model ? `(${equipment.model})` : '';
  const dept = equipment?.department || '临床科室';
  const input = (rawText || '').trim();

  // 若用户已有简要输入，结合已有输入丰富；若为空，则根据设备类型智能推荐典型现场故障表现
  if (/0x107F|0x1099|0x5222|0x5212/i.test(input)) {
    return `【现场故障表现】${dept}在使用该${eqName}${eqModel}过程中，屏幕弹出系统意外严重错误窗口（故障代码 0x107F，关联历史代码 0x1099/0x5222）。\n【临床操作反馈】科室操作人员多次尝试冷热重启，自检进度条均在核心模组通信阶段中断并死机，伴随声光报警，无法进入主监控运行界面。\n【现场初步排查】设备外接市电供电正常（220V稳压），机载排风扇运转正常但主控板与数字信号处理模组无心跳响应，目前已挂牌停用，对科室急诊及危重症监护救治造成直接影响。`;
  }

  if (/黑屏|不启动|电源|开不了机/i.test(input) || /除颤/i.test(eqName)) {
    return `【现场故障表现】${dept}反馈该${eqName}${eqModel}在通电开机时，前面板电源指示灯异常闪烁，主显示屏无背光且无任何系统引导自检字符，蜂鸣器发出连续急促长鸣异常报警。\n【临床操作反馈】更换备用电源线并插拔电极导联后重新上电，故障现象依旧无改善，高压放电及能量检测模块完全失能。\n【现场初步排查】经现场测量交流输入保险丝完好，但主控主板无二次稳压输出（±12V/+5V均欠压），设备处于全面停机状态。`;
  }

  if (/呼吸|漏气|压力|呼气阀/i.test(input) || /呼吸机/i.test(eqName)) {
    return `【现场故障表现】${dept}临床反馈该${eqName}${eqModel}在患者机械通气过程中频繁触发「气道高压报警」与「分钟通气量低报警」，呼气阀组件处可清晰闻及连续高频嘶嘶气流微漏声。\n【临床操作反馈】已更换全新灭菌管路及集水杯，并在标准模拟肺上重新执行紧密性测试，系统自检依旧提示泄漏率超标（Leak > 280 mL/min），吸入氧浓度（FiO2）测量值与设置值偏差达 ±18%。\n【现场初步排查】机械气路比例电磁阀存在动作卡滞滞后，呼气阀硅胶密封膜片老化硬化，急需技术干预。`;
  }

  if (/伪影|球管|射线|曝光|ct|dr|超声|探头/i.test(input) || /放射|超声|影像/i.test(dept)) {
    return `【现场故障表现】${dept}在对患者执行日常扫描/检查过程中，图像采集工作站提示「X射线发生器通信超时/高压击穿连锁保护」（错误代码 ERR-HV-OVERLOAD）。\n【临床操作反馈】曝光瞬间听见机架内部有明显轻微放电异响，重建影像中心区域出现多道明显环状伪影与黑斑条纹，无法满足临床影像诊断规范要求。\n【现场初步排查】高压发生器油箱油温偏高，千伏/毫安输出曲线失真，怀疑球管阳极靶面严重龟裂或高压发生模组击穿。`;
  }

  // 默认通用结构化输出
  const content = input || '设备在临床正常运行使用中突然中断，前面板报警指示灯常亮，系统自检失败中断';
  return `【现场故障表现】${dept}在临床诊疗使用该${eqName}${eqModel}时，${content}。\n【临床操作反馈】医护人员按标准规程检查外接插头、导联附件及耗材连接并尝试重新开机自检，故障现象仍持续重现，无法恢复安全运行。\n【现场初步排查】设备已脱离患者并隔离停用，物理外观无破损，机载自检程序锁死，需医学工程专业工程师进行仪器检测与技术鉴定。`;
}

/**
 * 2. AI 工程师深度【技术鉴定与论证意见】
 */
export function generateAiEngineerTechnicalAssessment(
  equipment?: Partial<MedicalEquipment> | null,
  faultSymptoms?: string,
  partName?: string,
  estCost?: number
): string {
  const eqName = equipment?.name || '目标医疗设备';
  const eqModel = equipment?.model || '标准型号';
  const sn = equipment?.sn || 'SN-UNKNOWN';
  const cost = estCost || 6800;
  const part = partName || '主控数字处理板及高压供电模组';

  return `【1. 现场物理与电气检测数据】
• 使用万用表及示波器对机身各测试测试点进行硬件量测：发现机内直流开关电源各路供电存在明显纹波干扰（+12V母线跌落至+9.4V，且伴随 450mVp-p 高频杂波）；
• 核心主控板主芯片（DSP/FPGA）与各从属传感器板之间 SPI/CAN 总线通信波形严重畸变，导致总线数据校验反复失败并触发底层保护熔断；
• 使用电气安全分析仪检测保护接地阻抗 0.08Ω（合格），但机壳高频泄漏电流在特定加载工况下存在偶发突增。

【2. 失效机理与不可板级自修论证】
• 经解体显微检查，${part}内部多层盲埋孔 PCB 存在过热碳化迹象，贴片专用主控 ASIC 芯片引脚出现微观热应力脱焊；
• 该集成模块为原厂高度封装与出厂加密标定组件，现场及医院二级维修实验室缺乏专有贴片返修台与微调固件烧录治具，无法在元器件级别实施无损修复，必须整套更换${part}以确保临床精度与医疗电气安全。

【3. 更换配件必要性与预期修复效果】
• 拟采购原厂认证配件【${part}】，预计更换后可彻底根除由于模块老化/击穿引发的连锁死机与通讯中断；
• 配件换新后，将严格执行 GB 9706.1 电气安全测试及原厂全功能质控计量校准，确保达到国家计量与临床放行标准。

【4. 经济性论证与合规性声明】
• 本次配件预估费用为 ¥${cost.toLocaleString()} 元（已超过五千元审批阈值）。该设备原值约为 ¥${(equipment?.purchasePrice || 85000).toLocaleString()} 元，本次维修支出占设备原值比例仅 ${(cost / (equipment?.purchasePrice || 85000) * 100).toFixed(1)}%，远低于50%报废经济阈值，且设备整体机械与机架成色良好，修竣后预计可继续稳定服役 3~5 年，具备充分的技术必要性与投资合理性。`;
}

/**
 * 3. AI 专家【报废技术鉴定详述与检验依据】
 */
export function generateAiScrapTechnicalEvaluation(
  equipment?: Partial<MedicalEquipment> | null,
  scrapCategory: string = 'beyond_repair',
  serviceYears: number = 8.5,
  cumulativeCost: number = 42000
): string {
  const eqName = equipment?.name || '医疗设备';
  const eqModel = equipment?.model || '标准型号';
  const sn = equipment?.sn || 'SN-UNKNOWN';
  const price = equipment?.purchasePrice || 120000;
  const ratio = ((cumulativeCost / price) * 100).toFixed(1);

  let categoryReason = '核心部件老化严重且损坏无修复价值';
  if (scrapCategory === 'obsolete_parts_unavailable') {
    categoryReason = '设备已超期服役，原厂早已停产并发布停止售后服务（EOLS）公告，市场上已无合格原厂零配件供应';
  } else if (scrapCategory === 'safety_hazard') {
    categoryReason = '高压绝缘层炭化开裂，多次电气安全检测漏电流严重超标，存在不可逆的患者触电与火灾重大安全隐患';
  } else if (scrapCategory === 'economically_unfeasible') {
    categoryReason = `全生命周期累计维保支出已达 ¥${cumulativeCost.toLocaleString()} 元（占设备原值 ${ratio}%），继续投入维修费用已严重不具备经济合理性`;
  }

  return `【1. 设备服役年限与资产状态核查】
该设备（${eqName}，型号：${eqModel}，SN：${sn}）自投用建账至今已累计服役 ${serviceYears} 年，已超过国家财政部及原卫生部《医疗卫生机构固定资产管理办法》规定的推荐折旧年限（国家标准折旧期通常为 6~8 年）。

【2. 关键部件损毁与技术性能鉴定结论】
• 经医学工程保障中心专业技术组现场解体检测：机内核心结构件出现不可逆形变与材质老化脆化；
• 电路主控多层主板阻抗特性严重劣化，数字图像/信号处理模块频繁出现致命硬件中断；
• ${categoryReason}。

【3. 计量检测与安全合规性审查】
• 依据 GB 9706.1-2020《医用电气设备 第1部分：基本安全和基本性能的通用要求》，对该机进行耐压及泄漏电流强检测试，其对地漏电流实测值高达 1280μA（国家标准限值应 < 500μA），安全防护屏障已彻底失效，无法通过法定强检校准。

【4. 处置建议与报废结论】
综上所述，该设备技术性能严重落后、安全风险不可控、已无继续维修使用价值。技术鉴定小组一致评定：同意作固定资产技术报废处置，按医院资产报废管理规程进行残值回收并注销资产台账。`;
}

/**
 * 4. AI 智能审批与论证批注意见生成
 */
export function generateAiApprovalReviewComment(
  applicationTitle?: string,
  action: 'agree' | 'reject' = 'agree',
  role: string = '医工技术主管'
): string {
  if (action === 'agree') {
    if (role.includes('科主任') || role.includes('临床')) {
      return `【科室论证意见】经本科室核心医疗组评估，该设备系临床救治急需装备，故障停机严重影响诊疗周转。同意申报维修/配件方案，请医学工程中心尽快组织备件采购与修复放行。`;
    }
    if (role.includes('院长') || role.includes('委员会')) {
      return `【终审批复意见】经医学装备管理委员会集体审议，该项申请符合医院设备全生命周期管理与内控预算规范，论证依据充分，同意立项实施。由医工处联合财务采购科严格按照阳光采购流程规范办理。`;
    }
    return `【医工技术论证】经现场技术复核，检测数据详实，配件更换必要性及经济性论证成立。同意该维修方案，配件到货后需执行严格的入库检验与 GB 9706.1 电气安全质控放行检测。`;
  } else {
    return `【审核退回意见】经综合技术与经济性评估，当前提交的技术检测数据尚不充分，或存在更经济的替代维保方案，请结合设备实际残值与同类备机调度情况重新完善论证后再次呈报。`;
  }
}


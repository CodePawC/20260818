/**
 * 医疗器械国家药监局 (NMPA) 分类目录标准智能解析与格式化引擎
 * 依据国家药监局《医疗器械分类目录》2017年第104号公告（22大类规范体系）
 */

export interface FormattedCategoryBadge {
  code: string;
  name: string;
}

// 国家药监局 22 大类官方标准字典 (01 - 22)
export const NMPA_22_STANDARD_MAP: Record<string, string> = {
  '01': '有源手术器械',
  '02': '无源手术器械',
  '03': '神经和心血管手术器械',
  '04': '骨科手术器械',
  '05': '放射治疗器械',
  '06': '医用成像器械',
  '07': '医用诊察和监护器械',
  '08': '呼吸、麻醉和急救器械',
  '09': '物理治疗器械',
  '10': '输血、透析和体外循环器械',
  '11': '医疗器械消毒灭菌器械',
  '12': '有源植入器械',
  '13': '无源植入器械',
  '14': '注输、护理和防护器械',
  '15': '患者承载器械',
  '16': '眼科器械',
  '17': '口腔科器械',
  '18': '妇产科、辅助生殖和避孕器械',
  '19': '医用康复器械',
  '20': '中医器械',
  '21': '医用软件',
  '22': '临床检验器械',
};

// 语义特征与关键词推断国家 22 大类编码
const CATEGORY_HEURISTIC_RULES: { pattern: RegExp; code: string }[] = [
  // 01 有源手术器械
  { pattern: /有源手术|高频电刀|高频手术|射频消融|超声刀|超声手术|手术无影灯|等离子刀|内窥镜动力/i, code: '01' },
  // 02 无源手术器械
  { pattern: /无源手术|手术刀|手术剪|手术钳|手术镊/i, code: '02' },
  // 03 神经和心血管手术器械
  { pattern: /神经和心血管|心血管手术|心脏搭桥|介入导管|血管支架/i, code: '03' },
  // 04 骨科手术器械
  { pattern: /骨科手术|骨科|骨钻|骨锯|髓内钉|接骨板/i, code: '04' },
  // 05 放射治疗器械
  { pattern: /放射治疗|直线加速器|伽玛刀|后装治疗|立体定向放疗/i, code: '05' },
  // 06 医用成像器械
  { pattern: /医用成像|成像器械|计算机体层|CT|磁共振|MRI|超声|彩超|B超|X射线|DR|CR|DSA|血管造影机|C形臂|C臂|钼靶|乳腺机|电子内窥镜|内窥镜|影像显示|胃肠机|PET/i, code: '06' },
  // 07 医用诊察和监护器械
  { pattern: /医用诊察和监护|诊察和监护|监护设备|监护仪|病人监护|多参数监护|心电图|心电|脑电|脑电地形图|血压计|耳声发射|听力计|血氧|除颤监护|检眼镜|检耳镜|体温计/i, code: '07' },
  // 08 呼吸、麻醉和急救器械
  { pattern: /呼吸.*麻醉.*急救|呼吸设备|呼吸机|转运呼吸机|麻醉机|除颤器|除颤起搏|心肺复苏|洗胃机|医用制氧|雾化器/i, code: '08' },
  // 09 物理治疗器械
  { pattern: /物理治疗|理疗|牵引床|牵引器|磁疗|光疗|超短波|冲击波|超声治疗/i, code: '09' },
  // 10 输血、透析和体外循环器械
  { pattern: /输血.*透析|血液透析|体外循环|血液净化|CRRT|血液滤过|人工心肺|ECMO|腹膜透析/i, code: '10' },
  // 11 医疗器械消毒灭菌器械
  { pattern: /消毒灭菌|灭菌器|灭菌设备|高压蒸汽灭菌|低温等离子|环氧乙烷|清洗消毒/i, code: '11' },
  // 12 有源植入器械
  { pattern: /有源植入|心脏起搏器|脑深部电刺激|人工耳蜗/i, code: '12' },
  // 13 无源植入器械
  { pattern: /无源植入|人工关节|骨水泥|人工瓣膜/i, code: '13' },
  // 14 注输、护理和防护器械
  { pattern: /注输.*护理|注射泵|输液泵|微量泵|靶控注射|医用吸引器|防褥疮/i, code: '14' },
  // 15 患者承载器械
  { pattern: /患者承载|手术台|手术床|多功能产床|医用病床|电动病床|轮椅|担架车/i, code: '15' },
  // 16 眼科器械
  { pattern: /眼科器械|眼科|裂隙灯|验光仪|眼压计|眼底照相机|角膜地形图/i, code: '16' },
  // 17 口腔科器械
  { pattern: /口腔科器械|口腔|牙椅|牙科综合|口腔种植|洁牙机|根管/i, code: '17' },
  // 18 妇产科、辅助生殖和避孕器械
  { pattern: /妇产科|婴儿培养箱|婴儿保暖台|胎儿监护|胎心仪|妇科治疗/i, code: '18' },
  // 19 医用康复器械
  { pattern: /医用康复|康复训练|平衡测试|步态机器人|上肢康复|下肢康复/i, code: '19' },
  // 20 中医器械
  { pattern: /中医器械|中医|体质辨识|针灸|经络|艾灸/i, code: '20' },
  // 21 医用软件
  { pattern: /医用软件|PACS|RIS|LIS|影像处理软件|辅助诊断/i, code: '21' },
  // 22 临床检验器械
  { pattern: /临床检验|生化分析|血细胞分析|血球|尿液分析|凝血分析|化学发光|酶标仪|离心机|血气分析|核酸提取/i, code: '22' },
];

// 一级分类特征映射
const LEVEL1_CATEGORY_MAP: { pattern: RegExp; code: string }[] = [
  { pattern: /诊断.*X.*射线机|诊断X射线/i, code: '01' },
  { pattern: /放射治疗.*诊断设备|放射诊断/i, code: '01' },
  { pattern: /X射线计算机体层|计算机体层|CT/i, code: '02' },
  { pattern: /超声影像|超声诊断/i, code: '07' },
  { pattern: /磁共振/i, code: '09' },
  { pattern: /医用内窥镜|内窥镜功能/i, code: '14' },
  { pattern: /内窥镜功能供给/i, code: '15' },
  { pattern: /心电诊断/i, code: '01' },
  { pattern: /脑电诊断/i, code: '02' },
  { pattern: /生理参数/i, code: '03' },
  { pattern: /监护设备|监护/i, code: '04' },
  { pattern: /电声学测量/i, code: '05' },
  { pattern: /呼吸设备|医用呼吸机/i, code: '01' },
  { pattern: /麻醉器械|心脏除颤/i, code: '02' },
  { pattern: /输液与推注|急救设备/i, code: '03' },
  { pattern: /血液净化|透析/i, code: '03' },
  { pattern: /心肺复苏/i, code: '04' },
  { pattern: /洗胃设备/i, code: '05' },
  { pattern: /高频.*射频|高频手术/i, code: '03' },
  { pattern: /手术照明/i, code: '08' },
  { pattern: /离心机/i, code: '05' },
  { pattern: /产科检查|手术台/i, code: '01' },
];

// 二级分类特征映射
const LEVEL2_CATEGORY_MAP: { pattern: RegExp; code: string }[] = [
  { pattern: /血管造影|DSA/i, code: '01' },
  { pattern: /超声回波多普勒|彩超/i, code: '02' },
  { pattern: /乳腺.*X.*射线|乳腺钼靶/i, code: '03' },
  { pattern: /移动式.*C.*形臂|C臂/i, code: '06' },
  { pattern: /摄影.*X.*射线|DR/i, code: '07' },
  { pattern: /X射线计算机体层|CT/i, code: '01' },
  { pattern: /超导型磁共振/i, code: '03' },
  { pattern: /电子内窥镜/i, code: '03' },
  { pattern: /电子内窥镜图像处理器/i, code: '03' },
  { pattern: /心电图机|十二导联/i, code: '01' },
  { pattern: /脑电地形图/i, code: '01' },
  { pattern: /血压计|台式水银/i, code: '01' },
  { pattern: /病人监护设备|监护仪/i, code: '01' },
  { pattern: /耳声发射仪/i, code: '03' },
  { pattern: /重症治疗呼吸机/i, code: '01' },
  { pattern: /急救转运呼吸机/i, code: '02' },
  { pattern: /双通道.*注射泵/i, code: '01' },
  { pattern: /高频电刀|高频手术/i, code: '01' },
  { pattern: /除颤起搏|双相波除颤/i, code: '01' },
  { pattern: /心肺复苏/i, code: '01' },
  { pattern: /自动洗胃/i, code: '01' },
  { pattern: /高速冷冻离心机|离心机/i, code: '01' },
  { pattern: /多功能液压产床|产床/i, code: '01' },
  { pattern: /医用影像显示终端|影像显示/i, code: '01' },
  { pattern: /手动手术台/i, code: '02' },
  { pattern: /电动手术台/i, code: '01' },
  { pattern: /血液透析/i, code: '01' },
];

/**
 * 清洗分类名称，去除前缀数字、括号、短横线与多余空格
 */
export function cleanCategoryName(name?: string, extractedCode?: string): string {
  if (!name || !name.trim()) return '-';
  let cleaned = name.trim();

  // 去除开头的 "[06]"、"06 "、"06-" 等
  cleaned = cleaned.replace(/^\[?\d{1,4}[\]\s\-:.]*/, '').trim();

  if (extractedCode && cleaned.startsWith(extractedCode)) {
    cleaned = cleaned.slice(extractedCode.length).trim();
  }

  cleaned = cleaned.replace(/^[-:.\s]+/, '').trim();
  return cleaned || name.trim() || '-';
}

/**
 * 智能解析国家药监局 22 大类 (Main Category)
 * 无论输入是历史错乱名称还是设备名，均精准映射到国家标准大类与两位数代码
 */
export function resolveMainCategory(
  codeRaw?: string, 
  nameRaw?: string, 
  extraContext?: string
): FormattedCategoryBadge {
  const codeStr = (codeRaw || '').trim();
  const nameStr = (nameRaw || '').trim();
  const contextStr = (extraContext || '').trim();
  const combined = `${nameStr} ${contextStr}`.trim();

  let matchedCode = '';

  // 1. 优先通过名称/上下文特征语义推断（防止历史数据中 code 与名称完全错乱）
  if (combined) {
    for (const rule of CATEGORY_HEURISTIC_RULES) {
      if (rule.pattern.test(combined)) {
        matchedCode = rule.code;
        break;
      }
    }
  }

  // 2. 如果特征未命中，尝试从原始 code 提取
  if (!matchedCode && codeStr) {
    const numMatch = codeStr.match(/\d+/);
    if (numMatch) {
      const codeNum = parseInt(numMatch[0], 10);
      if (codeNum >= 1 && codeNum <= 22) {
        matchedCode = String(codeNum).padStart(2, '0');
      }
    }
  }

  // 3. 如果仍未提取，尝试从 name 开头提取数字
  if (!matchedCode && nameStr) {
    const startMatch = nameStr.match(/^\[?(\d{1,2})[\]\s\-:.]/);
    if (startMatch) {
      const codeNum = parseInt(startMatch[1], 10);
      if (codeNum >= 1 && codeNum <= 22) {
        matchedCode = String(codeNum).padStart(2, '0');
      }
    }
  }

  // 4. 默认兜底（若完全未知，则为 06 医用成像）
  if (!matchedCode || !NMPA_22_STANDARD_MAP[matchedCode]) {
    matchedCode = '06';
  }

  return {
    code: matchedCode,
    name: NMPA_22_STANDARD_MAP[matchedCode] || '医用成像器械'
  };
}

/**
 * 智能解析一级分类 (Level 1 Category)
 */
export function resolveLevel1Category(
  codeRaw?: string, 
  nameRaw?: string, 
  mainCode?: string
): FormattedCategoryBadge {
  let code = (codeRaw || '').trim();
  let name = (nameRaw || '').trim();

  if (code) {
    const numMatch = code.match(/\d+/);
    if (numMatch) {
      code = numMatch[0].padStart(2, '0');
    }
  }

  if (!code && name) {
    const startMatch = name.match(/^\[?(\d{1,2})[\]\s\-:.]/);
    if (startMatch) {
      code = startMatch[1].padStart(2, '0');
    }
  }

  if (!code && name) {
    for (const item of LEVEL1_CATEGORY_MAP) {
      if (item.pattern.test(name)) {
        code = item.code;
        break;
      }
    }
  }

  if (!code) {
    code = '01';
  }

  let cleanName = cleanCategoryName(name, code);
  if (cleanName === '-' || cleanName === '通用类别') {
    if (name && name !== '-') cleanName = name;
  }

  return {
    code,
    name: cleanName || '通用类别'
  };
}

/**
 * 智能解析二级分类 (Level 2 Category)
 */
export function resolveLevel2Category(
  codeRaw?: string, 
  nameRaw?: string, 
  l1Code?: string
): FormattedCategoryBadge {
  let code = (codeRaw || '').trim();
  let name = (nameRaw || '').trim();

  if (code) {
    const numMatch = code.match(/\d+/);
    if (numMatch) {
      code = numMatch[0].padStart(2, '0');
    }
  }

  if (!code && name) {
    const startMatch = name.match(/^\[?(\d{1,2})[\]\s\-:.]/);
    if (startMatch) {
      code = startMatch[1].padStart(2, '0');
    }
  }

  if (!code && name) {
    for (const item of LEVEL2_CATEGORY_MAP) {
      if (item.pattern.test(name)) {
        code = item.code;
        break;
      }
    }
  }

  if (!code) {
    code = '01';
  }

  let cleanName = cleanCategoryName(name, code);
  if (cleanName === '-' || cleanName === '标准设备') {
    if (name && name !== '-') cleanName = name;
  }

  return {
    code,
    name: cleanName || '标准设备'
  };
}

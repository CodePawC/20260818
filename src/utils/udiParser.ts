// ==================== UDI 国家码与医疗器械标准解析引擎 ====================
import { UdiParsedResult, UdiStandardType, DedicatedConsumableMaster } from '../types/udiTypes';

/**
 * 将 YYMMDD 格式转为标准 YYYY-MM-DD
 */
export function formatYymmddToDate(yymmdd: string): string {
  if (!yymmdd || yymmdd.length !== 6 || !/^\d{6}$/.test(yymmdd)) {
    return yymmdd;
  }
  const yy = parseInt(yymmdd.substring(0, 2), 10);
  const mm = yymmdd.substring(2, 4);
  const dd = yymmdd.substring(4, 6);
  // 按照医疗器械惯例，50~99 视为 19xx，00~49 视为 20xx
  const year = yy >= 50 ? 1900 + yy : 2000 + yy;
  // 特例：如果日期为 00，代表当月末
  const safeDd = dd === '00' ? '28' : dd;
  return `${year}-${mm}-${safeDd}`;
}

/**
 * 校验指定日期是否已过期
 */
export function checkIsExpired(expiryDateStr?: string): boolean {
  if (!expiryDateStr) return false;
  try {
    const today = new Date().toISOString().split('T')[0];
    return expiryDateStr < today;
  } catch {
    return false;
  }
}

/**
 * 核心解析算法：解析 GS1、MA 及医疗器械复合码
 */
export function parseUdiBarcode(rawInput: string): UdiParsedResult {
  const cleanInput = (rawInput || '').trim();
  const rawParsedFields: { ai: string; label: string; value: string }[] = [];
  const validationErrors: string[] = [];

  if (!cleanInput) {
    return {
      rawCode: '',
      standard: 'UNKNOWN',
      isValid: false,
      di: '',
      rawParsedFields: [],
      validationErrors: ['条码内容为空，请使用扫码枪或手动输入完整UDI编码']
    };
  }

  // 1. 判断是否为中国医疗器械唯一标识 MA 标准
  let standard: UdiStandardType = 'GS1';
  let workingCode = cleanInput;

  if (cleanInput.startsWith('MA.') || cleanInput.startsWith('MA-') || cleanInput.includes('MA.156')) {
    standard = 'MA';
    rawParsedFields.push({
      ai: 'PREFIX',
      label: '中国医疗器械标识代码体 (MA 注册前缀)',
      value: cleanInput.split('.')[0] + '.' + cleanInput.split('.')[1]
    });
  }

  let di = '';
  let lotNumber: string | undefined;
  let expirationDate: string | undefined;
  let manufacturingDate: string | undefined;
  let serialNumber: string | undefined;
  let softwareVersion: string | undefined;

  // 2. 如果包含括号式应用标识符 (01), (17), (10), (21)
  if (/\(\d{2,4}\)/.test(workingCode)) {
    const aiRegex = /\((\d{2,4})\)([^()]+)/g;
    let match;
    while ((match = aiRegex.exec(workingCode)) !== null) {
      const ai = match[1];
      const val = match[2].trim();

      if (ai === '01') {
        di = val;
        rawParsedFields.push({ ai: '(01)', label: '器械唯一标识 (DI / GTIN-14)', value: val });
      } else if (ai === '17') {
        expirationDate = formatYymmddToDate(val);
        rawParsedFields.push({ ai: '(17)', label: '失效截止日期 (EXP)', value: expirationDate });
      } else if (ai === '11') {
        manufacturingDate = formatYymmddToDate(val);
        rawParsedFields.push({ ai: '(11)', label: '生产制造日期 (MFG)', value: manufacturingDate });
      } else if (ai === '10') {
        lotNumber = val;
        rawParsedFields.push({ ai: '(10)', label: '生产批号 (LOT)', value: val });
      } else if (ai === '21') {
        serialNumber = val;
        rawParsedFields.push({ ai: '(21)', label: '单品序列号 (SN)', value: val });
      } else if (ai === '8012') {
        softwareVersion = val;
        rawParsedFields.push({ ai: '(8012)', label: '软件版本号 (VER)', value: val });
      } else {
        rawParsedFields.push({ ai: `(${ai})`, label: `扩展标识符 AI-${ai}`, value: val });
      }
    }
  } else {
    // 3. 连续紧凑码无括号模式解析 (处理 FNC1 / \x1d 或固定长度 AI 01=14, 11=6, 17=6)
    // 替换 ASCII 29 GS 字符为竖线分隔符
    const sanitized = workingCode.replace(/[\u001d\x1d]/g, '|');
    
    // 如果是纯 14 位或 13 位数字，直接作为 DI
    if (/^\d{13,14}$/.test(sanitized)) {
      di = sanitized.padStart(14, '0');
      rawParsedFields.push({ ai: '(01)', label: '器械唯一标识 (DI / 纯码)', value: di });
    } else {
      let idx = 0;
      const len = sanitized.length;

      // 提取 DI (01)
      if (sanitized.startsWith('01') && len >= 16) {
        di = sanitized.substring(2, 16);
        rawParsedFields.push({ ai: '(01)', label: '器械唯一标识 (DI / GTIN-14)', value: di });
        idx = 16;
      }

      // 遍历剩余的变长或定长 AI
      while (idx < len) {
        if (sanitized[idx] === '|') {
          idx++;
          continue;
        }

        const sub = sanitized.substring(idx);

        if (sub.startsWith('17') && sub.length >= 8) {
          const rawDate = sub.substring(2, 8);
          expirationDate = formatYymmddToDate(rawDate);
          rawParsedFields.push({ ai: '(17)', label: '失效截止日期 (EXP)', value: expirationDate });
          idx += 8;
        } else if (sub.startsWith('11') && sub.length >= 8) {
          const rawDate = sub.substring(2, 8);
          manufacturingDate = formatYymmddToDate(rawDate);
          rawParsedFields.push({ ai: '(11)', label: '生产制造日期 (MFG)', value: manufacturingDate });
          idx += 8;
        } else if (sub.startsWith('10')) {
          // 批号变长，至下一个分隔符 | 或遇到 17/21/11 或末尾
          const nextSep = sub.indexOf('|', 2);
          const end = nextSep !== -1 ? nextSep : sub.length;
          lotNumber = sub.substring(2, end);
          rawParsedFields.push({ ai: '(10)', label: '生产批号 (LOT)', value: lotNumber });
          idx += end;
        } else if (sub.startsWith('21')) {
          const nextSep = sub.indexOf('|', 2);
          const end = nextSep !== -1 ? nextSep : sub.length;
          serialNumber = sub.substring(2, end);
          rawParsedFields.push({ ai: '(21)', label: '单品序列号 (SN)', value: serialNumber });
          idx += end;
        } else {
          // 未知或非标准串
          break;
        }
      }
    }
  }

  // 4. 验证 DI 合法性与必要字段
  if (!di) {
    // 兜底尝试从正文中匹配 14 位连续数字
    const found14 = cleanInput.match(/\b\d{14}\b/);
    if (found14) {
      di = found14[0];
      rawParsedFields.push({ ai: '(01)', label: '自适配识别器械 DI', value: di });
    } else {
      validationErrors.push('未检出符合标准的 14 位医疗器械唯一标识码 (DI)');
    }
  }

  const isExpired = checkIsExpired(expirationDate);
  if (isExpired) {
    validationErrors.push(`该耗材批次已于 ${expirationDate} 超过有效期限，禁止挂靠上机！`);
  }

  const isValid = di.length >= 13 && validationErrors.length === 0;

  return {
    rawCode: cleanInput,
    standard,
    isValid,
    di,
    lotNumber,
    expirationDate,
    manufacturingDate,
    serialNumber,
    softwareVersion,
    rawParsedFields,
    validationErrors: validationErrors.length > 0 ? validationErrors : undefined,
    isExpired
  };
}

/**
 * 专机专耗白名单配伍校验
 */
export function verifyConsumableHostCompatibility(
  hostEquipment: { id: string; name: string; model?: string; department?: string },
  consumable: DedicatedConsumableMaster
): {
  isCompatible: boolean;
  matchType: 'exact_model' | 'name_family' | 'strict_mismatch';
  message: string;
} {
  const hostModel = (hostEquipment.model || '').toUpperCase().trim();
  const hostName = (hostEquipment.name || '').trim();

  // 1. 精确型号匹配
  const exactMatch = consumable.compatibleEquipmentModels.some(m => 
    hostModel && (hostModel.includes(m.toUpperCase()) || m.toUpperCase().includes(hostModel))
  );

  if (exactMatch) {
    return {
      isCompatible: true,
      matchType: 'exact_model',
      message: `【完美匹配】主机型号 "${hostEquipment.model}" 与耗材规格完全兼容，准予上机！`
    };
  }

  // 2. 品类家族兼容
  const nameMatch = consumable.compatibleEquipmentNames.some(n => 
    hostName.includes(n) || n.includes(hostName)
  );

  if (nameMatch) {
    if (consumable.mandatoryMatch) {
      return {
        isCompatible: false,
        matchType: 'strict_mismatch',
        message: `【型号阻断】该耗材属于高危专机耗材，要求型号完全一致。当前主机 "${hostEquipment.model}" 未在白名单中！`
      };
    }
    return {
      isCompatible: true,
      matchType: 'name_family',
      message: `【同族通用】设备类型 "${hostName}" 符合品类标准，需临床工程师复核参数后投用。`
    };
  }

  // 3. 不兼容拦截
  return {
    isCompatible: false,
    matchType: 'strict_mismatch',
    message: `【严重不匹配】该专用耗材不支持设备 "${hostEquipment.name} (${hostEquipment.model})"，严禁违规混用！`
  };
}

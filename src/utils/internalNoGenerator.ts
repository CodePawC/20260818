import { MedicalEquipment } from '../types';

/**
 * 获取规范的二级品目唯一编码标识
 * 优先组合 categoryNo - level1No - level2No，或者 categoryNo - level2No，若无则使用 level2Category 或 category
 */
export function getEquipmentLevel2Key(equipment: Partial<MedicalEquipment>): string {
  const catNo = (equipment.categoryNo || '').trim();
  const l1No = (equipment.level1No || '').trim();
  const l2No = (equipment.level2No || '').trim();
  const l2Name = (equipment.level2Category || '').trim();
  const l1Name = (equipment.level1Category || '').trim();
  const catName = (equipment.category || '').trim();
  const eqName = (equipment.name || '').trim();

  if (catNo && l1No && l2No) {
    return `${catNo}-${l1No}-${l2No}`;
  }
  if (catNo && l2No) {
    return `${catNo}-${l2No}`;
  }
  if (l2Name) {
    return l2Name;
  }
  if (l1Name) {
    return l1Name;
  }
  if (catName) {
    return catName;
  }
  return eqName || 'DEFAULT_CATEGORY';
}

/**
 * 提取字符串中纯数字或按纯数字提取顺序号
 */
export function extractPureNumber(val: string | undefined | null): number | null {
  if (!val) return null;
  const trimmed = val.trim();
  // 如果本身就是纯数字
  if (/^\d+$/.test(trimmed)) {
    return parseInt(trimmed, 10);
  }
  // 匹配字符串末尾或包含的纯数字（如 "01", "8号机" -> 8, "US-02" -> 2）
  const match = trimmed.match(/\d+/);
  if (match) {
    return parseInt(match[0], 10);
  }
  return null;
}

/**
 * 自动计算并生成纯数字科室内部编号：
 * 规则：在同一个【使用科室】内，根据【二级品目】进行纯数字自然顺序自增编号（1, 2, 3, ...）。
 * 保证：
 * 1. 纯数字（无任何英文、中文或特殊符号）
 * 2. 同一科室内、相同二级品目（如心电图机、病人监护仪、超声诊断系统）依序分配纯数字
 * 3. 避免与该科室同二级品目现有已分配的内部纯数字编号冲突
 *
 * @param targetItem 待生成编号的设备
 * @param existingEquipment 全量设备列表（用于排重和计算当前二级品目最大流水号）
 * @param batchGeneratedMap 批处理过程中记录已分配的 { "科室::二级品目": Set<number> } 映射
 */
export function generatePureNumericInternalNo(
  targetItem: Partial<MedicalEquipment>,
  existingEquipment: MedicalEquipment[] = [],
  batchGeneratedMap?: Map<string, Set<number>>
): string {
  const dept = (targetItem.department || '未分配科室').trim();
  const l2Key = getEquipmentLevel2Key(targetItem);
  const deptCatKey = `${dept}::${l2Key}`;

  // 收集该科室同二级品目下已占用的所有纯数字序号
  const usedNumbers = new Set<number>();

  existingEquipment.forEach((item) => {
    if ((item.department || '').trim() === dept && getEquipmentLevel2Key(item) === l2Key) {
      if (item.internalNo) {
        const num = extractPureNumber(item.internalNo);
        if (num !== null && num > 0) {
          usedNumbers.add(num);
        }
      }
    }
  });

  // 合并批处理时当前内存已分配的数字
  if (batchGeneratedMap && batchGeneratedMap.has(deptCatKey)) {
    const allocated = batchGeneratedMap.get(deptCatKey)!;
    allocated.forEach((n) => usedNumbers.add(n));
  }

  // 从 1 开始寻找最小未被占用的纯数字正整数
  let seq = 1;
  while (usedNumbers.has(seq)) {
    seq++;
  }

  // 记录到批处理已占用池
  if (batchGeneratedMap) {
    if (!batchGeneratedMap.has(deptCatKey)) {
      batchGeneratedMap.set(deptCatKey, new Set<number>());
    }
    batchGeneratedMap.get(deptCatKey)!.add(seq);
  }

  return String(seq);
}

/**
 * 批量为一组设备补全缺失的「纯数字科室内部编号」
 */
export function batchAssignPureNumericInternalNos(
  newItems: MedicalEquipment[],
  existingItems: MedicalEquipment[] = []
): MedicalEquipment[] {
  const batchMap = new Map<string, Set<number>>();

  return newItems.map((item) => {
    const existingVal = (item.internalNo || '').trim();
    // 如果已有编号且为纯数字，登记并保留
    if (existingVal && /^\d+$/.test(existingVal)) {
      const dept = (item.department || '未分配科室').trim();
      const l2Key = getEquipmentLevel2Key(item);
      const deptCatKey = `${dept}::${l2Key}`;
      if (!batchMap.has(deptCatKey)) {
        batchMap.set(deptCatKey, new Set<number>());
      }
      batchMap.get(deptCatKey)!.add(parseInt(existingVal, 10));
      return item;
    }

    // 如果未填内部编号，或者需要自动转为纯数字
    const generatedNo = generatePureNumericInternalNo(item, existingItems, batchMap);
    return {
      ...item,
      internalNo: existingVal ? existingVal : generatedNo
    };
  });
}

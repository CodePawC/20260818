import { MedicalEquipment, EquipmentStatus } from '../types';
import { enrichEquipmentWithMasterData } from './masterData';
import { matchEquipmentToNmpaCategory } from './nmpaCategoryData';

export function parseEquipmentTsv(tsvText: string): MedicalEquipment[] {
  const rawLines = tsvText.trim().split('\n');
  if (rawLines.length === 0) return [];

  const results: MedicalEquipment[] = [];
  
  // Detect separator (tab or comma)
  const firstLine = rawLines[0];
  const separator = firstLine.includes('\t') ? '\t' : ',';

  // Helper to strip quotes
  const cleanCell = (str: string) => str ? str.trim().replace(/^["']|["']$/g, '') : '';

  // Check if first line is header
  const headerCols = firstLine.split(separator).map(cleanCell);
  const isHeader = headerCols.some(c => 
    c.includes('ID') || c.includes('名称') || c.includes('编号') || c.includes('科室') || c.includes('类别') || c.includes('日期') || c.toLowerCase().includes('name')
  );

  const headerMap: Record<string, number> = {};
  if (isHeader) {
    headerCols.forEach((col, idx) => {
      const lower = col.toLowerCase();
      if (col.includes('出厂日期') || col.includes('生产日期') || col.includes('制造日期') || lower.includes('manufacture')) {
        headerMap['manufactureDate'] = idx;
      } else if (col.includes('投用') || col.includes('启用日期') || lower.includes('enable')) {
        headerMap['enableDate'] = idx;
      } else if (col.includes('出厂编号') || col.includes('序列号') || lower === 'sn' || col.includes('sn')) {
        headerMap['sn'] = idx;
      } else if (col.includes('厂商') || col.includes('厂家') || col.includes('制造企业') || col.includes('生产企业') || col.includes('供应商') || lower.includes('manufacturer')) {
        headerMap['manufacturer'] = idx;
      } else if (col.includes('设备名称') || col.includes('器械名称') || col.includes('品名') || col.includes('产品名称') || (col.includes('名称') && !col.includes('类别') && !col.includes('科室') && !col.includes('大类') && !col.includes('单位') && !col.includes('人员')) || lower === 'name') {
        headerMap['name'] = idx;
      } else if (col.includes('型号') || col.includes('规格') || lower === 'model') {
        headerMap['model'] = idx;
      } else if (col.includes('科室') || lower.includes('department')) {
        headerMap['department'] = idx;
      } else if (col.includes('类别序号') || col.includes('大类序号')) {
        headerMap['categoryNo'] = idx;
      } else if (col.includes('所属类别') || col.includes('大类名称') || col.includes('类别')) {
        headerMap['category'] = idx;
      } else if (col.includes('一级类别序号') || col.includes('一级序号')) {
        headerMap['level1No'] = idx;
      } else if (col.includes('一级类别')) {
        headerMap['level1Category'] = idx;
      } else if (col.includes('二级类别序号') || col.includes('二级序号')) {
        headerMap['level2No'] = idx;
      } else if (col.includes('二级类别')) {
        headerMap['level2Category'] = idx;
      } else if (col.includes('ID') || col.includes('编号')) {
        headerMap['id'] = idx;
      } else if (col.includes('价格') || col.includes('金额') || lower.includes('price')) {
        headerMap['purchasePrice'] = idx;
      } else if (col.includes('楼号') || col.includes('楼栋') || col.includes('建筑') || (col.includes('楼') && !col.includes('楼层'))) {
        headerMap['building'] = idx;
      } else if (col.includes('楼层') || lower.includes('floor')) {
        headerMap['floor'] = idx;
      } else if (col.includes('护士站电话') || col.includes('科室电话') || col.includes('办公电话') || col.includes('电话') || lower.includes('phone') || lower.includes('tel')) {
        headerMap['nursePhone'] = idx;
      } else if (col.includes('负责人') || col.includes('管理责任人') || lower.includes('manager')) {
        headerMap['manager'] = idx;
      } else if (col.includes('状态') || lower.includes('status')) {
        headerMap['status'] = idx;
      } else if (col.includes('校准') || col.includes('计量')) {
        headerMap['calibration'] = idx;
      }
    });
  }

  const startIdx = isHeader ? 1 : 0;

  for (let i = startIdx; i < rawLines.length; i++) {
    const line = rawLines[i].trim();
    if (!line) continue;

    const cols = line.split(separator).map(cleanCell);
    if (cols.length < 2) continue;

    const getValue = (fieldKey: string, defaultPos: number, fallback = '') => {
      if (headerMap[fieldKey] !== undefined && cols[headerMap[fieldKey]] !== undefined) {
        return cols[headerMap[fieldKey]] || fallback;
      }
      return cols[defaultPos] !== undefined ? cols[defaultPos] : fallback;
    };

    const id = getValue('id', 0) || `EQ-${10000 + i}`;
    const categoryNo = getValue('categoryNo', 1, '');
    const category = getValue('category', 2, '');
    const level1No = getValue('level1No', 3, '');
    const level1Category = getValue('level1Category', 4, '');
    const level2No = getValue('level2No', 5, '');
    const level2Category = getValue('level2Category', 6, '');
    let name = getValue('name', 7) || '未命名设备';
    const model = getValue('model', 8, '-');
    const enableDate = getValue('enableDate', 9, '');
    const manufactureDate = getValue('manufactureDate', -1, '');
    const productValidity = getValue('productValidity', 10, '');
    const sn = getValue('sn', 11, '-');
    let manufacturer = getValue('manufacturer', 12, '-');
    const calibrationRaw = getValue('calibration', 13, 'No');
    const department = getValue('department', 14, '全院通用');
    const building = getValue('building', 15, '');
    const floor = getValue('floor', 16, '');
    const nursePhone = getValue('nursePhone', 17, '');
    const manager = getValue('manager', -1, '管理员');
    const priceRaw = getValue('purchasePrice', -1, '');

    let price = priceRaw ? parseFloat(priceRaw) : 50000;
    if (isNaN(price)) {
      if (category.includes('成像') || name.includes('CT') || name.includes('超声')) price = 1200000;
      else price = 50000;
    }

    // Auto match category if missing
    let finalCategoryNo = categoryNo;
    let finalCategory = category;
    let finalLevel1No = level1No;
    let finalLevel1Category = level1Category;
    let finalLevel2No = level2No;
    let finalLevel2Category = level2Category;

    if (!finalCategory || !finalLevel1Category || !finalLevel2Category) {
      const match = matchEquipmentToNmpaCategory(name, model);
      if (match.matchedItem) {
        if (!finalCategory) {
          finalCategoryNo = match.matchedItem.categoryCode;
          finalCategory = match.matchedItem.categoryName;
        }
        if (!finalLevel1Category) {
          finalLevel1No = match.matchedItem.level1Code;
          finalLevel1Category = match.matchedItem.level1Name;
        }
        if (!finalLevel2Category) {
          finalLevel2No = match.matchedItem.level2Code;
          finalLevel2Category = match.matchedItem.level2Name;
        }
      }
    }

    // Sanitize if name was populated with manufacturer company name
    const isCompanySuffix = /公司|厂|有限|制药|系统|电子|仪器|设备厂|集团|社|Inc|Corp|Ltd|GmbH|Co\.|LLC/i.test(name);
    if ((isCompanySuffix || name === manufacturer || name === '未命名设备') && (finalLevel2Category || finalCategory)) {
      if (name !== '未命名设备' && (!manufacturer || manufacturer === '-' || manufacturer === '国产/进口医疗器械')) {
        manufacturer = name;
      }
      name = finalLevel2Category || finalCategory;
    }

    const rawItem: MedicalEquipment = {
      id,
      categoryNo: finalCategoryNo,
      category: finalCategory,
      level1No: finalLevel1No,
      level1Category: finalLevel1Category,
      level2No: finalLevel2No,
      level2Category: finalLevel2Category,
      name,
      model,
      manufactureDate,
      enableDate,
      productValidity,
      sn,
      manufacturer,
      calibration: calibrationRaw === 'Yes' || calibrationRaw === '是' ? 'Yes' : 'No',
      department,
      building,
      floor,
      nursePhone,
      status: '正常运行' as EquipmentStatus,
      manager,
      purchasePrice: price,
      repairCount: 0,
      repairRecords: [],
      statusLogs: []
    };

    // Auto-enrich phone, building and floor from Department Master Data
    const enrichedItem = enrichEquipmentWithMasterData(rawItem);
    results.push(enrichedItem);
  }

  return results;
}


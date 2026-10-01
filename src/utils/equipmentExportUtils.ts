import { MedicalEquipment } from '../types';
import { getEquipmentValidityInfo } from './validityUtils';
import { getEquipmentCalibrationInfo } from './calibrationUtils';
import { getEquipmentHealthScore, getEquipmentMaintenanceNode } from './equipmentUtils';

export interface ExportCsvOptions {
  filenamePrefix?: string;
  filterSummary?: string;
  departmentName?: string;
}

export interface ExportResult {
  success: boolean;
  count: number;
  totalAmount: number;
  fileName: string;
}

/**
 * 将当前过滤条件下的医疗设备全维度字段数据导出为 Excel / CSV 离线归档文件
 * 包含 UTF-8 BOM 确保 Microsoft Excel / WPS 打开时无中文乱码
 */
export function exportEquipmentToCSV(
  equipmentList: MedicalEquipment[],
  options: ExportCsvOptions = {}
): ExportResult {
  if (!equipmentList || equipmentList.length === 0) {
    return {
      success: false,
      count: 0,
      totalAmount: 0,
      fileName: '',
    };
  }

  // 1. 全字段表头定义 (52项核心指标覆盖全生命周期资产档案)
  const columns: { header: string; getValue: (item: MedicalEquipment, index: number) => string | number }[] = [
    { header: '序号', getValue: (_, idx) => idx + 1 },
    { header: '系统ID', getValue: (i) => i.id },
    { header: '资产编号', getValue: (i) => i.assetNo || `ZC-2023-${i.id}` },
    { header: '资产归属形式', getValue: (i) => i.assetOwnership || '医院自有' },
    { header: '统一物资溯源码(code_id)', getValue: (i) => i.codeId || `COD-${i.id}` },
    { header: '科室内部自编号', getValue: (i) => i.internalNo || '' },
    { header: '设备名称', getValue: (i) => i.name },
    { header: '规格型号', getValue: (i) => i.model || '' },
    { header: '出厂编号(SN)', getValue: (i) => i.sn || '' },
    { header: '生产厂商', getValue: (i) => i.manufacturer || '' },
    { header: '运行状态', getValue: (i) => i.status || '' },
    { header: '使用科室', getValue: (i) => i.department || '' },
    { header: '产权归属科室', getValue: (i) => i.ownerDepartment || i.department || '' },
    { header: '存放楼栋', getValue: (i) => i.building || '' },
    { header: '所在楼层', getValue: (i) => i.floor || '' },
    { header: '具体使用场所/房间', getValue: (i) => i.usageLocation || i.location || '' },
    { header: '具体安装位置', getValue: (i) => i.location || '' },
    { header: '管理责任人', getValue: (i) => i.manager || '' },
    { header: '科室分机/护士站电话', getValue: (i) => i.nursePhone || '' },
    
    { header: '类别序号', getValue: (i) => i.categoryNo || '' },
    { header: '医疗器械大类', getValue: (i) => i.category || '' },
    { header: '一级类别序号', getValue: (i) => i.level1No || '' },
    { header: '一级类别名称', getValue: (i) => i.level1Category || '' },
    { header: '二级类别序号', getValue: (i) => i.level2No || '' },
    { header: '二级类别名称', getValue: (i) => i.level2Category || '' },
    
    { header: '购置原值(元)', getValue: (i) => (i.purchasePrice != null ? i.purchasePrice : '') },
    { header: '投用日期', getValue: (i) => i.enableDate || '' },
    { header: '出厂日期', getValue: (i) => i.manufactureDate || '' },
    { header: '购入日期', getValue: (i) => i.purchaseDate || '' },
    { header: '设计使用寿命(年)', getValue: (i) => (i.productValidity != null ? i.productValidity : '') },
    {
      header: '产品寿命与超期状态',
      getValue: (i) => {
        const val = getEquipmentValidityInfo(i);
        if (val.isFilingActive) return `超期服役(院内特许准用中，至${val.filingValidUntil || ''})`;
        if (val.isExpired) return `超期服役(已超设计寿命${val.yearsPast ? `，超期${val.yearsPast}年` : ''})`;
        if (val.isExpiringSoon) return `即将到期(剩余${val.daysRemaining || 0}天)`;
        return '正常在用(设计寿命期内)';
      },
    },
    { header: '供货商/代理商', getValue: (i) => i.supplier || '' },
    { header: '保修截止日期', getValue: (i) => i.warrantyUntil || '' },
    
    { header: '是否属于计量管理', getValue: (i) => (i.calibration === 'Yes' ? '是' : '否') },
    {
      header: '计量管理属性分类',
      getValue: (i) => {
        const cal = getEquipmentCalibrationInfo(i);
        return cal.calibrationType || (i.calibration === 'Yes' ? '强检类' : '免计量');
      },
    },
    { header: '强检/校准目录代码', getValue: (i) => i.catalogueCode || '' },
    {
      header: '计量检定费用政策',
      getValue: (i) => {
        if (i.feePolicy === 'free_national') return '国家免费(0元免征强检费)';
        if (i.feePolicy === 'paid_hospital') return '医院自费(周期收费校准)';
        return '无费用';
      },
    },
    { header: '计量检测单位', getValue: (i) => i.calibrationUnit || '' },
    { header: '计量检定证书编号', getValue: (i) => i.calibrationCertificateNo || '' },
    { header: '上次计量检定日期', getValue: (i) => i.lastCalibrationDate || '' },
    { header: '下次计量到期日', getValue: (i) => i.nextCalibrationDate || '' },
    {
      header: '计量合规状态',
      getValue: (i) => {
        const cal = getEquipmentCalibrationInfo(i);
        return cal.statusLabel || (cal.statusType === 'valid' ? '检定合格有效' : cal.statusType === 'overdue' ? '已超期未定标' : '临期预警');
      },
    },

    {
      header: '设备健康指数(分)',
      getValue: (i) => {
        const h = getEquipmentHealthScore(i);
        return h.score;
      },
    },
    {
      header: '健康风险等级',
      getValue: (i) => {
        const h = getEquipmentHealthScore(i);
        return `${h.label} (${h.grade})`;
      },
    },
    {
      header: '维保进度节点',
      getValue: (i) => {
        const m = getEquipmentMaintenanceNode(i);
        return m.statusTag || '';
      },
    },
    { header: '上次维保日期', getValue: (i) => i.lastMaintenanceDate || '' },
    { header: '下次维保日期', getValue: (i) => i.nextMaintenanceDate || '' },
    { header: '累计维修次数', getValue: (i) => i.repairCount || 0 },
    { header: '最近故障原因简记', getValue: (i) => i.lastFaultReason || '' },

    {
      header: '科室借调流转状态',
      getValue: (i) => {
        if (i.currentLoan && i.currentLoan.loanStatus !== 'returned') {
          return `借出使用中 (借调至: ${i.currentLoan.borrowingDepartment}, 借用人: ${i.currentLoan.borrowerName})`;
        }
        return '科室在库正常在用';
      },
    },
    { header: '超期备案公文编号', getValue: (i) => i.overdueFiling?.filingNo || '' },
    { header: '超期特许准用截止日', getValue: (i) => i.overdueFiling?.validUntil || '' },
    { header: '超期监管工程师', getValue: (i) => i.overdueFiling?.leadEngineer || '' },
  ];

  // 2. 组装 CSV 行
  const lines: string[] = [];

  // 表头行
  const headerRow = columns.map((col) => `"${col.header.replace(/"/g, '""')}"`).join(',');
  lines.push(headerRow);

  // 数据行
  equipmentList.forEach((item, index) => {
    const rowValues = columns.map((col) => {
      const val = col.getValue(item, index);
      if (typeof val === 'number') {
        return val.toString();
      }
      const strVal = String(val ?? '').replace(/"/g, '""');
      // 对纯长数字编号添加制表符前缀，防止 Excel 自动转换或去除前导零
      if (/^\d{8,}$/.test(strVal)) {
        return `"\t${strVal}"`;
      }
      return `"${strVal}"`;
    });
    lines.push(rowValues.join(','));
  });

  // 3. 构建带 UTF-8 BOM 的 Blob 文件，避免在中文 Windows Excel 下打开出现乱码
  const csvContent = '\uFEFF' + lines.join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });

  // 4. 生成规范化归档文件名
  const dateStr = new Date().toISOString().split('T')[0];
  const deptPart = options.departmentName ? `${options.departmentName}_` : '';
  const prefix = options.filenamePrefix || '医疗设备台账全字段离线归档';
  const fileName = `${prefix}_${deptPart}${equipmentList.length}台_${dateStr}.csv`;

  // 5. 触发浏览器直接安全下载
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  const totalAmount = equipmentList.reduce((sum, item) => sum + (item.purchasePrice || 0), 0);

  return {
    success: true,
    count: equipmentList.length,
    totalAmount,
    fileName,
  };
}

export type SparePartCategory = 
  | 'life_support'          // 急救生命支持 (呼吸机、除颤仪、监护仪、血透机等)
  | 'imaging_radiology'     // 放射影像与探头 (CT、DR、DSA、MR等专用高压/探测配件)
  | 'lab_biochemical'       // 临床检验与生化试剂管路 (生化仪、血球仪电磁阀、泵管)
  | 'endoscopy_surgery'     // 腔镜微创与高频电刀 (内镜钳道、冷光源灯泡、电刀脚踏线)
  | 'ultrasound_diagnostics'// 超声及电生理 (超声探头电缆、心电导联线、胎监探头)
  | 'general_consumables';  // 通用机电与维保耗材 (医用电源适配器、滤波电容、步进电机、气动接头)

export type StockAlertStatus = 
  | 'normal'       // 库存充足
  | 'low_stock'    // 低于安全水位预警
  | 'out_of_stock' // 缺货告急 (库存=0)
  | 'overstock';   // 呆滞积压

export interface SparePartItem {
  id: string; // e.g. "SP-2026-001"
  partNo: string; // 原厂或院内编码, e.g. "MR-SPO2-CBL-09"
  name: string; // 备件耗材名称
  category: SparePartCategory;
  categoryLabel: string;
  spec: string; // 规格型号
  brand: string; // 品牌/生产厂商 (迈瑞, 德尔格, GE, 飞利浦等)
  warehouseLocation: string; // 存放库房与货位 (e.g. "医工楼101备件主库 A-02-04")
  currentStock: number; // 当前实物在库数量
  unit: string; // 计量单位 (条, 个, 套, 块, 支, 包, 瓶)
  minSafeStock: number; // 最低安全库存下限
  maxStockLimit: number; // 最高储备警戒上限
  unitCost: number; // 采购参考单价 (元)
  supplierName: string; // 主供货商/厂商服务网点
  applicableEquipmentTypes: string[]; // 适用设备品类 (e.g. ["病人监护仪", "除颤监护仪"])
  batchNo: string; // 批次号/生产批次
  expiryDate?: string; // 质保期/有效期
  totalOutCount: number; // 累计出库领用量
  totalInCount: number; // 累计入库补仓量
  lastRestockDate: string; // 最近入库日期
  status: 'active' | 'suspended' | 'procuring';
  notes?: string;
}

export type StockTransactionType = 
  | 'wo_requisition'       // 维修工单领料出库
  | 'wo_return'            // 维修工单退料还库
  | 'purchase_in'          // 采购入库/常规补仓
  | 'inventory_adjustment' // 盘点平账调整
  | 'scrap_out'            // 损耗/报废出库
  | 'emergency_borrow';    // 科室应急借用出库

export interface StockTransactionRecord {
  id: string; // e.g. "TR-20260906-001"
  partId: string;
  partNo: string;
  partName: string;
  spec: string;
  type: StockTransactionType;
  typeLabel: string;
  quantity: number; // 变动数量 (出库记正数展示, 库存减少)
  unitCost: number;
  totalAmount: number;
  stockBefore: number;
  stockAfter: number;
  
  // 联动维修工单相关信息
  workOrderId?: string; // e.g. "WO-20260906-001"
  equipmentId?: string;
  equipmentName?: string;
  equipmentSn?: string;
  department?: string; // 领用科室

  // 经办信息
  operatorId: string;
  operatorName: string; // 领料工程师 / 经办人
  approverName?: string; // 库管员 / 质控复核人
  timestamp: string; // YYYY-MM-DD HH:mm
  remarks: string;
}

export interface SparePartsKpiStats {
  totalSkuCount: number; // 备件在库总SKU数
  totalStockValue: number; // 在库储备总资产货值 (元)
  lowStockWarningCount: number; // 触发偏低或缺货警戒的品种数
  outOfStockCount: number; // 彻底断货品种数 (库存=0)
  monthRequisitionCost: number; // 本月工单维修领料消耗总额 (元)
  monthRequisitionCount: number; // 本月工单领料出库总次数
  activePartsCount: number; // 正常在用备件种类数
}

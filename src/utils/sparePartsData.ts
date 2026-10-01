import {
  SparePartItem,
  StockTransactionRecord,
  SparePartsKpiStats
} from '../types/sparePartsTypes';

export const INITIAL_SPARE_PARTS: SparePartItem[] = [
  // 1. 急救与生命支持类
  {
    id: 'SP-2026-001',
    partNo: 'MR-SPO2-CBL-09',
    name: '迈瑞血氧饱和度光敏探头线缆 (7针抗拉扯耐消毒)',
    category: 'life_support',
    categoryLabel: '急救生命支持',
    spec: '512F-30-28263 7-pin 3.0m 成人指夹型',
    brand: '深圳迈瑞生物医疗',
    warehouseLocation: '医工楼101备件主库 A-01-02',
    currentStock: 14,
    unit: '条',
    minSafeStock: 5,
    maxStockLimit: 30,
    unitCost: 480,
    supplierName: '迈瑞医疗华东技术服务中心',
    applicableEquipmentTypes: ['病人监护仪', '心电监护仪', '急救除颤仪'],
    batchNo: 'LOT-20260315-01',
    expiryDate: '2029-12-31',
    totalOutCount: 18,
    totalInCount: 32,
    lastRestockDate: '2026-08-15',
    status: 'active',
    notes: '急救生命支持一类高频损耗备件，科室应急即领即发'
  },
  {
    id: 'SP-2026-002',
    partNo: 'DRG-EXH-VLV-84',
    name: '德尔格呼吸机呼气阀组件 (含膜片与加热体)',
    category: 'life_support',
    categoryLabel: '急救生命支持',
    spec: 'Dräger Evita V500/V300 专用高压可耐受灭菌型',
    brand: '德国德尔格 (Dräger)',
    warehouseLocation: '医工楼101备件主库 A-01-04',
    currentStock: 3,
    unit: '套',
    minSafeStock: 4, // 处于偏低警戒
    maxStockLimit: 12,
    unitCost: 3600,
    supplierName: '德尔格中国医疗设备售后服务部',
    applicableEquipmentTypes: ['呼吸机', '重症有创呼吸机', '转运呼吸机'],
    batchNo: 'LOT-20260210-09',
    expiryDate: '2030-05-31',
    totalOutCount: 9,
    totalInCount: 12,
    lastRestockDate: '2026-07-20',
    status: 'active',
    notes: 'ICU呼吸支持核心配件，已触发安全库存偏低预警，需重点补仓'
  },
  {
    id: 'SP-2026-003',
    partNo: 'PHIL-DF-CAP-32',
    name: '飞利浦除颤监护仪高能放电电容与继电器模块',
    category: 'life_support',
    categoryLabel: '急救生命支持',
    spec: '360J 双相波放电储能模组 32uF/6000V',
    brand: '飞利浦医疗 (Philips)',
    warehouseLocation: '医工楼101备件主库 A-02-01 (防静电专区)',
    currentStock: 2,
    unit: '块',
    minSafeStock: 2,
    maxStockLimit: 6,
    unitCost: 7200,
    supplierName: '飞利浦金牌医疗技术服务商',
    applicableEquipmentTypes: ['除颤仪', '除颤监护仪'],
    batchNo: 'LOT-20251120-03',
    expiryDate: '2031-10-31',
    totalOutCount: 3,
    totalInCount: 5,
    lastRestockDate: '2026-05-12',
    status: 'active',
    notes: '急诊与手术室除颤仪关键电气安全与高压储能部件'
  },
  {
    id: 'SP-2026-004',
    partNo: 'FRES-UF-VALVE-06',
    name: '费森尤斯血液透析机超滤平衡腔电磁阀组',
    category: 'life_support',
    categoryLabel: '急救生命支持',
    spec: 'Fresenius 4008S/5008S 专用耐腐蚀高频电磁阀 (24VDC)',
    brand: '费森尤斯医疗 (Fresenius)',
    warehouseLocation: '医工楼101备件主库 A-02-05',
    currentStock: 5,
    unit: '套',
    minSafeStock: 3,
    maxStockLimit: 15,
    unitCost: 1950,
    supplierName: '北京费森尤斯医药技术',
    applicableEquipmentTypes: ['血液透析机', '连续性血液净化系统(CRRT)'],
    batchNo: 'LOT-20260408-04',
    expiryDate: '2029-08-31',
    totalOutCount: 7,
    totalInCount: 12,
    lastRestockDate: '2026-06-28',
    status: 'active',
    notes: '血透室日间高负荷透析平衡超滤精准控制关键件'
  },

  // 2. 放射影像与探头类
  {
    id: 'SP-2026-005',
    partNo: 'GE-CT-THERM-01',
    name: 'GE Revolution CT 机架滑环碳刷组件与热敏温控器',
    category: 'imaging_radiology',
    categoryLabel: '放射影像与探头',
    spec: 'GE Optima/Revolution 系列专用低噪声导电耐磨碳刷 (8只/套)',
    brand: '通用电气医疗 (GE Healthcare)',
    warehouseLocation: '医工楼102大型影像配件冷库 B-01-01',
    currentStock: 1,
    unit: '套',
    minSafeStock: 2, // 低于安全库存
    maxStockLimit: 5,
    unitCost: 8800,
    supplierName: 'GE通用医疗原厂专修支持中心',
    applicableEquipmentTypes: ['CT', '双源CT', '螺旋CT'],
    batchNo: 'LOT-20260115-08',
    expiryDate: '2030-12-31',
    totalOutCount: 4,
    totalInCount: 5,
    lastRestockDate: '2026-04-10',
    status: 'active',
    notes: '影像科CT高压滑环接触阻抗与温升控制关键备件'
  },
  {
    id: 'SP-2026-006',
    partNo: 'UI-DR-FPD-CBL',
    name: '联影数字化X射线摄影(DR)平板探测器千兆网数据总线',
    category: 'imaging_radiology',
    categoryLabel: '放射影像与探头',
    spec: 'UI uDR 770i 专用 10Gbps 高屏蔽耐弯折铠装线缆 15m',
    brand: '上海联影医疗 (United Imaging)',
    warehouseLocation: '医工楼102大型影像配件冷库 B-01-03',
    currentStock: 0,
    unit: '条',
    minSafeStock: 1, // 缺货告急！
    maxStockLimit: 4,
    unitCost: 4200,
    supplierName: '联影医疗售后保障部',
    applicableEquipmentTypes: ['DR', '移动DR', '数字化摄影系统'],
    batchNo: 'LOT-20251210-02',
    expiryDate: '2032-01-01',
    totalOutCount: 3,
    totalInCount: 3,
    lastRestockDate: '2026-03-01',
    status: 'procuring',
    notes: '已发起原厂紧急采购，当前在库缺货，工单申请需走外购调配'
  },
  {
    id: 'SP-2026-007',
    partNo: 'SIE-DSA-COLL-05',
    name: '西门子介入导管室DSA平板限束器激光定位灯源与滤过片',
    category: 'imaging_radiology',
    categoryLabel: '放射影像与探头',
    spec: 'Siemens Artis zee 准直限束准直装置专用 LED 标定指示模组',
    brand: '西门子医疗 (Siemens Healthineers)',
    warehouseLocation: '医工楼102大型影像配件冷库 B-02-02',
    currentStock: 2,
    unit: '套',
    minSafeStock: 1,
    maxStockLimit: 4,
    unitCost: 5500,
    supplierName: '西门子医疗系统服务部',
    applicableEquipmentTypes: ['DSA', '数字减影血管造影机', 'C型臂X光机'],
    batchNo: 'LOT-20260218-05',
    expiryDate: '2031-06-30',
    totalOutCount: 1,
    totalInCount: 3,
    lastRestockDate: '2026-06-11',
    status: 'active',
    notes: '介入科心血管造影射线防护与视野精准野定标配件'
  },

  // 3. 临床检验与生化试剂管路
  {
    id: 'SP-2026-008',
    partNo: 'BCM-PUMP-TUBE-02',
    name: '全自动生化分析仪高精度陶瓷微升注样针与微步进泵管',
    category: 'lab_biochemical',
    categoryLabel: '临床检验与生化',
    spec: '耐强酸碱防交叉污染特氟龙包覆 50uL~1000uL 恒温型',
    brand: '罗氏诊断 (Roche Diagnostics)',
    warehouseLocation: '医工楼101备件主库 C-01-01',
    currentStock: 8,
    unit: '套',
    minSafeStock: 4,
    maxStockLimit: 20,
    unitCost: 1250,
    supplierName: '上海罗氏诊断售后服务',
    applicableEquipmentTypes: ['全自动生化分析仪', '化学发光免疫分析仪'],
    batchNo: 'LOT-20260505-11',
    expiryDate: '2028-12-31',
    totalOutCount: 12,
    totalInCount: 20,
    lastRestockDate: '2026-07-15',
    status: 'active',
    notes: '检验科急诊生化加样精度失准排查首选消耗件'
  },
  {
    id: 'SP-2026-009',
    partNo: 'SYS-HEM-VLV-18',
    name: '五分类全自动血细胞分析仪鞘流阻抗电磁换向阀',
    category: 'lab_biochemical',
    categoryLabel: '临床检验与生化',
    spec: 'Sysmex XN-1000 专用高频微型流体切换阀 (12V)',
    brand: '希森美康 (Sysmex)',
    warehouseLocation: '医工楼101备件主库 C-01-04',
    currentStock: 4,
    unit: '只',
    minSafeStock: 3,
    maxStockLimit: 10,
    unitCost: 1680,
    supplierName: '希森美康医用电子',
    applicableEquipmentTypes: ['血细胞分析仪', '全自动凝血分析仪'],
    batchNo: 'LOT-20260320-03',
    expiryDate: '2029-10-31',
    totalOutCount: 5,
    totalInCount: 9,
    lastRestockDate: '2026-06-02',
    status: 'active',
    notes: '临检实验室白细胞分类计数鞘流压力堵塞排障件'
  },

  // 4. 腔镜微创与高频电刀
  {
    id: 'SP-2026-010',
    partNo: 'OLYM-ENDO-SEAL-08',
    name: '奥林巴斯电子胃肠镜钳道管道活塞阀与防水密封帽',
    category: 'endoscopy_surgery',
    categoryLabel: '腔镜微创与手术',
    spec: 'Olympus GIF-H290/CF-H290 专用高压防漏水注气注水阀 (10只/包)',
    brand: '奥林巴斯 (Olympus)',
    warehouseLocation: '医工楼101备件主库 D-02-01',
    currentStock: 6,
    unit: '包',
    minSafeStock: 3,
    maxStockLimit: 15,
    unitCost: 1800,
    supplierName: '奥林巴斯内镜技术维修站',
    applicableEquipmentTypes: ['电子胃镜', '电子结肠镜', '支气管镜'],
    batchNo: 'LOT-20260401-16',
    expiryDate: '2029-04-30',
    totalOutCount: 14,
    totalInCount: 20,
    lastRestockDate: '2026-07-10',
    status: 'active',
    notes: '消化内镜洗消中心气密测漏与钳道负压漏气关键防护件'
  },
  {
    id: 'SP-2026-011',
    partNo: 'STORZ-LAMP-300',
    name: '卡尔史托斯内窥镜高清冷光源短弧氙灯泡灯芯',
    category: 'endoscopy_surgery',
    categoryLabel: '腔镜微创与手术',
    spec: 'Karl Storz 300W 专用高显色指数氙气放电灯杯 (额定寿命500h)',
    brand: '德国卡尔史托斯 (Karl Storz)',
    warehouseLocation: '医工楼101备件主库 D-02-03 (光学避震专柜)',
    currentStock: 2,
    unit: '只',
    minSafeStock: 2,
    maxStockLimit: 6,
    unitCost: 4900,
    supplierName: '卡尔史托斯内窥镜中国有限公司',
    applicableEquipmentTypes: ['腹腔镜系统', '关节镜系统', '冷光源'],
    batchNo: 'LOT-20260228-01',
    expiryDate: '2030-01-01',
    totalOutCount: 4,
    totalInCount: 6,
    lastRestockDate: '2026-05-18',
    status: 'active',
    notes: '手术室腔镜手术主照明光照度衰减或炸灯紧急更换件'
  },
  {
    id: 'SP-2026-012',
    partNo: 'VAL-ESU-PED-04',
    name: '美敦力高频电刀双极脚踏控制器与负极板转接电缆',
    category: 'endoscopy_surgery',
    categoryLabel: '腔镜微创与手术',
    spec: 'ValleyLab FT10 专用防水重型脚踏开关与REM负极板检测线',
    brand: '美敦力 (Medtronic ValleyLab)',
    warehouseLocation: '医工楼101备件主库 D-03-01',
    currentStock: 3,
    unit: '套',
    minSafeStock: 2,
    maxStockLimit: 8,
    unitCost: 2600,
    supplierName: '柯惠美敦力外科技术售后服务',
    applicableEquipmentTypes: ['高频电刀', '超声高频外科集成系统'],
    batchNo: 'LOT-20260310-09',
    expiryDate: '2031-12-31',
    totalOutCount: 6,
    totalInCount: 9,
    lastRestockDate: '2026-06-25',
    status: 'active',
    notes: '手术室术中高频能量回路中断及负极板接触阻抗报警专用件'
  },

  // 5. 超声及电生理类
  {
    id: 'SP-2026-013',
    partNo: 'GE-ECG-10LD-01',
    name: 'GE 医疗多导联心电图机一体式除颤防护导联线',
    category: 'ultrasound_diagnostics',
    categoryLabel: '超声及电生理',
    spec: 'GE MAC 2000/5500 专用 10 导联香蕉插头/按扣型 (耐弯折防电刀干扰)',
    brand: '通用电气医疗 (GE Healthcare)',
    warehouseLocation: '医工楼101备件主库 E-01-02',
    currentStock: 7,
    unit: '套',
    minSafeStock: 4,
    maxStockLimit: 20,
    unitCost: 850,
    supplierName: 'GE医疗耗材专供部',
    applicableEquipmentTypes: ['十二导联心电图机', '动态心电记录仪'],
    batchNo: 'LOT-20260512-07',
    expiryDate: '2029-06-30',
    totalOutCount: 15,
    totalInCount: 22,
    lastRestockDate: '2026-07-28',
    status: 'active',
    notes: '各病区心电图波形基线漂移、接触不良常备替换件'
  },
  {
    id: 'SP-2026-014',
    partNo: 'PHIL-US-C52-LENS',
    name: '飞利浦彩色超声凸阵探头声透镜声窗保护膜与应力消除套',
    category: 'ultrasound_diagnostics',
    categoryLabel: '超声及电生理',
    spec: 'Philips EPIQ 7 / Affiniti C5-1 专用高透声医用硅胶声窗',
    brand: '飞利浦医疗 (Philips)',
    warehouseLocation: '医工楼101备件主库 E-01-05',
    currentStock: 1,
    unit: '套',
    minSafeStock: 2, // 偏低预警
    maxStockLimit: 5,
    unitCost: 3200,
    supplierName: '飞利浦超声专科维修站',
    applicableEquipmentTypes: ['彩色多普勒超声诊断仪', '便携式彩超'],
    batchNo: 'LOT-20260120-04',
    expiryDate: '2029-12-31',
    totalOutCount: 3,
    totalInCount: 4,
    lastRestockDate: '2026-04-15',
    status: 'active',
    notes: '超声科探头表面气泡脱胶声学衰减专修备件'
  },

  // 6. 通用机电与维保耗材类
  {
    id: 'SP-2026-015',
    partNo: 'MED-PSU-24V-15A',
    name: '三甲医院医用级低纹波开关稳压电源模组 (24V/15A)',
    category: 'general_consumables',
    categoryLabel: '通用机电耗材',
    spec: 'MeanWell 明纬医用级 RPS-400-24 (符合 IEC/EN 60601-1 医疗认证)',
    brand: '明纬电子 (MEAN WELL)',
    warehouseLocation: '医工楼101备件主库 F-01-01',
    currentStock: 5,
    unit: '台',
    minSafeStock: 3,
    maxStockLimit: 12,
    unitCost: 620,
    supplierName: '明纬电源工业直营站',
    applicableEquipmentTypes: ['血液透析机', '化学发光仪', '输液泵站', '手术床控制器'],
    batchNo: 'LOT-20260410-18',
    expiryDate: '2032-12-31',
    totalOutCount: 8,
    totalInCount: 13,
    lastRestockDate: '2026-06-30',
    status: 'active',
    notes: '各类中小型医疗机电电源烧毁应急替代标准件'
  },
  {
    id: 'SP-2026-016',
    partNo: 'MED-BAT-LION-12V',
    name: '急救转运监护仪与输液泵内置大容量锂电池组',
    category: 'general_consumables',
    categoryLabel: '通用机电耗材',
    spec: '11.1V 4800mAh 智能充放电管理芯片防过充型 (LI204SX)',
    brand: '德赛电池 (Desay)',
    warehouseLocation: '医工楼101备件主库 F-02-03 (防火防爆专柜)',
    currentStock: 9,
    unit: '块',
    minSafeStock: 6,
    maxStockLimit: 25,
    unitCost: 350,
    supplierName: '深圳德赛医疗电池科技',
    applicableEquipmentTypes: ['病人监护仪', '注射泵', '输液泵', '心电图机'],
    batchNo: 'LOT-20260601-09',
    expiryDate: '2028-06-01',
    totalOutCount: 16,
    totalInCount: 25,
    lastRestockDate: '2026-07-20',
    status: 'active',
    notes: '临床科室断电续航时间缩短年限老化定期批量维保替换件'
  }
];

export const INITIAL_STOCK_TRANSACTIONS: StockTransactionRecord[] = [
  {
    id: 'TR-20260906-001',
    partId: 'SP-2026-001',
    partNo: 'MR-SPO2-CBL-09',
    partName: '迈瑞血氧饱和度光敏探头线缆 (7针抗拉扯耐消毒)',
    spec: '512F-30-28263 7-pin 3.0m 成人指夹型',
    type: 'wo_requisition',
    typeLabel: '维修工单领料出库',
    quantity: 1,
    unitCost: 480,
    totalAmount: 480,
    stockBefore: 15,
    stockAfter: 14,
    workOrderId: 'WO-20260906-001',
    equipmentId: 'EQ-2023-089',
    equipmentName: 'Mindray BeneView T8 病人监护仪',
    equipmentSn: 'MR-BV8-992182',
    department: '重症医学科(ICU)',
    operatorId: 'ENG-001',
    operatorName: '张伟 (高级工程师)',
    approverName: '李库管 (备件库管)',
    timestamp: '2026-09-06 09:12',
    remarks: '抢修工单 WO-20260906-001 现场排查血氧探头开路，领料替换'
  },
  {
    id: 'TR-20260906-002',
    partId: 'SP-2026-002',
    partNo: 'DRG-EXH-VLV-84',
    partName: '德尔格呼吸机呼气阀组件 (含膜片与加热体)',
    spec: 'Dräger Evita V500/V300 专用高压可耐受灭菌型',
    type: 'wo_requisition',
    typeLabel: '维修工单领料出库',
    quantity: 1,
    unitCost: 3600,
    totalAmount: 3600,
    stockBefore: 4,
    stockAfter: 3,
    workOrderId: 'WO-20260906-004',
    equipmentId: 'EQ-2024-012',
    equipmentName: 'Dräger Evita V300 重症有创呼吸机',
    equipmentSn: 'DRG-V300-8819',
    department: '急诊重症监护室(EICU)',
    operatorId: 'ENG-001',
    operatorName: '张伟 (高级工程师)',
    approverName: '李库管 (备件库管)',
    timestamp: '2026-09-06 14:35',
    remarks: '呼吸机呼气阻力偏高自检报错，领用全新呼气阀组件更换'
  },
  {
    id: 'TR-20260905-001',
    partId: 'SP-2026-008',
    partNo: 'BCM-PUMP-TUBE-02',
    partName: '全自动生化分析仪高精度陶瓷微升注样针与微步进泵管',
    spec: '耐强酸碱防交叉污染特氟龙包覆 50uL~1000uL 恒温型',
    type: 'wo_requisition',
    typeLabel: '维修工单领料出库',
    quantity: 2,
    unitCost: 1250,
    totalAmount: 2500,
    stockBefore: 10,
    stockAfter: 8,
    workOrderId: 'WO-20260905-003',
    equipmentId: 'EQ-2022-045',
    equipmentName: 'Roche Cobas c501 全自动生化分析仪',
    equipmentSn: 'ROCHE-C501-3829',
    department: '检验科急诊生化组',
    operatorId: 'ENG-003',
    operatorName: '王强 (检验生化组长)',
    approverName: '李库管 (备件库管)',
    timestamp: '2026-09-05 16:20',
    remarks: '加样针弯折吸液滴漏，更换两组注样针与微步进管路'
  },
  {
    id: 'TR-20260904-001',
    partId: 'SP-2026-012',
    partNo: 'VAL-ESU-PED-04',
    partName: '美敦力高频电刀双极脚踏控制器与负极板转接电缆',
    spec: 'ValleyLab FT10 专用防水重型脚踏开关与REM负极板检测线',
    type: 'wo_requisition',
    typeLabel: '维修工单领料出库',
    quantity: 1,
    unitCost: 2600,
    totalAmount: 2600,
    stockBefore: 4,
    stockAfter: 3,
    workOrderId: 'WO-20260904-002',
    equipmentId: 'EQ-2023-112',
    equipmentName: 'ValleyLab FT10 高频电外科能量发生器',
    equipmentSn: 'MED-FT10-5591',
    department: '麻醉手术中心',
    operatorId: 'ENG-005',
    operatorName: '陈超 (腔镜手术组)',
    approverName: '李库管 (备件库管)',
    timestamp: '2026-09-04 11:10',
    remarks: '手术室内电刀脚踏被推车碾压线芯短路，出库领料更换'
  },
  {
    id: 'TR-20260902-001',
    partId: 'SP-2026-016',
    partNo: 'MED-BAT-LION-12V',
    partName: '急救转运监护仪与输液泵内置大容量锂电池组',
    spec: '11.1V 4800mAh 智能充放电管理芯片防过充型 (LI204SX)',
    type: 'purchase_in',
    typeLabel: '采购验收入库',
    quantity: 10,
    unitCost: 350,
    totalAmount: 3500,
    stockBefore: 0,
    stockAfter: 10,
    operatorId: 'BUY-001',
    operatorName: '医学装备科采购组',
    approverName: '李库管 (备件库管)',
    timestamp: '2026-09-02 10:00',
    remarks: '年度常规维保应急备电集中批量采购验收入库'
  },
  {
    id: 'TR-20260901-002',
    partId: 'SP-2026-003',
    partNo: 'PHIL-DF-CAP-32',
    partName: '飞利浦除颤监护仪高能放电电容与继电器模块',
    spec: '32uF 6000V 脉冲充放电级耐受型',
    type: 'wo_requisition',
    typeLabel: '维修工单领料出库',
    quantity: 1,
    unitCost: 4200,
    totalAmount: 4200,
    stockBefore: 3,
    stockAfter: 2,
    workOrderId: 'WO-20260901-008',
    equipmentId: 'EQ-2023-019',
    equipmentName: 'Philips HeartStart XL+ 双相波除颤仪',
    equipmentSn: 'PH-DF-201931',
    department: '急诊抢救室',
    operatorId: 'ENG-002',
    operatorName: '李芳 (急救维保工程师)',
    approverName: '李库管 (备件库管)',
    timestamp: '2026-09-01 16:45',
    remarks: '除颤仪充电超时无法到达200J自检报错，领料更换高压储能电容'
  },
  {
    id: 'TR-20260830-001',
    partId: 'SP-2026-011',
    partNo: 'STORZ-LAMP-300',
    partName: '卡尔史托斯内窥镜高清冷光源短弧氙灯泡灯芯',
    spec: 'Xenon 300W 额定点火寿命500h带计时芯片',
    type: 'wo_requisition',
    typeLabel: '维修工单领料出库',
    quantity: 1,
    unitCost: 2800,
    totalAmount: 2800,
    stockBefore: 3,
    stockAfter: 2,
    workOrderId: 'WO-20260830-002',
    equipmentId: 'EQ-2024-031',
    equipmentName: 'Karl Storz D-Light C 高清腹腔镜冷光源',
    equipmentSn: 'KS-DL-4482',
    department: '微创腔镜手术中心',
    operatorId: 'ENG-005',
    operatorName: '陈超 (腔镜手术组)',
    approverName: '李库管 (备件库管)',
    timestamp: '2026-08-30 08:30',
    remarks: '手术中冷光源报警灯泡寿命超过500小时亮度衰减，领用新灯芯更换'
  },
  {
    id: 'TR-20260828-003',
    partId: 'SP-2026-004',
    partNo: 'FRES-UF-VALVE-06',
    partName: '费森尤斯血液透析机超滤平衡腔电磁阀组',
    spec: 'Fresenius 4008S/5008S 专用低压耐化学消毒电磁阀',
    type: 'wo_requisition',
    typeLabel: '维修工单领料出库',
    quantity: 1,
    unitCost: 1850,
    totalAmount: 1850,
    stockBefore: 6,
    stockAfter: 5,
    workOrderId: 'WO-20260828-005',
    equipmentId: 'EQ-2022-077',
    equipmentName: 'Fresenius 5008S 血液透析滤过机',
    equipmentSn: 'FRES-5008-9821',
    department: '血液净化中心(血透室)',
    operatorId: 'ENG-004',
    operatorName: '刘洋 (透析维保工程师)',
    approverName: '李库管 (备件库管)',
    timestamp: '2026-08-28 15:20',
    remarks: '超滤自检失败压力波动，更换超滤平衡腔3号电磁阀'
  },
  {
    id: 'TR-20260826-001',
    partId: 'SP-2026-010',
    partNo: 'OLYM-ENDO-SEAL-08',
    partName: '奥林巴斯电子胃肠镜钳道管道活塞阀与防水密封帽',
    spec: 'Olympus 290 系列胃肠镜通用耐高温高压灭菌硅胶阀门',
    type: 'purchase_in',
    typeLabel: '采购验收入库',
    quantity: 20,
    unitCost: 120,
    totalAmount: 2400,
    stockBefore: 5,
    stockAfter: 25,
    operatorId: 'BUY-001',
    operatorName: '医学装备科采购组',
    approverName: '李库管 (备件库管)',
    timestamp: '2026-08-26 10:15',
    remarks: '内镜中心季度常规损耗密封组件批量供货验收入库'
  },
  {
    id: 'TR-20260825-002',
    partId: 'SP-2026-013',
    partNo: 'GE-ECG-10LD-01',
    partName: 'GE 医疗多导联心电图机一体式除颤防护导联线',
    spec: '10-lead AHA/IEC 导联线带4.0香蕉插头与防折保护套',
    type: 'wo_requisition',
    typeLabel: '维修工单领料出库',
    quantity: 2,
    unitCost: 320,
    totalAmount: 640,
    stockBefore: 12,
    stockAfter: 10,
    workOrderId: 'WO-20260825-003',
    equipmentId: 'EQ-2023-066',
    equipmentName: 'GE MAC 2000 十二导联心电图机',
    equipmentSn: 'GE-MAC-33829',
    department: '心血管内科门诊',
    operatorId: 'ENG-001',
    operatorName: '张伟 (高级工程师)',
    approverName: '李库管 (备件库管)',
    timestamp: '2026-08-25 14:10',
    remarks: '门诊心电图机胸导联线芯内部疲劳断线，领用两套导联线替换'
  },
  {
    id: 'TR-20260823-001',
    partId: 'SP-2026-005',
    partNo: 'GE-CT-THERM-01',
    partName: 'GE Revolution CT 机架滑环碳刷组件与热敏温控器',
    spec: '碳铜复合低磨损导电滑环电刷组件 (配火花抑制电阻)',
    type: 'wo_requisition',
    typeLabel: '维修工单领料出库',
    quantity: 1,
    unitCost: 6500,
    totalAmount: 6500,
    stockBefore: 2,
    stockAfter: 1,
    workOrderId: 'WO-20260823-001',
    equipmentId: 'EQ-2021-002',
    equipmentName: 'GE Revolution CT 256排极速能谱CT',
    equipmentSn: 'GE-REV-09281',
    department: '放射影像科',
    operatorId: 'ENG-006',
    operatorName: '周建国 (大型影像工程师)',
    approverName: '李库管 (备件库管)',
    timestamp: '2026-08-23 20:00',
    remarks: '夜间急诊CT机架高速旋转碳刷磨损极限告警，停机领料紧急更换'
  },
  {
    id: 'TR-20260820-004',
    partId: 'SP-2026-015',
    partNo: 'MED-PSU-24V-15A',
    partName: '三甲医院医用级低纹波开关稳压电源模组 (24V/15A)',
    spec: 'MEAN WELL 医用级认证 EN60601-1 400W 低漏电流高隔离型',
    type: 'purchase_in',
    typeLabel: '采购验收入库',
    quantity: 5,
    unitCost: 950,
    totalAmount: 4750,
    stockBefore: 0,
    stockAfter: 5,
    operatorId: 'BUY-001',
    operatorName: '医学装备科采购组',
    approverName: '李库管 (备件库管)',
    timestamp: '2026-08-20 11:30',
    remarks: '通用医用级开关电源应急战略储备入库'
  },
  {
    id: 'TR-20260818-001',
    partId: 'SP-2026-014',
    partNo: 'PHIL-US-C52-LENS',
    partName: '飞利浦彩色超声凸阵探头声透镜声窗保护膜与应力消除套',
    spec: 'Philips C5-2 腹部探头专用高透声医用硅胶透镜修补套件',
    type: 'wo_return',
    typeLabel: '维修工单退料还库',
    quantity: 1,
    unitCost: 1500,
    totalAmount: -1500,
    stockBefore: 3,
    stockAfter: 4,
    workOrderId: 'WO-20260817-009',
    equipmentId: 'EQ-2023-054',
    equipmentName: 'Philips EPIQ 7 全数字彩色超声诊断系统',
    equipmentSn: 'PH-EPIQ-8820',
    department: '超声医学科',
    operatorId: 'ENG-001',
    operatorName: '张伟 (高级工程师)',
    approverName: '李库管 (备件库管)',
    timestamp: '2026-08-18 09:15',
    remarks: '工单经第三方原厂直接换新探头质保，原领用的修补备件完好退库'
  }
];

const LOCAL_STORAGE_KEY_PARTS = 'hospital_spare_parts_catalog_v1';
const LOCAL_STORAGE_KEY_TRANSACTIONS = 'hospital_spare_parts_transactions_v2';

export function loadStoredSpareParts(): SparePartItem[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY_PARTS);
    if (!raw) return INITIAL_SPARE_PARTS;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
  } catch (err) {
    console.error('Failed to load spare parts from localStorage:', err);
  }
  return INITIAL_SPARE_PARTS;
}

export function saveStoredSpareParts(parts: SparePartItem[]): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY_PARTS, JSON.stringify(parts));
  } catch (err) {
    console.error('Failed to save spare parts to localStorage:', err);
  }
}

export function loadStoredStockTransactions(): StockTransactionRecord[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY_TRANSACTIONS);
    if (!raw) return INITIAL_STOCK_TRANSACTIONS;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
  } catch (err) {
    console.error('Failed to load stock transactions from localStorage:', err);
  }
  return INITIAL_STOCK_TRANSACTIONS;
}

export function saveStoredStockTransactions(txs: StockTransactionRecord[]): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY_TRANSACTIONS, JSON.stringify(txs));
  } catch (err) {
    console.error('Failed to save stock transactions to localStorage:', err);
  }
}

export function calculateSparePartsKpiStats(
  parts: SparePartItem[] = [],
  txs: StockTransactionRecord[] = []
): SparePartsKpiStats {
  const safeParts = Array.isArray(parts) ? parts : [];
  const safeTxs = Array.isArray(txs) ? txs : [];
  const totalSkuCount = safeParts.length;
  const totalStockValue = safeParts.reduce((sum, p) => sum + (p.currentStock || 0) * (p.unitCost || 0), 0);

  let lowStockWarningCount = 0;
  let outOfStockCount = 0;
  let activePartsCount = 0;

  safeParts.forEach(p => {
    if (p.status === 'active') activePartsCount++;
    const current = p.currentStock ?? 0;
    const minSafe = p.minSafeStock ?? 0;
    if (current === 0) {
      outOfStockCount++;
      lowStockWarningCount++;
    } else if (current <= minSafe) {
      lowStockWarningCount++;
    }
  });

  // Calculate current month requisitions
  const currentMonthPrefix = '2026-09';
  const monthReqTxs = safeTxs.filter(
    t => t && t.type === 'wo_requisition' && t.timestamp && t.timestamp.startsWith(currentMonthPrefix)
  );

  const monthRequisitionCost = monthReqTxs.reduce((sum, t) => sum + (t.totalAmount || 0), 0);
  const monthRequisitionCount = monthReqTxs.length;

  return {
    totalSkuCount,
    totalStockValue,
    lowStockWarningCount,
    outOfStockCount,
    monthRequisitionCost,
    monthRequisitionCount,
    activePartsCount
  };
}

/**
 * 维修工单从备件库领料出库的核心联动业务函数
 */
export function issueSparePartForWorkOrder(
  partsList: SparePartItem[],
  transactionList: StockTransactionRecord[],
  partId: string,
  quantity: number,
  workOrderId: string,
  equipmentInfo: { id?: string; name: string; sn: string; department: string },
  engineerName: string,
  dispatcherOrApproverName?: string
): {
  success: boolean;
  message: string;
  updatedParts: SparePartItem[];
  updatedTransactions: StockTransactionRecord[];
  issuedPart?: SparePartItem;
  transactionRecord?: StockTransactionRecord;
} {
  const targetPartIndex = partsList.findIndex(p => p.id === partId);
  if (targetPartIndex === -1) {
    return {
      success: false,
      message: '未在医工备件库中检索到对应配件编号',
      updatedParts: partsList,
      updatedTransactions: transactionList
    };
  }

  const targetPart = partsList[targetPartIndex];
  if (targetPart.currentStock < quantity) {
    return {
      success: false,
      message: `备件【${targetPart.name}】当前可用库存为 ${targetPart.currentStock} ${targetPart.unit}，不足本次申请领用量 (${quantity} ${targetPart.unit})`,
      updatedParts: partsList,
      updatedTransactions: transactionList
    };
  }

  const pad = (n: number) => n.toString().padStart(2, '0');
  const d = new Date();
  const nowStr = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  const txId = `TR-${Date.now().toString().slice(-8)}`;

  const stockBefore = targetPart.currentStock;
  const stockAfter = stockBefore - quantity;

  const updatedPart: SparePartItem = {
    ...targetPart,
    currentStock: stockAfter,
    totalOutCount: targetPart.totalOutCount + quantity
  };

  const newTx: StockTransactionRecord = {
    id: txId,
    partId: targetPart.id,
    partNo: targetPart.partNo,
    partName: targetPart.name,
    spec: targetPart.spec,
    type: 'wo_requisition',
    typeLabel: '维修工单领料出库',
    quantity: quantity,
    unitCost: targetPart.unitCost,
    totalAmount: quantity * targetPart.unitCost,
    stockBefore,
    stockAfter,
    workOrderId,
    equipmentId: equipmentInfo.id,
    equipmentName: equipmentInfo.name,
    equipmentSn: equipmentInfo.sn,
    department: equipmentInfo.department,
    operatorId: 'ENG-LINK',
    operatorName: engineerName,
    approverName: dispatcherOrApproverName || '医工备件库管',
    timestamp: nowStr,
    remarks: `工单【${workOrderId}】现场维修领用出库，设备SN: ${equipmentInfo.sn} (${equipmentInfo.department})`
  };

  const nextParts = [...partsList];
  nextParts[targetPartIndex] = updatedPart;

  const nextTxs = [newTx, ...transactionList];

  saveStoredSpareParts(nextParts);
  saveStoredStockTransactions(nextTxs);

  return {
    success: true,
    message: `成功领料出库！备件【${targetPart.name}】已扣减 ${quantity} ${targetPart.unit}，当前在库结存 ${stockAfter} ${targetPart.unit}`,
    updatedParts: nextParts,
    updatedTransactions: nextTxs,
    issuedPart: updatedPart,
    transactionRecord: newTx
  };
}

/**
 * 维修工单退料还库联动函数 (例如现场未用上备件)
 */
export function returnSparePartForWorkOrder(
  partsList: SparePartItem[],
  transactionList: StockTransactionRecord[],
  partId: string,
  quantity: number,
  workOrderId: string,
  engineerName: string,
  reason: string = '现场排查诊断无需更换该配件'
): {
  success: boolean;
  message: string;
  updatedParts: SparePartItem[];
  updatedTransactions: StockTransactionRecord[];
} {
  const targetPartIndex = partsList.findIndex(p => p.id === partId);
  if (targetPartIndex === -1) {
    return {
      success: false,
      message: '未在医工备件库中检索到对应配件编号',
      updatedParts: partsList,
      updatedTransactions: transactionList
    };
  }

  const targetPart = partsList[targetPartIndex];
  const pad = (n: number) => n.toString().padStart(2, '0');
  const d = new Date();
  const nowStr = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  const txId = `TR-${Date.now().toString().slice(-8)}`;

  const stockBefore = targetPart.currentStock;
  const stockAfter = stockBefore + quantity;

  const updatedPart: SparePartItem = {
    ...targetPart,
    currentStock: stockAfter,
    totalOutCount: Math.max(0, targetPart.totalOutCount - quantity)
  };

  const newTx: StockTransactionRecord = {
    id: txId,
    partId: targetPart.id,
    partNo: targetPart.partNo,
    partName: targetPart.name,
    spec: targetPart.spec,
    type: 'wo_return',
    typeLabel: '维修工单退料还库',
    quantity: quantity,
    unitCost: targetPart.unitCost,
    totalAmount: -(quantity * targetPart.unitCost),
    stockBefore,
    stockAfter,
    workOrderId,
    operatorId: 'ENG-LINK',
    operatorName: engineerName,
    approverName: '医工备件库管',
    timestamp: nowStr,
    remarks: `工单【${workOrderId}】退料还库：${reason}`
  };

  const nextParts = [...partsList];
  nextParts[targetPartIndex] = updatedPart;

  const nextTxs = [newTx, ...transactionList];

  saveStoredSpareParts(nextParts);
  saveStoredStockTransactions(nextTxs);

  return {
    success: true,
    message: `退料成功！备件【${targetPart.name}】已重新入库加回 ${quantity} ${targetPart.unit}，在库更新为 ${stockAfter} ${targetPart.unit}`,
    updatedParts: nextParts,
    updatedTransactions: nextTxs
  };
}

/**
 * 备件常规采购补库或平账调整
 */
export function restockSparePart(
  partsList: SparePartItem[],
  transactionList: StockTransactionRecord[],
  partId: string,
  quantity: number,
  unitCost: number,
  operatorName: string,
  batchNo?: string,
  remarks?: string
): {
  success: boolean;
  message: string;
  updatedParts: SparePartItem[];
  updatedTransactions: StockTransactionRecord[];
} {
  const targetPartIndex = partsList.findIndex(p => p.id === partId);
  if (targetPartIndex === -1) {
    return {
      success: false,
      message: '未找到备件记录',
      updatedParts: partsList,
      updatedTransactions: transactionList
    };
  }

  const targetPart = partsList[targetPartIndex];
  const pad = (n: number) => n.toString().padStart(2, '0');
  const d = new Date();
  const nowStr = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  const txId = `TR-${Date.now().toString().slice(-8)}`;

  const stockBefore = targetPart.currentStock;
  const stockAfter = stockBefore + quantity;

  const updatedPart: SparePartItem = {
    ...targetPart,
    currentStock: stockAfter,
    totalInCount: targetPart.totalInCount + quantity,
    lastRestockDate: nowStr.split(' ')[0],
    unitCost: unitCost || targetPart.unitCost,
    batchNo: batchNo || targetPart.batchNo,
    status: 'active'
  };

  const newTx: StockTransactionRecord = {
    id: txId,
    partId: targetPart.id,
    partNo: targetPart.partNo,
    partName: targetPart.name,
    spec: targetPart.spec,
    type: 'purchase_in',
    typeLabel: '采购验收入库',
    quantity,
    unitCost: unitCost || targetPart.unitCost,
    totalAmount: quantity * (unitCost || targetPart.unitCost),
    stockBefore,
    stockAfter,
    operatorId: 'BUY-OPERATOR',
    operatorName,
    approverName: '医工备件库管',
    timestamp: nowStr,
    remarks: remarks || `备件常规验收入库 ${quantity} ${targetPart.unit}`
  };

  const nextParts = [...partsList];
  nextParts[targetPartIndex] = updatedPart;

  const nextTxs = [newTx, ...transactionList];

  saveStoredSpareParts(nextParts);
  saveStoredStockTransactions(nextTxs);

  return {
    success: true,
    message: `备件【${targetPart.name}】成功验收入库 ${quantity} ${targetPart.unit}，当前在库合计 ${stockAfter} ${targetPart.unit}`,
    updatedParts: nextParts,
    updatedTransactions: nextTxs
  };
}

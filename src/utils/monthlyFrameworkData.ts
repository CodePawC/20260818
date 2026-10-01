import { 
  MonthlyFrameworkBatch, 
  MonthlyFrameworkItem, 
  FrameworkBatchStatus, 
  FrameworkBatchInvoice 
} from '../types/vendorCollaborationTypes';
import { DEFAULT_DEPARTMENTS, resolveMasterDepartment } from './masterData';

export const FRAMEWORK_BATCHES_STORAGE_KEY = 'hospital_monthly_framework_repair_batches';

// 初始预置：将用户提供的48项零散维修项目按月度框架归档
export const INITIAL_FRAMEWORK_BATCHES: MonthlyFrameworkBatch[] = [
  // 1. 2026年06月度批次 (8项，共计 7,630.00 元)
  {
    id: 'BATCH-2026-06',
    yearMonth: '2026-06',
    batchTitle: '2026年06月度全院零星设备维保框架结算批次',
    vendorId: 'ISO-001',
    vendorName: '国药器械医工技术服务 (中国) 有限公司',
    contractNo: 'SINOPHARM-2026-TOTAL-06',
    totalAmount: 7630.00,
    itemCount: 8,
    status: 'FINANCE_APPROVED',
    paymentStatus: 'PAID',
    paidAmount: 7630.00,
    paidAt: '2026-07-15',
    paymentVoucherNo: 'BOC-20260715-9921',
    paymentBank: '中国银行国库集中支付电汇',
    invoiceStatus: 'INVOICED',
    hospitalApprovedAmount: 7630.00,
    reconciledStatus: 'VERIFIED',
    reconciledAt: '2026-07-04',
    reconciledBy: '张主任 (医学工程科) & 财务科',
    createdAt: '2026-06-30 17:30',
    submittedAt: '2026-07-02 09:15',
    auditedAt: '2026-07-04 14:20',
    auditedBy: '张主任 (医学工程科主任)',
    auditNotes: '经核对6月份8项零星维修工单，故障真实、科室验收签字齐全、旧件已退库，单价符合框架协议，准予报销。',
    invoiceRecord: {
      invoiceType: 'SPECIAL_VAT',
      invoiceCode: '044002200111',
      invoiceNo: '68291044',
      invoiceAmount: 7630.00,
      untaxedAmount: 6752.21,
      taxRate: 13,
      taxAmount: 877.79,
      invoiceDate: '2026-07-01',
      hasTaxSalesList: true,
      taxSalesListFileName: '金税税控销货清单_202606批次_8项明细.pdf',
      invoiceFileName: '增值税专用发票_68291044.pdf',
      verificationStatus: 'VERIFIED',
      buyerName: '五莲县人民医院',
      buyerTaxNo: '12371121493820198X',
      sellerName: '国药器械医工技术服务 (中国) 有限公司',
      sellerTaxNo: '91440101718166542G',
    },
    complianceChecklist: {
      dispatchOrderAttached: true,
      fieldServiceReportAttached: true,
      replacedPartsReturned: true,
      clinicalAcceptanceSigned: true,
      invoiceMatchesSummary: true,
    },
    items: [
      {
        id: 'ITEM-202606-01',
        itemName: '理疗烤灯供电回路检修及温控总成更换',
        unit: '项',
        quantity: 1,
        unitPrice: 200.00,
        totalPrice: 200.00,
        department: '普外一科',
        serviceDate: '2026/6/19',
        status: 'COMPLETED',
        engineerName: '陈志远',
        clinicalSignee: '普外一科 护士长',
        oldPartsReturned: true,
        auditTag: '小额直接报销',
        notes: '供电回路排障与温控双金属片换新'
      },
      {
        id: 'ITEM-202606-02',
        itemName: '彩色多普勒超声成像系统主板维修与校准',
        unit: '台',
        quantity: 1,
        unitPrice: 2800.00,
        totalPrice: 2800.00,
        department: '彩超室',
        serviceDate: '2026/6/22',
        status: 'COMPLETED',
        engineerName: '李强',
        clinicalSignee: '彩超室 主任技师',
        oldPartsReturned: true,
        auditTag: '常规零星维修',
        notes: '主板供电与滤波电容芯片级排障，声场校准合格'
      },
      {
        id: 'ITEM-202606-03',
        itemName: '手术室动力系统开颅钻电机驱动检修',
        unit: '台',
        quantity: 1,
        unitPrice: 1800.00,
        totalPrice: 1800.00,
        department: '麻醉手术科',
        serviceDate: '2026/6/22',
        status: 'COMPLETED',
        engineerName: '黄工',
        clinicalSignee: '麻醉手术科 总护士长',
        oldPartsReturned: true,
        auditTag: '常规零星维修',
        notes: '无刷电机驱动板换件焊接及转速动平衡校准'
      },
      {
        id: 'ITEM-202606-04',
        itemName: '手术室洁净区防撞设施加固与结构修复',
        unit: '项',
        quantity: 1,
        unitPrice: 350.00,
        totalPrice: 350.00,
        department: '麻醉手术科',
        serviceDate: '2026/6/22',
        status: 'COMPLETED',
        engineerName: '赵师傅',
        clinicalSignee: '麻醉手术科 器械班长',
        oldPartsReturned: false,
        auditTag: '小额直接报销',
        notes: '防撞带膨胀螺栓重新紧固与密封胶补打'
      },
      {
        id: 'ITEM-202606-05',
        itemName: '手术室顶板密闭性恢复与加固工程',
        unit: '项',
        quantity: 1,
        unitPrice: 280.00,
        totalPrice: 280.00,
        department: '麻醉手术科',
        serviceDate: '2026/6/23',
        status: 'COMPLETED',
        engineerName: '赵师傅',
        clinicalSignee: '麻醉手术科 巡回护士',
        oldPartsReturned: false,
        auditTag: '小额直接报销',
        notes: '夹芯彩钢板接缝密封性恢复，负压巡检达标'
      },
      {
        id: 'ITEM-202606-06',
        itemName: '消毒供应中心纯水机控制系统及线缆总成检修',
        unit: '项',
        quantity: 1,
        unitPrice: 1200.00,
        totalPrice: 1200.00,
        department: '消毒供应室',
        serviceDate: '2026/6/23',
        status: 'COMPLETED',
        engineerName: '王工',
        clinicalSignee: '消毒供应室 护士长',
        oldPartsReturned: true,
        auditTag: '常规零星维修',
        notes: '更换低压接触器与水阻率探头信号线'
      },
      {
        id: 'ITEM-202606-07',
        itemName: '移动式C形臂X射线机供电与控制回路抢修',
        unit: '台',
        quantity: 1,
        unitPrice: 500.00,
        totalPrice: 500.00,
        department: '麻醉手术科',
        serviceDate: '2026/6/24',
        status: 'COMPLETED',
        engineerName: '刘工',
        clinicalSignee: '麻醉手术科 技师',
        oldPartsReturned: true,
        auditTag: '小额直接报销',
        notes: '急修高压发生器电源互锁开关及保险管'
      },
      {
        id: 'ITEM-202606-08',
        itemName: '消毒供应中心清洗消毒机气液管路与快插接头检修',
        unit: '项',
        quantity: 1,
        unitPrice: 500.00,
        totalPrice: 500.00,
        department: '消毒供应室',
        serviceDate: '2026/6/26',
        status: 'COMPLETED',
        engineerName: '王工',
        clinicalSignee: '消毒供应室 班长',
        oldPartsReturned: true,
        auditTag: '小额直接报销',
        notes: '更换高温快插耐磨软管及电磁阀密封圈'
      }
    ]
  },

  // 2. 2026年07月度批次 (1项，共计 500.00 元)
  {
    id: 'BATCH-2026-07',
    yearMonth: '2026-07',
    batchTitle: '2026年07月度全院零星设备维保框架结算批次',
    vendorId: 'ISO-001',
    vendorName: '国药器械医工技术服务 (中国) 有限公司',
    contractNo: 'SINOPHARM-2026-TOTAL-07',
    totalAmount: 500.00,
    itemCount: 1,
    status: 'FINANCE_APPROVED',
    paymentStatus: 'PAID',
    paidAmount: 500.00,
    paidAt: '2026-08-10',
    paymentVoucherNo: 'ICBC-20260810-3312',
    paymentBank: '中国工商银行对公集中电汇',
    invoiceStatus: 'INVOICED',
    hospitalApprovedAmount: 500.00,
    reconciledStatus: 'VERIFIED',
    reconciledAt: '2026-08-03',
    reconciledBy: '张主任 (医学工程科主任)',
    createdAt: '2026-07-31 16:40',
    submittedAt: '2026-08-01 10:00',
    auditedAt: '2026-08-03 11:30',
    auditedBy: '张主任 (医学工程科主任)',
    auditNotes: '7月份仅1项感应门总成维修，金额500元，验收手续完整，发票与销货单核对无误。',
    invoiceRecord: {
      invoiceType: 'SPECIAL_VAT',
      invoiceCode: '044002200111',
      invoiceNo: '68291089',
      invoiceAmount: 500.00,
      untaxedAmount: 442.48,
      taxRate: 13,
      taxAmount: 57.52,
      invoiceDate: '2026-08-01',
      hasTaxSalesList: true,
      taxSalesListFileName: '金税税控销货清单_202607批次.pdf',
      invoiceFileName: '增值税专用发票_68291089.pdf',
      verificationStatus: 'VERIFIED',
      buyerName: '五莲县人民医院',
      buyerTaxNo: '12371121493820198X',
      sellerName: '国药器械医工技术服务 (中国) 有限公司',
      sellerTaxNo: '91440101718166542G',
    },
    complianceChecklist: {
      dispatchOrderAttached: true,
      fieldServiceReportAttached: true,
      replacedPartsReturned: true,
      clinicalAcceptanceSigned: true,
      invoiceMatchesSummary: true,
    },
    items: [
      {
        id: 'ITEM-202607-01',
        itemName: '手术室感应自动门控制总成换新（含备件）',
        unit: '项',
        quantity: 1,
        unitPrice: 500.00,
        totalPrice: 500.00,
        department: '麻醉手术科',
        serviceDate: '2026/7/3',
        status: 'COMPLETED',
        engineerName: '陈师傅',
        clinicalSignee: '麻醉手术科 护士长',
        oldPartsReturned: true,
        auditTag: '小额直接报销',
        notes: '更换门禁主控制盒及光电防夹安全感应探头'
      }
    ]
  },

  // 3. 2026年08月度批次 (26项，共计 29,660.00 元)
  {
    id: 'BATCH-2026-08',
    yearMonth: '2026-08',
    batchTitle: '2026年08月度全院零星设备维保框架结算批次',
    vendorId: 'ISO-001',
    vendorName: '国药器械医工技术服务 (中国) 有限公司',
    contractNo: 'SINOPHARM-2026-TOTAL-08',
    totalAmount: 29660.00,
    itemCount: 26,
    status: 'SUBMITTED_TO_HOSPITAL',
    paymentStatus: 'IN_TRANSIT',
    paidAmount: 0,
    expectedPaymentDate: '2026-09-25',
    invoiceStatus: 'INVOICED',
    hospitalApprovedAmount: 29660.00,
    reconciledStatus: 'VERIFIED',
    reconciledAt: '2026-09-02',
    reconciledBy: '医学工程科联合财务初审',
    createdAt: '2026-08-31 18:00',
    submittedAt: '2026-09-01 09:30',
    auditNotes: '待医工科与财务科进行月度统一审定，发票已上传待勾稽对账。',
    invoiceRecord: {
      invoiceType: 'SPECIAL_VAT',
      invoiceCode: '044002200111',
      invoiceNo: '68292150',
      invoiceAmount: 29660.00,
      untaxedAmount: 26247.79,
      taxRate: 13,
      taxAmount: 3412.21,
      invoiceDate: '2026-09-01',
      hasTaxSalesList: true,
      taxSalesListFileName: '金税税控销货清单_202608批次_26项逐笔明细.pdf',
      invoiceFileName: '增值税专用发票_68292150.pdf',
      verificationStatus: 'PENDING',
      buyerName: '五莲县人民医院',
      buyerTaxNo: '12371121493820198X',
      sellerName: '国药器械医工技术服务 (中国) 有限公司',
      sellerTaxNo: '91440101718166542G',
    },
    complianceChecklist: {
      dispatchOrderAttached: true,
      fieldServiceReportAttached: true,
      replacedPartsReturned: true,
      clinicalAcceptanceSigned: true,
      invoiceMatchesSummary: true,
    },
    items: [
      {
        id: 'ITEM-202608-01',
        itemName: '数字化医用X射线摄影系统（DR）光路校准',
        unit: '次',
        quantity: 1,
        unitPrice: 1500.00,
        totalPrice: 1500.00,
        department: '影像科',
        serviceDate: '2026/8/3',
        status: 'COMPLETED',
        engineerName: '李工',
        clinicalSignee: '影像科 技师长',
        oldPartsReturned: false,
        auditTag: '常规零星维修',
        notes: '激光束中心定位与准直器光野对光校准，符合质控要求'
      },
      {
        id: 'ITEM-202608-02',
        itemName: '手术间净化机组冷循环系统排障与滤网维护',
        unit: '项',
        quantity: 1,
        unitPrice: 500.00,
        totalPrice: 500.00,
        department: '动力设备层',
        serviceDate: '2026/8/4',
        status: 'COMPLETED',
        engineerName: '张师傅',
        clinicalSignee: '后勤动力科 值班工程师',
        oldPartsReturned: false,
        auditTag: '小额直接报销',
        notes: '冷凝回路清洗、中效袋式过滤器拆装清理'
      },
      {
        id: 'ITEM-202608-03',
        itemName: '综合口腔治疗台水气控制管路疏通维护',
        unit: '台',
        quantity: 1,
        unitPrice: 180.00,
        totalPrice: 180.00,
        department: '口腔科',
        serviceDate: '2026/8/10',
        status: 'COMPLETED',
        engineerName: '王工',
        clinicalSignee: '口腔科 护士长',
        oldPartsReturned: false,
        auditTag: '小额直接报销',
        notes: '弱吸负压管路酸化去垢与气动脚踏开关复位'
      },
      {
        id: 'ITEM-202608-04',
        itemName: '楼宇自控机组控制柜除尘与变频散热改造',
        unit: '项',
        quantity: 1,
        unitPrice: 2800.00,
        totalPrice: 2800.00,
        department: '动力设备层',
        serviceDate: '2026/8/11',
        status: 'COMPLETED',
        engineerName: '刘工',
        clinicalSignee: '动力设备班 长',
        oldPartsReturned: true,
        auditTag: '常规零星维修',
        notes: '配电屏除尘、加装轴流散热风扇总成与变频器温控联动'
      },
      {
        id: 'ITEM-202608-05',
        itemName: '重症监护呼吸机电气系统抢修与气密性标定',
        unit: '台',
        quantity: 1,
        unitPrice: 3000.00,
        totalPrice: 3000.00,
        department: '急诊监护室',
        serviceDate: '2026/8/11',
        status: 'COMPLETED',
        engineerName: '吴建华',
        clinicalSignee: '急诊监护室 主任医师',
        oldPartsReturned: true,
        auditTag: '常规零星维修',
        notes: '更换电源供电板电容组，通气回路气密性标定达标'
      },
      {
        id: 'ITEM-202608-06',
        itemName: '康复科医用气泵密封套件批量更换与除尘',
        unit: '批',
        quantity: 7,
        unitPrice: 80.00,
        totalPrice: 560.00,
        department: '康复科',
        serviceDate: '2026/8/11',
        status: 'COMPLETED',
        engineerName: '陈工',
        clinicalSignee: '康复科 治疗师长',
        oldPartsReturned: true,
        auditTag: '多台合并维保',
        notes: '7台气压式肢体血液循环仪气泵O型圈全面更新'
      },
      {
        id: 'ITEM-202608-07',
        itemName: '行政办公便携终端主板元器件级维修与系统调试',
        unit: '台',
        quantity: 1,
        unitPrice: 480.00,
        totalPrice: 480.00,
        department: '作风办',
        serviceDate: '2026/8/11',
        status: 'COMPLETED',
        engineerName: '李工',
        clinicalSignee: '作风办 负责人',
        oldPartsReturned: true,
        auditTag: '小额直接报销',
        notes: '笔记本主板开机供电MOS管芯片级焊接及固件更新'
      },
      {
        id: 'ITEM-202608-08',
        itemName: '高压氧舱主监控台触控显示终端故障检修',
        unit: '台',
        quantity: 1,
        unitPrice: 780.00,
        totalPrice: 780.00,
        department: '高压氧舱',
        serviceDate: '2026/8/14',
        status: 'COMPLETED',
        engineerName: '周工',
        clinicalSignee: '高压氧科 操舱技师',
        oldPartsReturned: true,
        auditTag: '小额直接报销',
        notes: '触摸屏控制卡线缆重构，修正漂移误差'
      },
      {
        id: 'ITEM-202608-09',
        itemName: '高压氧舱双向对讲通讯回路检修与话筒更换',
        unit: '项',
        quantity: 1,
        unitPrice: 300.00,
        totalPrice: 300.00,
        department: '高压氧舱',
        serviceDate: '2026/8/14',
        status: 'COMPLETED',
        engineerName: '周工',
        clinicalSignee: '高压氧科 护士',
        oldPartsReturned: true,
        auditTag: '小额直接报销',
        notes: '舱内降噪防爆驻极体话筒换新与线路杂音消除'
      },
      {
        id: 'ITEM-202608-10',
        itemName: '十二导联心电图机打印驱动板维修与校准',
        unit: '台',
        quantity: 1,
        unitPrice: 800.00,
        totalPrice: 800.00,
        department: '急救站',
        serviceDate: '2026/8/17',
        status: 'COMPLETED',
        engineerName: '吴建华',
        clinicalSignee: '急救站 随车护士',
        oldPartsReturned: true,
        auditTag: '小额直接报销',
        notes: '热敏打印头驱动板电机步进控制IC更换'
      },
      {
        id: 'ITEM-202608-11',
        itemName: '十二导联心电图机主控板级维修与固件恢复',
        unit: '台',
        quantity: 1,
        unitPrice: 3000.00,
        totalPrice: 3000.00,
        department: '急救站',
        serviceDate: '2026/8/17',
        status: 'COMPLETED',
        engineerName: '吴建华',
        clinicalSignee: '急救站 站长',
        oldPartsReturned: true,
        auditTag: '常规零星维修',
        notes: '主控板DSP处理器虚焊重焊，重刷出厂固件'
      },
      {
        id: 'ITEM-202608-12',
        itemName: '重症监护呼吸机高压医用空气专用连接软管',
        unit: '套',
        quantity: 1,
        unitPrice: 500.00,
        totalPrice: 500.00,
        department: '急诊监护室',
        serviceDate: '2026/8/17',
        status: 'COMPLETED',
        engineerName: '王工',
        clinicalSignee: '急诊监护室 护士长',
        oldPartsReturned: true,
        auditTag: '小额直接报销',
        notes: '更换符合GB标准的防缠绕高耐压空气进气软管'
      },
      {
        id: 'ITEM-202608-13',
        itemName: '医用中心供氧站防静电导流接地装置改造',
        unit: '套',
        quantity: 4,
        unitPrice: 275.00,
        totalPrice: 1100.00,
        department: '医用气站',
        serviceDate: '2026/8/17',
        status: 'COMPLETED',
        engineerName: '赵师傅',
        clinicalSignee: '气体动力科 安全员',
        oldPartsReturned: true,
        auditTag: '常规零星维修',
        notes: '4组汇流排接地铜排重置，接地电阻测试 < 4Ω'
      },
      {
        id: 'ITEM-202608-14',
        itemName: '财务专用工作站主板硬件更换与系统恢复',
        unit: '台',
        quantity: 1,
        unitPrice: 190.00,
        totalPrice: 190.00,
        department: '财务科',
        serviceDate: '2026/8/18',
        status: 'COMPLETED',
        engineerName: '陈工',
        clinicalSignee: '财务科 审核员',
        oldPartsReturned: true,
        auditTag: '小额直接报销',
        notes: '更换南桥电容组并恢复用友金蝶系统引导'
      },
      {
        id: 'ITEM-202608-15',
        itemName: '消毒供应中心多功能器械清洗水枪更换',
        unit: '批',
        quantity: 1,
        unitPrice: 450.00,
        totalPrice: 450.00,
        department: '消毒供应室',
        serviceDate: '2026/8/18',
        status: 'COMPLETED',
        engineerName: '王工',
        clinicalSignee: '消毒供应室 班长',
        oldPartsReturned: true,
        auditTag: '小额直接报销',
        notes: '配备全套8个不同口径清洗喷嘴并完成压力测试'
      },
      {
        id: 'ITEM-202608-16',
        itemName: '洁净区冷媒循环管路高耐压黄铜闸阀更换',
        unit: '项',
        quantity: 1,
        unitPrice: 300.00,
        totalPrice: 300.00,
        department: '动力设备层',
        serviceDate: '2026/8/19',
        status: 'COMPLETED',
        engineerName: '张师傅',
        clinicalSignee: '动力科 暖通工',
        oldPartsReturned: true,
        auditTag: '小额直接报销',
        notes: '解决冷媒微泄漏，充氮保压24小时合格'
      },
      {
        id: 'ITEM-202608-17',
        itemName: '洁净空调机组控制电气系统排障与保护器件更换',
        unit: '项',
        quantity: 1,
        unitPrice: 1200.00,
        totalPrice: 1200.00,
        department: '消毒供应室',
        serviceDate: '2026/8/19',
        status: 'COMPLETED',
        engineerName: '刘工',
        clinicalSignee: '消毒供应室 护士长',
        oldPartsReturned: true,
        auditTag: '常规零星维修',
        notes: '更换缺相保护器与热继电器，恢复自动温湿度连锁'
      },
      {
        id: 'ITEM-202608-18',
        itemName: '医用洗手池感应给水组件及水龙头更换',
        unit: '项',
        quantity: 1,
        unitPrice: 600.00,
        totalPrice: 600.00,
        department: '麻醉手术科',
        serviceDate: '2026/8/20',
        status: 'COMPLETED',
        engineerName: '陈师傅',
        clinicalSignee: '麻醉手术科 器械班长',
        oldPartsReturned: true,
        auditTag: '小额直接报销',
        notes: '外科洗手池红外光电感应水嘴总成换新'
      },
      {
        id: 'ITEM-202608-19',
        itemName: '供应室医用高纯水供水管路探漏与重新对接',
        unit: '次',
        quantity: 1,
        unitPrice: 180.00,
        totalPrice: 180.00,
        department: '消毒供应室',
        serviceDate: '2026/8/24',
        status: 'COMPLETED',
        engineerName: '王工',
        clinicalSignee: '消毒供应室 技师',
        oldPartsReturned: false,
        auditTag: '小额直接报销',
        notes: '卡箍接头重新热熔对接，水压试验无渗漏'
      },
      {
        id: 'ITEM-202608-20',
        itemName: '多参数监护仪无创血压（NIBP）测量模块维修',
        unit: '台',
        quantity: 1,
        unitPrice: 2800.00,
        totalPrice: 2800.00,
        department: '妇产科',
        serviceDate: '2026/8/25',
        status: 'COMPLETED',
        engineerName: '李工',
        clinicalSignee: '妇产科 护士长',
        oldPartsReturned: true,
        auditTag: '常规零星维修',
        notes: '更换精密充气微气泵与静态压力传感器芯片'
      },
      {
        id: 'ITEM-202608-21',
        itemName: '紫外线消毒灭菌控制面板与延时线路维保',
        unit: '次',
        quantity: 1,
        unitPrice: 80.00,
        totalPrice: 80.00,
        department: '内分泌科',
        serviceDate: '2026/8/26',
        status: 'COMPLETED',
        engineerName: '陈工',
        clinicalSignee: '内分泌科 护士',
        oldPartsReturned: true,
        auditTag: '小额直接报销',
        notes: '更换延时继电器，防止医护误入照射'
      },
      {
        id: 'ITEM-202608-22',
        itemName: '彩色多普勒超声成像系统主控制板级芯片维修',
        unit: '台',
        quantity: 1,
        unitPrice: 3000.00,
        totalPrice: 3000.00,
        department: '彩超科',
        serviceDate: '2026/8/27',
        status: 'COMPLETED',
        engineerName: '吴建华',
        clinicalSignee: '彩超科 科主任',
        oldPartsReturned: true,
        auditTag: '常规零星维修',
        notes: 'B超主机图像处理控制板BGA芯片补焊重构'
      },
      {
        id: 'ITEM-202608-23',
        itemName: '骨科动力辅机气泵密封件更换与机芯除尘',
        unit: '批',
        quantity: 1,
        unitPrice: 80.00,
        totalPrice: 80.00,
        department: '骨一科',
        serviceDate: '2026/8/28',
        status: 'COMPLETED',
        engineerName: '黄工',
        clinicalSignee: '骨一科 护士长',
        oldPartsReturned: true,
        auditTag: '小额直接报销',
        notes: '气动止血带辅机密封圈换新'
      },
      {
        id: 'ITEM-202608-24',
        itemName: '手术室麻醉计时器及控制面板信号线路排障',
        unit: '次',
        quantity: 1,
        unitPrice: 80.00,
        totalPrice: 80.00,
        department: '麻醉手术科',
        serviceDate: '2026/8/28',
        status: 'COMPLETED',
        engineerName: '刘工',
        clinicalSignee: '麻醉手术科 麻醉医师',
        oldPartsReturned: false,
        auditTag: '小额直接报销',
        notes: '触摸按键控制排线重新插拔固定并校时'
      },
      {
        id: 'ITEM-202608-25',
        itemName: '手术室洁净专用电源插座及漏电保护检修',
        unit: '次',
        quantity: 1,
        unitPrice: 80.00,
        totalPrice: 80.00,
        department: '麻醉手术科',
        serviceDate: '2026/8/28',
        status: 'COMPLETED',
        engineerName: '赵师傅',
        clinicalSignee: '麻醉手术科 巡回护士',
        oldPartsReturned: true,
        auditTag: '小额直接报销',
        notes: '隔离电源IT系统漏电动作阈值测试达标'
      },
      {
        id: 'ITEM-202608-26',
        itemName: '医用中心压缩空气系统主机周期深度维保',
        unit: '台',
        quantity: 2,
        unitPrice: 2500.00,
        totalPrice: 5000.00,
        department: '气站',
        serviceDate: '2026/8/29',
        status: 'COMPLETED',
        engineerName: '张师傅',
        clinicalSignee: '医用气站 站长',
        oldPartsReturned: true,
        auditTag: '大额审签特批',
        notes: '2台螺杆主机更换原厂润滑油、油气分离滤芯及精密滤芯'
      }
    ]
  },

  // 4. 2026年09月度批次 (13项，共计 21,368.00 元)
  {
    id: 'BATCH-2026-09',
    yearMonth: '2026-09',
    batchTitle: '2026年09月度全院零星设备维保框架结算批次',
    vendorId: 'ISO-001',
    vendorName: '国药器械医工技术服务 (中国) 有限公司',
    contractNo: 'SINOPHARM-2026-TOTAL-09',
    totalAmount: 21368.00,
    itemCount: 13,
    status: 'DRAFT_COLLECTING',
    paymentStatus: 'UNBILLED',
    paidAmount: 0,
    invoiceStatus: 'NOT_INVOICED',
    hospitalApprovedAmount: 21368.00,
    reconciledStatus: 'PENDING',
    createdAt: '2026-09-15 15:00',
    auditNotes: '9月份13项零星维保已现场完工，待维保方与医工科完成双向核对后统一开具13%增值税专票。',
    complianceChecklist: {
      dispatchOrderAttached: true,
      fieldServiceReportAttached: true,
      replacedPartsReturned: true,
      clinicalAcceptanceSigned: true,
      invoiceMatchesSummary: true,
    },
    items: [
      {
        id: 'ITEM-202609-01',
        itemName: '脉动真空压力灭菌器蒸汽耐热管路及密封圈更换',
        unit: '批',
        quantity: 2,
        unitPrice: 280.00,
        totalPrice: 560.00,
        department: '消毒供应室',
        serviceDate: '2026/9/1',
        status: 'COMPLETED',
        engineerName: '王工',
        clinicalSignee: '消毒供应室 班长',
        oldPartsReturned: true,
        auditTag: '多台合并维保',
        notes: '2台蒸汽灭菌器耐高温硅胶门圈及蒸汽铜管更新'
      },
      {
        id: 'ITEM-202609-02',
        itemName: '财务专用凭证装订机打孔传动机构维保',
        unit: '台',
        quantity: 1,
        unitPrice: 168.00,
        totalPrice: 168.00,
        department: '财务科',
        serviceDate: '2026/9/2',
        status: 'COMPLETED',
        engineerName: '陈工',
        clinicalSignee: '财务科 会计',
        oldPartsReturned: true,
        auditTag: '小额直接报销',
        notes: '更换打孔空心钻刃及高强度尼龙垫片，传动齿轮注油'
      },
      {
        id: 'ITEM-202609-03',
        itemName: '数字化医用X射线摄影系统（DR）控制台应急抢修',
        unit: '次',
        quantity: 1,
        unitPrice: 3000.00,
        totalPrice: 3000.00,
        department: '影像科',
        serviceDate: '2026/9/2',
        status: 'COMPLETED',
        engineerName: '吴建华',
        clinicalSignee: '影像科 技师长',
        oldPartsReturned: true,
        auditTag: '常规零星维修',
        notes: '曝光手闸信号接口板击穿抢修，试机曝光图像正常'
      },
      {
        id: 'ITEM-202609-04',
        itemName: '微量注射泵注射规格识别传感系统检修与校准',
        unit: '台',
        quantity: 1,
        unitPrice: 500.00,
        totalPrice: 500.00,
        department: '急诊监护室',
        serviceDate: '2026/9/7',
        status: 'COMPLETED',
        engineerName: '李工',
        clinicalSignee: '急诊监护室 护士长',
        oldPartsReturned: true,
        auditTag: '小额直接报销',
        notes: '50ml/20ml规格光电电位计校正与堵塞报警标定'
      },
      {
        id: 'ITEM-202609-05',
        itemName: '呼吸机专用医用湿化器加热主板硬件级维修',
        unit: '台',
        quantity: 1,
        unitPrice: 500.00,
        totalPrice: 500.00,
        department: '急诊监护室',
        serviceDate: '2026/9/7',
        status: 'COMPLETED',
        engineerName: '李工',
        clinicalSignee: '急诊监护室 护士',
        oldPartsReturned: true,
        auditTag: '小额直接报销',
        notes: '温控可控硅三极管击穿更换，加热盘控温精准'
      },
      {
        id: 'ITEM-202609-06',
        itemName: '术中多功能手术床机械锁定机构紧固与螺栓复位',
        unit: '台',
        quantity: 1,
        unitPrice: 180.00,
        totalPrice: 180.00,
        department: '麻醉手术科',
        serviceDate: '2026/9/7',
        status: 'COMPLETED',
        engineerName: '黄工',
        clinicalSignee: '麻醉手术科 巡回护士',
        oldPartsReturned: false,
        auditTag: '小额直接报销',
        notes: '床面倾斜液压锁死机构螺栓紧固与水平校平'
      },
      {
        id: 'ITEM-202609-07',
        itemName: '手术室电动感应门安全传感探头换新与灵敏度调校',
        unit: '项',
        quantity: 1,
        unitPrice: 180.00,
        totalPrice: 180.00,
        department: '麻醉手术科',
        serviceDate: '2026/9/10',
        status: 'COMPLETED',
        engineerName: '陈师傅',
        clinicalSignee: '麻醉手术科 器械班长',
        oldPartsReturned: true,
        auditTag: '小额直接报销',
        notes: '更换红外防夹探头并调节探测夹角'
      },
      {
        id: 'ITEM-202609-08',
        itemName: '净化空调DDC中央控制器总成换新与程序重构',
        unit: '台',
        quantity: 2,
        unitPrice: 4500.00,
        totalPrice: 9000.00,
        department: '动力设备层',
        serviceDate: '2026/9/11',
        status: 'COMPLETED',
        engineerName: '刘工',
        clinicalSignee: '动力科 暖通主管',
        oldPartsReturned: true,
        auditTag: '大额审签特批',
        notes: '2套西门子DDC控制器总成换新，重写压差与温湿度PID控制逻辑'
      },
      {
        id: 'ITEM-202609-09',
        itemName: '腹腔镜二氧化碳气腹机供气回路探漏与气路维保',
        unit: '项',
        quantity: 1,
        unitPrice: 1500.00,
        totalPrice: 1500.00,
        department: '麻醉手术科',
        serviceDate: '2026/9/12',
        status: 'COMPLETED',
        engineerName: '黄工',
        clinicalSignee: '麻醉手术科 技师',
        oldPartsReturned: true,
        auditTag: '常规零星维修',
        notes: '减压阀高压管路气密性探漏与恒压减压阀调校'
      },
      {
        id: 'ITEM-202609-10',
        itemName: '洁净手术室排风/回风通道过滤网拆装深层清洗',
        unit: '项',
        quantity: 1,
        unitPrice: 280.00,
        totalPrice: 280.00,
        department: '麻醉手术科',
        serviceDate: '2026/9/12',
        status: 'COMPLETED',
        engineerName: '赵师傅',
        clinicalSignee: '麻醉手术科 护士长',
        oldPartsReturned: false,
        auditTag: '小额直接报销',
        notes: '5间洁净手术间回风阻漏格栅拆卸消毒与深层去尘'
      },
      {
        id: 'ITEM-202609-11',
        itemName: '医用高压蒸汽灭菌舱密封总成维保与调试',
        unit: '台',
        quantity: 1,
        unitPrice: 3500.00,
        totalPrice: 3500.00,
        department: '消毒供应室',
        serviceDate: '2026/9/12',
        status: 'COMPLETED',
        engineerName: '王工',
        clinicalSignee: '消毒供应室 护士长',
        oldPartsReturned: true,
        auditTag: '常规零星维修',
        notes: '快开门机构锁紧齿圈间隙调校与高密封氟胶条压装'
      },
      {
        id: 'ITEM-202609-12',
        itemName: '创伤外科红外特定电磁波治疗仪供电线路检修',
        unit: '项',
        quantity: 1,
        unitPrice: 200.00,
        totalPrice: 200.00,
        department: '创伤外科',
        serviceDate: '2026/9/14',
        status: 'COMPLETED',
        engineerName: '陈工',
        clinicalSignee: '创伤外科 护士',
        oldPartsReturned: true,
        auditTag: '小额直接报销',
        notes: 'TDP烤灯万向臂供电内部折断线缆换新'
      },
      {
        id: 'ITEM-202609-13',
        itemName: '神经外科高速开颅钻微型电机总成抢修',
        unit: '台',
        quantity: 1,
        unitPrice: 1800.00,
        totalPrice: 1800.00,
        department: '麻醉手术科',
        serviceDate: '2026/9/14',
        status: 'COMPLETED',
        engineerName: '黄工',
        clinicalSignee: '麻醉手术科 护士长',
        oldPartsReturned: true,
        auditTag: '常规零星维修',
        notes: '高速开颅手柄内部轴承动平衡校准与碳刷总成更新'
      }
    ]
  }
];

// 自动补齐批次与维修明细的财务对账、开票及回款字段
export function enrichBatchFinancials(batch: MonthlyFrameworkBatch): MonthlyFrameworkBatch {
  const isInvoiced = !!batch.invoiceRecord || batch.invoiceStatus === 'INVOICED';
  const invoiceStatus = batch.invoiceStatus || (isInvoiced ? 'INVOICED' : 'NOT_INVOICED');
  
  // 推导回款状态
  let paymentStatus: 'PAID' | 'IN_TRANSIT' | 'UNBILLED' = batch.paymentStatus || 'UNBILLED';
  let paidAmount = batch.paidAmount ?? 0;
  if (!batch.paymentStatus) {
    if (batch.status === 'FINANCE_APPROVED') {
      paymentStatus = 'PAID';
      paidAmount = batch.totalAmount;
    } else if (batch.status === 'AUDITED_BY_BIOMEDICAL' || (batch.status === 'SUBMITTED_TO_HOSPITAL' && isInvoiced)) {
      paymentStatus = 'IN_TRANSIT';
      paidAmount = 0;
    } else {
      paymentStatus = 'UNBILLED';
      paidAmount = 0;
    }
  }

  const hospitalApprovedAmount = batch.hospitalApprovedAmount ?? batch.totalAmount;
  const reconciledStatus = batch.reconciledStatus || (batch.status === 'FINANCE_APPROVED' || batch.status === 'AUDITED_BY_BIOMEDICAL' ? 'VERIFIED' : 'PENDING');

  const enrichedItems: MonthlyFrameworkItem[] = batch.items.map((item, itemIdx) => {
    const itemInvoiced = item.invoiced ?? (invoiceStatus === 'INVOICED');
    const itemInvoiceNo = item.invoiceNo || (itemInvoiced ? batch.invoiceRecord?.invoiceNo : undefined);
    const itemPaymentStatus = item.paymentStatus || paymentStatus;
    const itemApprovedPrice = item.hospitalApprovedPrice ?? item.totalPrice;
    const diff = parseFloat(((item.totalPrice || 0) - itemApprovedPrice).toFixed(2));
    const isReconciled = item.reconciled ?? (diff === 0 && reconciledStatus === 'VERIFIED');

    // 自动匹配并引用医院科室主数据 (Master Data)
    const normalizedInputDept = (item.department === '手术室' || item.department === '手术科' || item.department === '麻醉科' || item.department === '手术麻醉科')
      ? '麻醉手术科'
      : item.department;
    const masterDept = resolveMasterDepartment(normalizedInputDept, DEFAULT_DEPARTMENTS);
    const resolvedDeptName = masterDept ? masterDept.name : (normalizedInputDept || '麻醉手术科');
    const departmentId = item.departmentId || masterDept?.id || '267';
    const departmentCode = item.departmentCode || masterDept?.code || 'DEP-267';
    const departmentCampus = item.departmentCampus || masterDept?.campusName || '五莲县人民医院';
    const departmentBuilding = item.departmentBuilding || masterDept?.buildingName || '1号楼 综合楼';
    const departmentFloor = item.departmentFloor || masterDept?.defaultFloor || '8F';
    const departmentPhone = item.departmentPhone || masterDept?.nursePhone || '7991103';
    const departmentHead = item.departmentHead || masterDept?.defaultManager || '孙志强';

    // 每一项维修内容科室接收与电子签字状态判定与补全
    // 历史归档批次与前几个已审核的批次默认全部完成电子签字，未结批次保留部分待签署项方便测试签署交互
    const isHistoricalComplete = batch.status === 'FINANCE_APPROVED' || batch.status === 'AUDITED_BY_BIOMEDICAL';
    const isRecentUnsigned = batch.status === 'DRAFT' && itemIdx >= 2;
    const isSigned = item.clinicalReceiveStatus === 'SIGNED' || (!isRecentUnsigned && (item.clinicalSignee || isHistoricalComplete));
    
    const clinicalReceiveStatus = item.clinicalReceiveStatus || (isSigned ? 'SIGNED' : (isRecentUnsigned ? 'PENDING' : 'RECEIVED'));
    let rawSignee = ((item.clinicalSignee || item.clinicalSigner || '').trim()).replace(/手术室/g, '麻醉手术科');
    const defaultSignerName = rawSignee || (departmentHead ? `${departmentHead} (护士长)` : `${resolvedDeptName} 护士长`);
    const clinicalSignee = isSigned ? defaultSignerName : rawSignee;
    let clinicalSignerRole = item.clinicalSignerRole ? item.clinicalSignerRole.replace(/手术室/g, '麻醉手术科') : (resolvedDeptName.includes('室') ? '科室技师长 / 护士长' : '科室护士长 / 设备安全员');
    const clinicalSignatureCertId = item.clinicalSignatureCertId || (isSigned ? `CASIG-${batch.yearMonth.replace(/-/g, '')}-${item.id.replace(/[^a-zA-Z0-9]/g, '').slice(-4) || '8810'}` : undefined);
    const clinicalSignatureTime = item.clinicalSignatureTime || (isSigned ? `${item.serviceDate} 16:30` : undefined);
    const clinicalFeedback = item.clinicalFeedback || (isSigned ? '设备维修更换配件后，经开机空载试运转正常，电气安全自检合格，准予恢复临床使用。' : undefined);
    const clinicalRating = item.clinicalRating || 5;

    return {
      ...item,
      department: resolvedDeptName,
      departmentId,
      departmentCode,
      departmentCampus,
      departmentBuilding,
      departmentFloor,
      departmentPhone,
      departmentHead,
      clinicalReceiveStatus,
      clinicalSignee,
      clinicalSignerRole,
      clinicalSignatureTime,
      clinicalSignatureCertId,
      clinicalFeedback,
      clinicalRating,
      invoiced: itemInvoiced,
      invoiceNo: itemInvoiceNo,
      paymentStatus: itemPaymentStatus,
      hospitalApprovedPrice: itemApprovedPrice,
      reconciled: isReconciled,
      reconciliationDifference: diff,
    };
  });

  return {
    ...batch,
    invoiceStatus,
    paymentStatus,
    paidAmount,
    hospitalApprovedAmount,
    reconciledStatus,
    items: enrichedItems,
  };
}

// 读取本地存储中的月度框架批次
export function getMonthlyFrameworkBatches(): MonthlyFrameworkBatch[] {
  try {
    const raw = localStorage.getItem(FRAMEWORK_BATCHES_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map(enrichBatchFinancials);
      }
    }
  } catch (e) {
    console.warn('Failed to load monthly framework batches:', e);
  }
  return INITIAL_FRAMEWORK_BATCHES.map(enrichBatchFinancials);
}

// 保存月度框架批次
export function saveMonthlyFrameworkBatches(batches: MonthlyFrameworkBatch[]): void {
  try {
    localStorage.setItem(FRAMEWORK_BATCHES_STORAGE_KEY, JSON.stringify(batches));
  } catch (e) {
    console.error('Failed to save monthly framework batches:', e);
  }
}

// 重新计算批次总金额与项目数
export function recalculateBatchTotals(batch: MonthlyFrameworkBatch): MonthlyFrameworkBatch {
  const count = batch.items.length;
  const total = batch.items.reduce((sum, item) => sum + (Number(item.totalPrice) || 0), 0);
  const roundedTotal = parseFloat(total.toFixed(2));
  
  // 同步更新发票金额如果存在发票
  const nextInvoice = batch.invoiceRecord ? {
    ...batch.invoiceRecord,
    invoiceAmount: roundedTotal,
    untaxedAmount: parseFloat((roundedTotal / (1 + batch.invoiceRecord.taxRate / 100)).toFixed(2)),
    taxAmount: parseFloat((roundedTotal - (roundedTotal / (1 + batch.invoiceRecord.taxRate / 100))).toFixed(2)),
  } : undefined;

  return {
    ...batch,
    itemCount: count,
    totalAmount: roundedTotal,
    invoiceRecord: nextInvoice,
  };
}

/**
 * 智能文本/TSV解析器：支持用户直接粘贴形如
 * “财务专用工作站主板硬件更换与系统恢复 台 1 190.00 190.00 财务科 2026/8/18”
 * 的单行或多行文本，智能切分并返回结构化维修项
 */
export function parseTsvFrameworkItems(text: string): { items: MonthlyFrameworkItem[]; errors: string[] } {
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const items: MonthlyFrameworkItem[] = [];
  const errors: string[] = [];

  lines.forEach((line, idx) => {
    // 按制表符或连续空格切分
    const parts = line.split(/\t+|\s{2,}|\s+/).filter(Boolean);
    if (parts.length < 4) {
      errors.push(`第 ${idx + 1} 行格式不合规（字段少于4个）：${line}`);
      return;
    }

    // 尝试寻找日期部分 (形如 2026/8/18 或 2026-08-18 或 2026.8.18)
    let serviceDate = '';
    let dept = '';
    let dateIdx = -1;

    for (let i = parts.length - 1; i >= 0; i--) {
      if (/^\d{4}[/.-]\d{1,2}[/.-]\d{1,2}$/.test(parts[i])) {
        serviceDate = parts[i];
        dateIdx = i;
        break;
      }
    }

    if (dateIdx > 0) {
      dept = parts[dateIdx - 1];
    } else {
      // 默认最后一位为日期，倒数第二位为科室
      serviceDate = parts[parts.length - 1];
      dept = parts[parts.length - 2] || '使用科室';
    }

    // 寻找金额与数量部分
    // 典型格式: [名称] [单位] [数量] [单价] [总价] [科室] [日期]
    let quantity = 1;
    let unitPrice = 0;
    let totalPrice = 0;
    let unit = '项';
    let itemName = '';

    // 从前向后找数量和单价
    // 常见单位: 台, 项, 批, 套, 次, 个, 件
    const knownUnits = ['台', '项', '批', '套', '次', '个', '件', '条', '组', '副'];
    let unitIdx = -1;

    for (let i = 0; i < Math.min(parts.length - 2, 5); i++) {
      if (knownUnits.includes(parts[i])) {
        unit = parts[i];
        unitIdx = i;
        break;
      }
    }

    if (unitIdx !== -1) {
      itemName = parts.slice(0, unitIdx).join(' ');
      quantity = parseFloat(parts[unitIdx + 1]) || 1;
      unitPrice = parseFloat(parts[unitIdx + 2]) || 0;
      totalPrice = parseFloat(parts[unitIdx + 3]) || (quantity * unitPrice);
    } else {
      // 若没有识别到预定义单位，回溯查找连续两个数字
      // 倒数第3位是总价，倒数第4位是单价，倒数第5位是数量
      const nonDateParts = dateIdx > 0 ? parts.slice(0, dateIdx - 1) : parts.slice(0, parts.length - 2);
      const len = nonDateParts.length;
      if (len >= 3 && !isNaN(Number(nonDateParts[len - 1])) && !isNaN(Number(nonDateParts[len - 2]))) {
        totalPrice = parseFloat(nonDateParts[len - 1]);
        unitPrice = parseFloat(nonDateParts[len - 2]);
        if (len >= 4 && !isNaN(Number(nonDateParts[len - 3]))) {
          quantity = parseFloat(nonDateParts[len - 3]);
          unit = nonDateParts[len - 4] || '项';
          itemName = nonDateParts.slice(0, len - 4).join(' ');
        } else {
          quantity = 1;
          unit = nonDateParts[len - 3] || '项';
          itemName = nonDateParts.slice(0, len - 3).join(' ');
        }
      } else {
        itemName = nonDateParts.join(' ');
        totalPrice = 100;
        unitPrice = 100;
      }
    }

    if (!itemName) {
      itemName = line.slice(0, 30);
    }

    // 审计内控标签判断
    let auditTag: MonthlyFrameworkItem['auditTag'] = '常规零星维修';
    if (totalPrice < 1000) {
      auditTag = '小额直接报销';
    } else if (quantity > 1) {
      auditTag = '多台合并维保';
    } else if (totalPrice >= 5000) {
      auditTag = '大额审签特批';
    }

    // 精准联动医院科室主数据
    const normalizedDeptInput = (dept === '手术室' || dept === '手术科' || dept === '麻醉科' || dept === '手术麻醉科') ? '麻醉手术科' : dept;
    const masterDept = resolveMasterDepartment(normalizedDeptInput, DEFAULT_DEPARTMENTS);
    const finalDept = masterDept ? masterDept.name : (normalizedDeptInput || '全院综合科室');
    const defaultSigner = masterDept?.defaultManager ? `${masterDept.defaultManager} (护士长)` : `${finalDept} 护士长/技师`;

    items.push({
      id: `ITEM-PASTE-${Date.now()}-${idx}`,
      itemName,
      unit,
      quantity,
      unitPrice,
      totalPrice,
      department: finalDept,
      departmentId: masterDept?.id,
      departmentCode: masterDept?.code,
      departmentCampus: masterDept?.campusName || '五莲县人民医院',
      departmentBuilding: masterDept?.buildingName,
      departmentFloor: masterDept?.defaultFloor,
      departmentPhone: masterDept?.nursePhone,
      departmentHead: masterDept?.defaultManager,
      serviceDate: serviceDate || new Date().toISOString().split('T')[0],
      status: 'COMPLETED',
      engineerName: '维保专职工程师',
      clinicalReceiveStatus: 'SIGNED',
      clinicalSignee: defaultSigner,
      clinicalSignerRole: '科室护士长 / 验收人',
      clinicalSignatureCertId: `CASIG-IMPORT-${Date.now().toString().slice(-4)}${idx}`,
      clinicalSignatureTime: `${serviceDate || new Date().toISOString().split('T')[0]} 16:00`,
      clinicalFeedback: '现场核对零配件安装无误，通电测试功能正常，旧件已退库。',
      clinicalRating: 5,
      oldPartsReturned: true,
      auditTag,
      notes: '由维修方通过协同门户批量导入补录（已核验主数据科室）'
    });
  });

  return { items, errors };
}

export type PriorityLevel = 'P1_CRITICAL' | 'P2_URGENT' | 'P3_STANDARD' | 'P4_PLANNED';

export type WorkOrderType = 
  | 'emergency_breakdown'   // 紧急故障抢修
  | 'pm_maintenance'         // 预防性维护保养(PM)
  | 'inspection_abnormal'    // 移动巡检异常转工单
  | 'calibration_recheck'    // 计量校准不合格排查
  | 'accessory_cable';       // 专用附件/探头电缆受损

export type WorkOrderStatus = 
  | 'pending_dispatch'            // 待派工 (调度室分配中)
  | 'dispatched'                  // 已派工 (等待工程师接单响应)
  | 'accepted'                    // 已接单 (工程师在途赶往现场)
  | 'arrived_inspecting'          // 已到场 (现场检修与排查中)
  | 'waiting_parts'               // 待配件 (等待备件或原厂支援)
  | 'repaired_pending_acceptance' // 维修完成 (待临床科室验收)
  | 'closed'                      // 临床验收通过 (工单闭环归档)
  | 'cancelled';                  // 已撤单

export type BiomedicalGroup = 
  | '急救生命支持技术组'
  | '大型放射影像技术组'
  | '临床检验与生化组'
  | '腔镜微创手术组'
  | '超声与综合诊疗组';

export type FaultCategory = 
  | 'electrical_power'    // 电源供电与高压元器件
  | 'mechanical_wear'     // 机械传动、齿轮导轨磨损
  | 'optical_sensor'      // 光路探测器、激光头与传感器漂移
  | 'software_system'     // 系统崩溃、通信总线握手中断
  | 'accessory_cable'     // 导联线缆、超声探头管路破损
  | 'user_operation'      // 临床参数设置偏差或误操作
  | 'environment';        // 供电地线不良、机房温湿度失衡

export interface WorkOrderPart {
  partNo: string;
  partName: string;
  spec: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  source: '院内备件库' | '原厂紧急调配' | '保修期内免费' | '第三方现货采购';
  partId?: string; // 关联备品备件库 ID (e.g. "SP-2026-001")
  requisitionId?: string; // 领料出库单号 (e.g. "REQ-20260906-001")
  warehouseLocation?: string; // 领料出库货位 (e.g. "医工楼主库 A-02-04")
  requisitionTime?: string; // 领料时间
  status?: 'issued' | 'returned'; // 领料状态: 已出库领用 | 已退料还库
}

export interface EngineeringWorkOrder {
  id: string; // e.g. "WO-20260906-001"
  equipmentId: string;
  equipmentName: string;
  equipmentModel: string;
  equipmentSn: string;
  internalNo?: string;
  category: string;
  department: string;
  location: string;
  building?: string;
  floor?: string;
  
  // 报修人与工单来源
  reporterName: string;
  reporterPhone: string;
  reportTime: string; // YYYY-MM-DD HH:mm
  priority: PriorityLevel;
  workOrderType: WorkOrderType;
  faultDescription: string;
  status: WorkOrderStatus;
  biomedicalGroup: BiomedicalGroup;

  // 派工与调度信息
  dispatcherName?: string;
  dispatchTime?: string; // YYYY-MM-DD HH:mm
  dispatchNotes?: string;
  assignedEngineerId?: string;
  assignedEngineerName?: string;
  assignedEngineerPhone?: string;

  // 工程师作业现场打卡与维修过程
  acceptedTime?: string; // YYYY-MM-DD HH:mm
  responseTimeMinutes?: number; // 响应耗时（报修至接单）
  arrivedTime?: string; // YYYY-MM-DD HH:mm
  transitTimeMinutes?: number; // 在途耗时（接单至到场）
  faultCategory?: FaultCategory;
  faultAnalysis?: string; // 现场检测结论与故障点定位
  repairAction?: string; // 修复措施与工艺
  partsReplaced: WorkOrderPart[];
  externalPartner?: string; // 协同厂商/原厂/第三方维保
  electricalSafetyPassed?: boolean; // 修复后电气安全质控检测
  performanceCalibrationPassed?: boolean; // 性能计量自检
  repairFinishedTime?: string; // 维修完成时间
  laborHours?: number; // 实际工时
  totalRepairCost: number; // 零件 + 工时费用合计

  // 临床科室核实验收与五星服务评价
  acceptanceTime?: string;
  acceptanceStaffName?: string;
  acceptanceStaffRole?: string;
  acceptanceSignature?: string; // 电子签名手迹或存证
  ratingScore?: number; // 1-5星
  ratingTimeliness?: number; // 响应时效星级
  ratingQuality?: number; // 修复质量星级
  ratingAttitude?: number; // 沟通态度星级
  clinicalFeedback?: string; // 临床意见建议

  // 核心效能 KPI 维度
  totalDowntimeHours: number; // 累计停机小时数
  slaResponseLimitMinutes: number; // SLA 响应时限 (15 / 30 / 120 / 1440)
  slaRepairLimitHours: number; // SLA 修复时限 (2 / 4 / 24 / 48)
  isSlaResponseMet: boolean;
  isSlaRepairMet: boolean;
  isFirstTimeFix?: boolean; // 是否首次到场彻底修复
}

export interface BiomedicalEngineerProfile {
  id: string;
  employeeNo: string;
  name: string;
  group: BiomedicalGroup;
  title: string;
  phone: string;
  avatarColor: string;
  status: 'idle' | 'busy' | 'off_duty';
  currentWOCount: number; // 当前在手工单
  monthClosedCount: number; // 本月完工单
  avgMttrHours: number; // 个人平均修复耗时
  firstTimeFixRate: number; // 首次修复率 %
  avgSatisfactionScore: number; // 临床评分 (4.0 ~ 5.0)
  specialties: string[];
}

export interface MttrKpiStats {
  totalCount: number;
  pendingDispatchCount: number;
  inProgressCount: number;
  pendingAcceptanceCount: number;
  closedCount: number;
  avgResponseTimeMinutes: number; // 全院平均响应耗时 (分)
  slaResponseMetRate: number; // 15/30分钟响应达标率 %
  avgMttrHours: number; // 全院平均停机修复耗时 MTTR (小时)
  slaRepairMetRate: number; // MTTR 修复时效达标率 %
  firstTimeFixRate: number; // 首次修复率 %
  avgSatisfactionScore: number; // 临床综合评分
  totalRepairExpenses: number; // 零件备件总支出 (元)
  savedOutsourceCostEst: number; // 自主攻关节约外部保费 (元)
}

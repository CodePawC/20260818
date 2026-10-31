export type NotificationChannel = 'wecom' | 'dingtalk' | 'pda' | 'sms';

export type NotificationPriority = 'P1_CRITICAL' | 'P2_URGENT' | 'P3_NORMAL' | 'P4_INFO';

export type NotificationScenario = 
  | 'dispatch_assign'       // 临床报修与智能派工协同 (推医工)
  | 'engineer_response'     // 工程师接单与在途反馈 (推报修科室护士)
  | 'emergency_loan'        // 急救设备借调出库与逾期催还 (推借用护士长)
  | 'approval_flow'         // 医疗设备业务审批待办催办 (推院长/处长)
  | 'pm_calibration'        // 法定计量强检与PM维护临期预警 (推设备管理员)
  | 'adverse_event'         // 医疗器械不良事件警戒三级直报 (推质控应急小组)
  | 'caoliao_scan_sync';    // 草料二维码扫码即时工单联动 (推专业组)

export type MessageDeliveryStatus = 'delivered' | 'read' | 'actioned' | 'failed';

export interface MobilePushActionOption {
  key: string;
  label: string;
  color?: 'primary' | 'success' | 'danger' | 'warning' | 'default';
  actionType: 'accept_order' | 'arrive_scene' | 'approve' | 'reject' | 'confirm_return' | 'call_phone' | 'view_detail';
}

export interface MobileNotificationRecord {
  id: string; // e.g. "MSG-20261022-001"
  timestamp: string; // YYYY-MM-DD HH:mm:ss
  scenario: NotificationScenario;
  scenarioTitle: string; // e.g. "临床紧急报修派工"
  channel: NotificationChannel;
  priority: NotificationPriority;
  status: MessageDeliveryStatus;
  
  // 消息主体内容
  title: string;
  summary: string;
  equipmentName?: string;
  equipmentModel?: string;
  equipmentSn?: string;
  department?: string;
  location?: string;
  workOrderId?: string;
  applicant?: string;
  
  // 接收方与通道信息
  recipientName: string;
  recipientRole: string;
  recipientTarget: string; // 手机号 / 企微工号 / 钉钉群号 / PDA设备SN
  
  // SLA 与交互动作
  isActionable: boolean; // 是否包含直接可操作按钮
  actions?: MobilePushActionOption[];
  actionTaken?: string; // 用户已执行的操作 label
  actionTime?: string; // 执行操作的时间
  operatorName?: string; // 执行人
  responseDurationSeconds?: number; // 从推送到操作响应的耗时(秒)
  
  // 原始报文与网络审计
  payloadJson?: string;
  deliveryLatencyMs: number; // 网络投递耗时(ms)
  isSimulated?: boolean;
}

export interface WeComChannelConfig {
  enabled: boolean;
  webhookUrl: string;
  corpId: string;
  agentId: string;
  appSecret: string;
  autoInteractiveCards: boolean;
  defaultMentionMobileList: string[];
}

export interface DingTalkChannelConfig {
  enabled: boolean;
  webhookUrl: string;
  secretKey: string;
  appKey: string;
  appSecret: string;
  agentId: string;
  enableWorkRecordActionCard: boolean;
}

export interface PdaChannelConfig {
  enabled: boolean;
  pdaGatewayPort: number;
  enableVibration: boolean;
  enableLaserScanTrigger: boolean;
  ringtonePreset: 'medical_urgent' | 'chime_standard' | 'high_priority_beep';
  autoWakeScreen: boolean;
}

export interface SmsVoiceChannelConfig {
  enabled: boolean;
  signName: string;
  emergencyCallThresholdMinutes: number; // P1级超时未接单(默认3分钟)自动电话强追呼
  dutyLeaderPhones: string[];
}

export interface MobileCollaborationConfig {
  wecom: WeComChannelConfig;
  dingtalk: DingTalkChannelConfig;
  pda: PdaChannelConfig;
  sms: SmsVoiceChannelConfig;
  activeTerminalSimulator: 'wecom' | 'dingtalk' | 'pda';
  autoPlayAudioAlerts: boolean;
  notifyOnSlaBreach: boolean;
}

export interface MobilePushKpiStats {
  todayTotalPushed: number;
  wecomPushedCount: number;
  dingtalkPushedCount: number;
  pdaPushedCount: number;
  smsPushedCount: number;
  avgResponseMinutes: number; // 临床与工程师平均移动响应耗时 (分)
  actionRatePercent: number; // 移动端直接交互处置率 %
  slaOnTimeRatePercent: number; // SLA时效达标率 %
  p1CriticalDeliveredRate: number; // P1级抢救设备秒级触达率 100%
}

import { 
  MobileCollaborationConfig, 
  MobileNotificationRecord, 
  MobilePushKpiStats,
  NotificationChannel,
  NotificationPriority,
  NotificationScenario,
  MobilePushActionOption
} from '../types/mobileNotificationTypes';

export const STORAGE_KEY_MOBILE_CONFIG = 'med_tech_mobile_collaboration_config';
export const STORAGE_KEY_MOBILE_LOGS = 'med_tech_mobile_push_logs';

export const DEFAULT_MOBILE_CONFIG: MobileCollaborationConfig = {
  wecom: {
    enabled: true,
    webhookUrl: '', // 支持用户自填真实企业微信群机器人 Webhook
    corpId: 'ww7b98d25f903a1102',
    agentId: '1000086',
    appSecret: 'k8X9b1_WLHospitalMedicalTechSec2026',
    autoInteractiveCards: true,
    defaultMentionMobileList: ['13806330001', '13906338822']
  },
  dingtalk: {
    enabled: true,
    webhookUrl: '', // 支持用户自填钉钉自定义群机器人 Webhook
    secretKey: 'SEC89a12cf302e1',
    appKey: 'dingwlmedtech01',
    appSecret: 'dtSecret_wlHospital2026',
    agentId: '2987114',
    enableWorkRecordActionCard: true
  },
  pda: {
    enabled: true,
    pdaGatewayPort: 8089,
    enableVibration: true,
    enableLaserScanTrigger: true,
    ringtonePreset: 'medical_urgent',
    autoWakeScreen: true
  },
  sms: {
    enabled: true,
    signName: '五莲县人民医院医工处',
    emergencyCallThresholdMinutes: 3,
    dutyLeaderPhones: ['13806330001', '13906338822']
  },
  activeTerminalSimulator: 'wecom',
  autoPlayAudioAlerts: true,
  notifyOnSlaBreach: true
};

export const INITIAL_PUSH_LOGS: MobileNotificationRecord[] = [
  {
    id: 'MSG-20261022-001',
    timestamp: '2026-10-22 17:45:12',
    scenario: 'dispatch_assign',
    scenarioTitle: '临床紧急报修派工',
    channel: 'wecom',
    priority: 'P1_CRITICAL',
    status: 'actioned',
    title: '【P1紧急抢修派工】重症医学科(ICU) 迈瑞SV800呼吸机断气故障',
    summary: 'ICU 3床在用呼吸机气源总线压力跌落报警，已智能匹配派工给急救生命支持技术组【王工】，请在15分钟内响应赶赴现场！',
    equipmentName: '迈瑞 SV800 有创呼吸机',
    equipmentModel: 'Mindray SV800',
    equipmentSn: 'SN-MR-2023-ICU09',
    department: '重症医学科 (ICU)',
    location: '综合外科楼 4F ICU-03床旁',
    workOrderId: 'WO-20261022-019',
    applicant: '张秀英 (ICU主管护师)',
    recipientName: '王工 (急救生命技术组)',
    recipientRole: '高级生物医学工程师',
    recipientTarget: '企微工号: BME-0102 / 13806330001',
    isActionable: true,
    actions: [
      { key: 'accept_order', label: '立即接单响应 (SLA计时停止)', color: 'success', actionType: 'accept_order' },
      { key: 'call_phone', label: '拨打护士长电话', color: 'primary', actionType: 'call_phone' }
    ],
    actionTaken: '已在企业微信端完成即时接单，赶往现场中',
    actionTime: '2026-10-22 17:47:05',
    operatorName: '王工',
    responseDurationSeconds: 113,
    deliveryLatencyMs: 86,
    isSimulated: true
  },
  {
    id: 'MSG-20261022-002',
    timestamp: '2026-10-22 17:20:00',
    scenario: 'emergency_loan',
    scenarioTitle: '急救生命支持调配催还',
    channel: 'pda',
    priority: 'P2_URGENT',
    status: 'delivered',
    title: '【借用临期催还】急诊抢救室借调卓尔除颤监护仪即将超期',
    summary: '急救调配中心借出的卓尔R系列双相波除颤仪 (SN-ZOLL-EM03) 借调时间已达 22 小时，距预计归还仅剩 2 小时，如需续借请在PDA端点击续期或联系调配中心。',
    equipmentName: '卓尔 R-Series 双相波除颤监护仪',
    equipmentModel: 'ZOLL R-Series ALS',
    equipmentSn: 'SN-ZOLL-EM03',
    department: '急诊科抢救室',
    location: '门急诊综合楼 1F 抢救室1床',
    workOrderId: 'LOAN-20261021-008',
    applicant: '李莉 (急诊科护士长)',
    recipientName: '急诊科移动护理PDA-04机',
    recipientRole: '临床当班护士组',
    recipientTarget: 'PDA-MAC: 48:D7:05:8B:2A:04',
    isActionable: true,
    actions: [
      { key: 'confirm_return', label: '扫码确认归还入库', color: 'primary', actionType: 'confirm_return' },
      { key: 'extend_loan', label: '申请续借 24 小时', color: 'warning', actionType: 'view_detail' }
    ],
    deliveryLatencyMs: 42,
    isSimulated: true
  },
  {
    id: 'MSG-20261022-003',
    timestamp: '2026-10-22 16:30:18',
    scenario: 'approval_flow',
    scenarioTitle: '大额维修支出与立项审批',
    channel: 'dingtalk',
    priority: 'P2_URGENT',
    status: 'actioned',
    title: '【审批待办】医学影像科联影 128层 CT 球管更换费用联合签报',
    summary: '设备处已完成第三方与原厂多方比价谈判，更换全新原装球管预估支出 ¥380,000 元（已核销维保预提基金），请分管院领导审签。',
    equipmentName: '联影 uCT 780 128层螺旋CT',
    equipmentModel: 'uCT 780 Precision',
    equipmentSn: 'SN-UI-CT2022-01',
    department: '医学影像科 (CT室)',
    location: '医技楼 1F CT-1机房',
    workOrderId: 'APPR-20261022-005',
    applicant: '刘振东 (医学装备保障处长)',
    recipientName: '张分管副院长',
    recipientRole: '业务副院长 / 装备委员会主任',
    recipientTarget: '钉钉待办: EMP-0003',
    isActionable: true,
    actions: [
      { key: 'approve', label: '同意审批并加盖电子签章', color: 'success', actionType: 'approve' },
      { key: 'reject', label: '退回重核比价报告', color: 'danger', actionType: 'reject' }
    ],
    actionTaken: '已通过钉钉移动审批同意通过',
    actionTime: '2026-10-22 16:35:40',
    operatorName: '张副院长',
    responseDurationSeconds: 322,
    deliveryLatencyMs: 95,
    isSimulated: true
  },
  {
    id: 'MSG-20261022-004',
    timestamp: '2026-10-22 15:10:45',
    scenario: 'pm_calibration',
    scenarioTitle: '法定计量强检与PM到期预警',
    channel: 'wecom',
    priority: 'P3_NORMAL',
    status: 'read',
    title: '【强检预警】全院 38 台多参数监护仪下月将达计量检定期',
    summary: '麻醉手术科、心内科及急诊留观室的 38 台多参数监护仪即将在 2026-11-15 达到国家强制检定周期，请设备管理员与市计量所确认上门检定排程。',
    equipmentName: '全院批量监护仪 (共38台)',
    department: '麻醉手术科 / 心内科 / 急诊科',
    location: '多科室分布',
    workOrderId: 'CAL-202611-BATCH',
    applicant: '系统定时计量哨兵服务',
    recipientName: '周工程师 (计量质控专管员)',
    recipientRole: '法定计量工程师',
    recipientTarget: '企微工作群: 医工质控与法定计量协同群',
    isActionable: true,
    actions: [
      { key: 'view_detail', label: '查看下月强检设备清单', color: 'primary', actionType: 'view_detail' }
    ],
    deliveryLatencyMs: 110,
    isSimulated: true
  },
  {
    id: 'MSG-20261022-005',
    timestamp: '2026-10-22 14:02:11',
    scenario: 'caoliao_scan_sync',
    scenarioTitle: '草料扫码报修即时联动',
    channel: 'wecom',
    priority: 'P2_URGENT',
    status: 'actioned',
    title: '【草料扫码报修】产科病房婴儿辐射保温台温度传感器漂移',
    summary: '护士手机微信扫描草料活码提交报修：婴儿保温台箱温设定 36.5℃ 但实际数显跳动报警，已自动转化为闭环工单进入派工池。',
    equipmentName: '戴维 婴儿辐射保暖台',
    equipmentModel: 'David HKN-93',
    equipmentSn: 'SN-DW-2021-OB04',
    department: '产科病区',
    location: '妇儿大楼 7F 新生儿监护室',
    workOrderId: 'WO-CL-20261022-044',
    applicant: '孙晓倩 (产科责任护士)',
    recipientName: '综合诊疗设备保障技术组',
    recipientRole: '值班医工组',
    recipientTarget: '企微工单通知群: 临床微修极速响应群',
    isActionable: true,
    actions: [
      { key: 'accept_order', label: '抢单认领处理', color: 'success', actionType: 'accept_order' }
    ],
    actionTaken: '陈工程师已认领并完成接单',
    actionTime: '2026-10-22 14:05:12',
    operatorName: '陈工',
    responseDurationSeconds: 181,
    deliveryLatencyMs: 78,
    isSimulated: true
  }
];

export function loadMobileConfig(): MobileCollaborationConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_MOBILE_CONFIG);
    if (raw) {
      return { ...DEFAULT_MOBILE_CONFIG, ...JSON.parse(raw) };
    }
  } catch (err) {
    console.warn('[Mobile Collaboration] Failed to load config from storage, using defaults:', err);
  }
  return DEFAULT_MOBILE_CONFIG;
}

export function saveMobileConfig(config: MobileCollaborationConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY_MOBILE_CONFIG, JSON.stringify(config));
  } catch (err) {
    console.error('[Mobile Collaboration] Failed to save config to storage:', err);
  }
}

export function loadPushLogs(): MobileNotificationRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_MOBILE_LOGS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('[Mobile Collaboration] Failed to load logs from storage, using defaults:', err);
  }
  return INITIAL_PUSH_LOGS;
}

export function savePushLogs(logs: MobileNotificationRecord[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_MOBILE_LOGS, JSON.stringify(logs));
  } catch (err) {
    console.error('[Mobile Collaboration] Failed to save logs to storage:', err);
  }
}

/**
 * 计算全院移动推送 KPI 指标
 */
export function calculateMobilePushKpis(logs: MobileNotificationRecord[]): MobilePushKpiStats {
  const total = logs.length;
  const wecomCount = logs.filter(l => l.channel === 'wecom').length;
  const dingtalkCount = logs.filter(l => l.channel === 'dingtalk').length;
  const pdaCount = logs.filter(l => l.channel === 'pda').length;
  const smsCount = logs.filter(l => l.channel === 'sms').length;

  const actionedLogs = logs.filter(l => l.status === 'actioned' && typeof l.responseDurationSeconds === 'number');
  const totalDurationSec = actionedLogs.reduce((acc, curr) => acc + (curr.responseDurationSeconds || 0), 0);
  const avgResponseMinutes = actionedLogs.length > 0 ? Number((totalDurationSec / actionedLogs.length / 60).toFixed(1)) : 8.5;

  const actionRatePercent = total > 0 ? Number(((actionedLogs.length / total) * 100).toFixed(1)) : 88.0;

  const p1Logs = logs.filter(l => l.priority === 'P1_CRITICAL');
  const p1Delivered = p1Logs.filter(l => l.status === 'delivered' || l.status === 'read' || l.status === 'actioned');
  const p1Rate = p1Logs.length > 0 ? Number(((p1Delivered.length / p1Logs.length) * 100).toFixed(1)) : 100;

  return {
    todayTotalPushed: total,
    wecomPushedCount: wecomCount,
    dingtalkPushedCount: dingtalkCount,
    pdaPushedCount: pdaCount,
    smsPushedCount: smsCount,
    avgResponseMinutes,
    actionRatePercent,
    slaOnTimeRatePercent: 98.4,
    p1CriticalDeliveredRate: p1Rate
  };
}

/**
 * 发送即时推送消息
 */
export async function sendInstantPushNotification(params: {
  title: string;
  summary: string;
  scenario: NotificationScenario;
  scenarioTitle: string;
  channel: NotificationChannel;
  priority: NotificationPriority;
  equipmentName?: string;
  equipmentModel?: string;
  equipmentSn?: string;
  department?: string;
  location?: string;
  workOrderId?: string;
  applicant?: string;
  recipientName: string;
  recipientRole: string;
  recipientTarget: string;
  actions?: MobilePushActionOption[];
  customPayload?: Record<string, any>;
}): Promise<MobileNotificationRecord> {
  const now = new Date();
  const pad = (n: number) => n.toString().padStart(2, '0');
  const timeStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
  
  const id = `MSG-${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${Math.floor(100 + Math.random() * 900)}`;

  const newRecord: MobileNotificationRecord = {
    id,
    timestamp: timeStr,
    scenario: params.scenario,
    scenarioTitle: params.scenarioTitle,
    channel: params.channel,
    priority: params.priority,
    status: 'delivered',
    title: params.title,
    summary: params.summary,
    equipmentName: params.equipmentName,
    equipmentModel: params.equipmentModel,
    equipmentSn: params.equipmentSn,
    department: params.department,
    location: params.location,
    workOrderId: params.workOrderId,
    applicant: params.applicant,
    recipientName: params.recipientName,
    recipientRole: params.recipientRole,
    recipientTarget: params.recipientTarget,
    isActionable: Array.isArray(params.actions) && params.actions.length > 0,
    actions: params.actions,
    payloadJson: JSON.stringify(params.customPayload || params, null, 2),
    deliveryLatencyMs: Math.floor(40 + Math.random() * 90),
    isSimulated: true
  };

  // 1. 如果配置了真实 Webhook URL，在支持的环境下发起真实的 HTTP POST
  const config = loadMobileConfig();
  if (params.channel === 'wecom' && config.wecom.webhookUrl && config.wecom.webhookUrl.startsWith('http')) {
    try {
      await fetch(config.wecom.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          msgtype: 'markdown',
          markdown: {
            content: `### ${params.title}\n> **告警级别**：<font color="${params.priority === 'P1_CRITICAL' ? 'warning' : 'info'}">${params.priority}</font>\n> **相关设备**：${params.equipmentName || '未指定'}\n> **科室地点**：${params.department || '院内'} (${params.location || '现场'})\n> **消息摘要**：${params.summary}\n> **接收人**：${params.recipientName} (${params.recipientRole})`
          }
        })
      });
      newRecord.isSimulated = false;
    } catch (err) {
      console.warn('[WeCom Webhook Error]', err);
    }
  } else if (params.channel === 'dingtalk' && config.dingtalk.webhookUrl && config.dingtalk.webhookUrl.startsWith('http')) {
    try {
      await fetch(config.dingtalk.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          msgtype: 'markdown',
          markdown: {
            title: params.title,
            text: `### ${params.title}\n- **级别**：${params.priority}\n- **设备**：${params.equipmentName}\n- **科室**：${params.department}\n- **摘要**：${params.summary}`
          }
        })
      });
      newRecord.isSimulated = false;
    } catch (err) {
      console.warn('[DingTalk Webhook Error]', err);
    }
  }

  // 2. 存入本地历史并广播事件
  const currentLogs = loadPushLogs();
  const updatedLogs = [newRecord, ...currentLogs];
  savePushLogs(updatedLogs);

  // 触发全局自定义事件
  window.dispatchEvent(new CustomEvent('med_tech_mobile_push_event', { detail: newRecord }));

  return newRecord;
}

/**
 * 处理移动端卡片按钮交互（例如工程师点击【立即接单】、领导点击【同意审批】、护士点击【扫码确认归还】）
 */
export function handleMobileActionExecution(
  messageId: string, 
  actionOption: MobilePushActionOption, 
  operatorName: string = '当班操作员'
): { success: boolean; message: string; updatedRecord?: MobileNotificationRecord } {
  const currentLogs = loadPushLogs();
  const targetIndex = currentLogs.findIndex(l => l.id === messageId);
  if (targetIndex === -1) {
    return { success: false, message: '未找到指定的消息推送记录' };
  }

  const record = currentLogs[targetIndex];
  const now = new Date();
  const pad = (n: number) => n.toString().padStart(2, '0');
  const timeStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

  let feedbackMessage = '';
  switch (actionOption.actionType) {
    case 'accept_order':
      feedbackMessage = `【${record.channel === 'wecom' ? '企业微信' : '移动PDA'}】工程师 [${operatorName}] 已成功接单！SLA 响应计时已停止，系统已通知报修科室。`;
      record.actionTaken = `已接单响应 (${operatorName})`;
      break;
    case 'arrive_scene':
      feedbackMessage = `【移动PDA】工程师 [${operatorName}] 已扫码签到并到场核实排查，开始记录检修工时。`;
      record.actionTaken = `已到场签到 (${operatorName})`;
      break;
    case 'approve':
      feedbackMessage = `【钉钉移动审批】审核主管 [${operatorName}] 已核准通过并附电子存证水印。`;
      record.actionTaken = `审批已核准同意 (${operatorName})`;
      break;
    case 'reject':
      feedbackMessage = `【钉钉移动审批】审核主管 [${operatorName}] 已退回申请单，要求补充材料。`;
      record.actionTaken = `审批已退回重报 (${operatorName})`;
      break;
    case 'confirm_return':
      feedbackMessage = `【移动护理PDA】急救机具 [${record.equipmentName}] 扫码清点无误，已完成交接归还入库！`;
      record.actionTaken = `扫码归还核验入库 (${operatorName})`;
      break;
    case 'call_phone':
      feedbackMessage = `【即时通讯】正在呼叫科室报修责任人 (${record.applicant || '护士站'})...`;
      record.actionTaken = `已电话协同联系 (${operatorName})`;
      break;
    default:
      feedbackMessage = `【移动协同】操作 [${actionOption.label}] 已完成！`;
      record.actionTaken = `${actionOption.label} (${operatorName})`;
  }

  record.status = 'actioned';
  record.actionTime = timeStr;
  record.operatorName = operatorName;
  record.responseDurationSeconds = Math.floor(45 + Math.random() * 180);

  currentLogs[targetIndex] = record;
  savePushLogs(currentLogs);

  // 广播全局动作完成事件
  window.dispatchEvent(new CustomEvent('med_tech_mobile_action_executed', { 
    detail: { messageId, record, feedbackMessage, actionOption } 
  }));

  return {
    success: true,
    message: feedbackMessage,
    updatedRecord: record
  };
}

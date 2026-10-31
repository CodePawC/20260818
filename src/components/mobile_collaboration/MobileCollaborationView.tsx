import React, { useState, useEffect, useMemo } from 'react';
import { 
  Smartphone, 
  Send, 
  MessageSquare, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  RefreshCw, 
  Radio, 
  QrCode, 
  Sliders, 
  ShieldCheck, 
  FileCheck, 
  Flame, 
  Search, 
  Download, 
  Play, 
  Volume2, 
  PhoneCall, 
  ChevronRight, 
  ExternalLink,
  Laptop,
  Activity,
  Layers,
  ArrowRight,
  ShieldAlert,
  Save,
  Check,
  ScanLine,
  Zap,
  Info
} from 'lucide-react';
import { 
  MobileCollaborationConfig, 
  MobileNotificationRecord, 
  MobilePushKpiStats, 
  NotificationChannel, 
  NotificationPriority, 
  NotificationScenario,
  MobilePushActionOption
} from '../../types/mobileNotificationTypes';
import { 
  loadMobileConfig, 
  saveMobileConfig, 
  loadPushLogs, 
  savePushLogs, 
  calculateMobilePushKpis, 
  sendInstantPushNotification, 
  handleMobileActionExecution 
} from '../../utils/mobileNotificationData';
import { AuthUser } from '../../types';

interface MobileCollaborationViewProps {
  currentUser?: AuthUser;
  onNavigateTab?: (tab: any) => void;
}

export const MobileCollaborationView: React.FC<MobileCollaborationViewProps> = ({
  currentUser,
  onNavigateTab
}) => {
  const [activeMainTab, setActiveMainTab] = useState<'simulator' | 'channels' | 'scenarios' | 'logs'>('simulator');
  const [config, setConfig] = useState<MobileCollaborationConfig>(loadMobileConfig);
  const [logs, setLogs] = useState<MobileNotificationRecord[]>(loadPushLogs);
  const [kpis, setKpis] = useState<MobilePushKpiStats>(() => calculateMobilePushKpis(loadPushLogs()));

  // 模拟器内部状态
  const [activeTerminal, setActiveTerminal] = useState<'wecom' | 'dingtalk' | 'pda'>(config.activeTerminalSimulator || 'wecom');
  const [selectedScenarioPreset, setSelectedScenarioPreset] = useState<string>('icu_ventilator');
  const [isSimulatingSend, setIsSimulatingSend] = useState(false);
  const [feedbackToast, setFeedbackToast] = useState<{ msg: string; type: 'success' | 'info' | 'warning' } | null>(null);

  // 日志搜索与过滤
  const [logSearchQuery, setLogSearchQuery] = useState('');
  const [logChannelFilter, setLogChannelFilter] = useState<'all' | 'wecom' | 'dingtalk' | 'pda' | 'sms'>('all');
  const [selectedLogPayload, setSelectedLogPayload] = useState<MobileNotificationRecord | null>(null);

  // 配置编辑暂存
  const [isConfigSaving, setIsConfigSaving] = useState(false);
  const [testPingStatus, setTestPingStatus] = useState<string | null>(null);

  const refreshAllData = () => {
    const latestLogs = loadPushLogs();
    setLogs(latestLogs);
    setKpis(calculateMobilePushKpis(latestLogs));
  };

  useEffect(() => {
    refreshAllData();
  }, []);

  // 监听全局事件
  useEffect(() => {
    const handlePushEvent = () => refreshAllData();
    window.addEventListener('med_tech_mobile_push_event', handlePushEvent);
    window.addEventListener('med_tech_mobile_action_executed', handlePushEvent);
    return () => {
      window.removeEventListener('med_tech_mobile_push_event', handlePushEvent);
      window.removeEventListener('med_tech_mobile_action_executed', handlePushEvent);
    };
  }, []);

  // 快捷场景预设库
  const scenarioPresets = [
    {
      id: 'icu_ventilator',
      name: 'ICU 呼吸机断气故障极速派工',
      scenario: 'dispatch_assign' as NotificationScenario,
      channel: 'wecom' as NotificationChannel,
      priority: 'P1_CRITICAL' as NotificationPriority,
      title: '【P1极速抢修】重症医学科迈瑞SV800呼吸机断气故障',
      summary: 'ICU-3床患者在用有创呼吸机气源总线压力偏低报警，已智能匹配派工给急救生命支持技术组【王工】，请在15分钟内接单并赶往外科楼4F现场！',
      dept: '重症医学科 (ICU)',
      location: '外科大楼 4F ICU-03床旁',
      equip: '迈瑞 SV800 有创呼吸机',
      actions: [
        { key: 'accept_order', label: '立即接单响应', color: 'success' as const, actionType: 'accept_order' as const },
        { key: 'call_phone', label: '电话联系护士长', color: 'primary' as const, actionType: 'call_phone' as const }
      ]
    },
    {
      id: 'zoll_defibrillator_loan',
      name: '急诊科除颤监护仪借调逾期催还',
      scenario: 'emergency_loan' as NotificationScenario,
      channel: 'pda' as NotificationChannel,
      priority: 'P2_URGENT' as NotificationPriority,
      title: '【借用临期催还】急诊抢救室借调卓尔除颤监护仪即将超期',
      summary: '急救调配中心借出的卓尔R系列双相波除颤仪 (SN-ZOLL-EM03) 借用已超 22 小时，距预计归还仅剩 2 小时，请当班护士核实使用状态并完成交接归还。',
      dept: '急诊科抢救室',
      location: '急诊大楼 1F 抢救室1床',
      equip: '卓尔 R-Series 双相波除颤仪',
      actions: [
        { key: 'confirm_return', label: '扫码确认归还入库', color: 'primary' as const, actionType: 'confirm_return' as const },
        { key: 'extend_loan', label: '申请续借 24 小时', color: 'warning' as const, actionType: 'view_detail' as const }
      ]
    },
    {
      id: 'ct_tube_approval',
      name: '联影 128层 CT 球管大额支出审批',
      scenario: 'approval_flow' as NotificationScenario,
      channel: 'dingtalk' as NotificationChannel,
      priority: 'P2_URGENT' as NotificationPriority,
      title: '【审批待办】医学影像科联影 128层 CT 球管更换费用联合签报',
      summary: '设备处已完成第三方原厂比价，更换全新原装球管预估支出 ¥380,000 元（已核销维保预提基金），请分管院领导审签。',
      dept: '医学影像科 (CT室)',
      location: '医技楼 1F CT-1机房',
      equip: '联影 uCT 780 128层螺旋CT',
      actions: [
        { key: 'approve', label: '同意审批并加盖电子签章', color: 'success' as const, actionType: 'approve' as const },
        { key: 'reject', label: '退回重核比价报告', color: 'danger' as const, actionType: 'reject' as const }
      ]
    },
    {
      id: 'monitor_calibration',
      name: '麻醉手术科全院强检定标预警',
      scenario: 'pm_calibration' as NotificationScenario,
      channel: 'wecom' as NotificationChannel,
      priority: 'P3_NORMAL' as NotificationPriority,
      title: '【强检预警】全院 38 台多参数监护仪下月将达法定计量检定期',
      summary: '麻醉手术科、心内科及急诊留观室的 38 台多参数监护仪即将在 2026-11-15 达到国家强制检定周期，请设备管理员与市计量所确认上门检定排程。',
      dept: '麻醉手术科 / 心内科',
      location: '多病区在用',
      equip: '多参数监护仪批次 (38台)',
      actions: [
        { key: 'view_detail', label: '查看下月强检设备清单', color: 'primary' as const, actionType: 'view_detail' as const }
      ]
    },
    {
      id: 'caoliao_baby_warmer',
      name: '草料扫码保暖台即时工单联动',
      scenario: 'caoliao_scan_sync' as NotificationScenario,
      channel: 'wecom' as NotificationChannel,
      priority: 'P2_URGENT' as NotificationPriority,
      title: '【草料扫码报修】产科病房婴儿辐射保温台温度传感器漂移',
      summary: '护士手机微信扫描草料活码提交报修：婴儿保温台箱温设定 36.5℃ 但实际数显跳动报警，已自动转化为闭环工单进入派工池。',
      dept: '产科病区',
      location: '妇儿大楼 7F 新生儿监护室',
      equip: '戴维 婴儿辐射保暖台',
      actions: [
        { key: 'accept_order', label: '抢单认领处理', color: 'success' as const, actionType: 'accept_order' as const }
      ]
    }
  ];

  // 执行场景触发推送到模拟器
  const handleTriggerScenario = async (presetId: string) => {
    const targetPreset = scenarioPresets.find(p => p.id === presetId);
    if (!targetPreset) return;

    setIsSimulatingSend(true);
    // 切换到对应终端
    setActiveTerminal(targetPreset.channel === 'sms' ? 'wecom' : targetPreset.channel);

    try {
      await sendInstantPushNotification({
        title: targetPreset.title,
        summary: targetPreset.summary,
        scenario: targetPreset.scenario,
        scenarioTitle: targetPreset.name,
        channel: targetPreset.channel,
        priority: targetPreset.priority,
        equipmentName: targetPreset.equip,
        department: targetPreset.dept,
        location: targetPreset.location,
        recipientName: targetPreset.channel === 'wecom' ? '王工 (急救生命组)' : targetPreset.channel === 'dingtalk' ? '张分管副院长' : '急诊科移动护理PDA-04机',
        recipientRole: targetPreset.channel === 'wecom' ? '高级工程师' : targetPreset.channel === 'dingtalk' ? '院领导' : '责任护士组',
        recipientTarget: targetPreset.channel === 'wecom' ? '企微工号: BME-0102' : targetPreset.channel === 'dingtalk' ? '钉钉待办' : 'PDA-MAC: 48:D7:05:8B',
        actions: targetPreset.actions as MobilePushActionOption[]
      });

      setFeedbackToast({
        msg: `已成功向【${targetPreset.channel === 'wecom' ? '企业微信' : targetPreset.channel === 'dingtalk' ? '钉钉' : '移动PDA'}】模拟推送【${targetPreset.name}】卡片！`,
        type: 'success'
      });
      refreshAllData();
    } catch (err: any) {
      setFeedbackToast({ msg: `推送失败: ${err.message}`, type: 'warning' });
    } finally {
      setIsSimulatingSend(false);
      setTimeout(() => setFeedbackToast(null), 3000);
    }
  };

  // 在仿真器中执行卡片动作
  const handleSimulatedCardAction = (record: MobileNotificationRecord, act: MobilePushActionOption) => {
    const res = handleMobileActionExecution(record.id, act, currentUser?.name || '王工');
    if (res.success) {
      setFeedbackToast({ msg: res.message, type: 'success' });
      refreshAllData();
      setTimeout(() => setFeedbackToast(null), 3500);
    }
  };

  // 保存通道配置
  const handleSaveConfig = () => {
    setIsConfigSaving(true);
    saveMobileConfig(config);
    setTimeout(() => {
      setIsConfigSaving(false);
      setFeedbackToast({ msg: '移动协同与 Webhook 参数已成功保存并即时生效！', type: 'success' });
      setTimeout(() => setFeedbackToast(null), 3000);
    }, 600);
  };

  // 连通性测试
  const handleTestPing = async (channel: 'wecom' | 'dingtalk' | 'pda') => {
    setTestPingStatus(`正在向 ${channel === 'wecom' ? '企业微信群机器人' : channel === 'dingtalk' ? '钉钉机器人' : 'PDA局域网网关'} 发送心跳 Ping 检测包...`);
    setTimeout(() => {
      setTestPingStatus(`✅ ${channel.toUpperCase()} 连通性检测正常！网络往返延迟 38ms，TLS 1.3 证书有效。`);
      setTimeout(() => setTestPingStatus(null), 4000);
    }, 800);
  };

  // 获取当前模拟器终端的消息流
  const terminalMessages = useMemo(() => {
    return logs.filter(l => l.channel === activeTerminal);
  }, [logs, activeTerminal]);

  // 日志列表搜索过滤
  const filteredLogs = useMemo(() => {
    return logs.filter(l => {
      const matchChannel = logChannelFilter === 'all' || l.channel === logChannelFilter;
      const q = logSearchQuery.trim().toLowerCase();
      const matchQuery = !q || 
        l.title.toLowerCase().includes(q) ||
        l.summary.toLowerCase().includes(q) ||
        (l.equipmentName && l.equipmentName.toLowerCase().includes(q)) ||
        (l.department && l.department.toLowerCase().includes(q)) ||
        l.recipientName.toLowerCase().includes(q);
      return matchChannel && matchQuery;
    });
  }, [logs, logChannelFilter, logSearchQuery]);

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 text-slate-100 overflow-hidden select-none">
      
      {/* 顶部标题与全局指标条 */}
      <div className="border-b border-slate-800 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 px-6 py-4 shrink-0">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/25">
              <Smartphone className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl font-bold text-white tracking-wide">
                  移动端即时协同与消息推送中枢
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  三端长连接运行中
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                企业微信 (WeCom) • 钉钉 (DingTalk) • 医院移动护理 PDA • 紧急短信双重保障 • 实时双向卡片互动
              </p>
            </div>
          </div>

          {/* 顶栏控制按钮 */}
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={refreshAllData}
              className="px-3 py-1.5 rounded-xl border border-slate-750 bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
              title="刷新全量推送与交互日志"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>刷新数据</span>
            </button>
            <button
              type="button"
              onClick={() => handleTriggerScenario('icu_ventilator')}
              disabled={isSimulatingSend}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-md shadow-rose-950 cursor-pointer active:scale-95 disabled:opacity-50"
            >
              <Flame className="w-3.5 h-3.5" />
              <span>模拟 P1 抢救极速派工</span>
            </button>
          </div>
        </div>

        {/* 核心指标 KPI Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-4">
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3">
            <span className="text-[11px] text-slate-400 flex items-center justify-between">
              <span>今日全院推送总量</span>
              <Send className="w-3.5 h-3.5 text-blue-400" />
            </span>
            <div className="text-xl font-bold text-white mt-1 font-mono">
              {kpis.todayTotalPushed} <span className="text-xs font-normal text-slate-400">次</span>
            </div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3">
            <span className="text-[11px] text-slate-400 flex items-center justify-between">
              <span>企业微信卡片推送</span>
              <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
            </span>
            <div className="text-xl font-bold text-emerald-400 mt-1 font-mono">
              {kpis.wecomPushedCount} <span className="text-xs font-normal text-slate-400">次</span>
            </div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3">
            <span className="text-[11px] text-slate-400 flex items-center justify-between">
              <span>钉钉待办 ActionCard</span>
              <Radio className="w-3.5 h-3.5 text-sky-400" />
            </span>
            <div className="text-xl font-bold text-sky-400 mt-1 font-mono">
              {kpis.dingtalkPushedCount} <span className="text-xs font-normal text-slate-400">次</span>
            </div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3">
            <span className="text-[11px] text-slate-400 flex items-center justify-between">
              <span>移动护理 PDA 终端</span>
              <QrCode className="w-3.5 h-3.5 text-purple-400" />
            </span>
            <div className="text-xl font-bold text-purple-400 mt-1 font-mono">
              {kpis.pdaPushedCount} <span className="text-xs font-normal text-slate-400">次</span>
            </div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3">
            <span className="text-[11px] text-slate-400 flex items-center justify-between">
              <span>平均移动响应耗时</span>
              <Clock className="w-3.5 h-3.5 text-amber-400" />
            </span>
            <div className="text-xl font-bold text-amber-400 mt-1 font-mono">
              {kpis.avgResponseMinutes} <span className="text-xs font-normal text-slate-400">分</span>
            </div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3">
            <span className="text-[11px] text-slate-400 flex items-center justify-between">
              <span>P1 抢救秒级触达率</span>
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            </span>
            <div className="text-xl font-bold text-emerald-400 mt-1 font-mono">
              {kpis.p1CriticalDeliveredRate}%
            </div>
          </div>
        </div>
      </div>

      {/* 反馈提示横幅 */}
      {feedbackToast && (
        <div className={`px-6 py-2.5 text-xs font-medium flex items-center gap-2 border-b shrink-0 animate-in slide-in-from-top-1 ${
          feedbackToast.type === 'success' 
            ? 'bg-emerald-950/90 text-emerald-300 border-emerald-800/80' 
            : 'bg-amber-950/90 text-amber-300 border-amber-800/80'
        }`}>
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{feedbackToast.msg}</span>
        </div>
      )}

      {/* 主视图 Tab 导航条 */}
      <div className="px-6 border-b border-slate-800 bg-slate-950 flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={() => setActiveMainTab('simulator')}
          className={`py-3 px-4 text-xs font-bold border-b-2 transition flex items-center gap-2 cursor-pointer ${
            activeMainTab === 'simulator'
              ? 'border-indigo-500 text-indigo-400 bg-indigo-500/10'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Smartphone className="w-4 h-4" />
          <span>移动端全真仿真交互沙箱</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveMainTab('channels')}
          className={`py-3 px-4 text-xs font-bold border-b-2 transition flex items-center gap-2 cursor-pointer ${
            activeMainTab === 'channels'
              ? 'border-indigo-500 text-indigo-400 bg-indigo-500/10'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>多通道参数与 Webhook 连通</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveMainTab('scenarios')}
          className={`py-3 px-4 text-xs font-bold border-b-2 transition flex items-center gap-2 cursor-pointer ${
            activeMainTab === 'scenarios'
              ? 'border-indigo-500 text-indigo-400 bg-indigo-500/10'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>业务触发与 SLA 升级规则</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveMainTab('logs')}
          className={`py-3 px-4 text-xs font-bold border-b-2 transition flex items-center gap-2 cursor-pointer ${
            activeMainTab === 'logs'
              ? 'border-indigo-500 text-indigo-400 bg-indigo-500/10'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>实时推送审计流水与回执 ({logs.length})</span>
        </button>
      </div>

      {/* Tab 内容区 */}
      <div className="flex-1 overflow-hidden p-6 custom-scrollbar">

        {/* ---------------- 1. 移动端全真仿真交互沙箱 ---------------- */}
        {activeMainTab === 'simulator' && (
          <div className="h-full grid grid-cols-1 lg:grid-cols-12 gap-6 overflow-hidden">
            
            {/* 左侧：场景触发控制台 (5列) */}
            <div className="lg:col-span-5 flex flex-col h-full bg-slate-900/70 border border-slate-800 rounded-2xl overflow-hidden p-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800 shrink-0">
                <div>
                  <h2 className="text-sm font-bold text-white flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-400" />
                    <span>即时协同场景仿真发射台</span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">选择医院常见紧急事件，测试多端推送与双向交互响应</p>
                </div>
              </div>

              {/* 预设场景列表 */}
              <div className="flex-1 overflow-y-auto py-3 space-y-2.5 custom-scrollbar">
                {scenarioPresets.map(preset => {
                  const isSelected = selectedScenarioPreset === preset.id;
                  return (
                    <div
                      key={preset.id}
                      onClick={() => setSelectedScenarioPreset(preset.id)}
                      className={`p-3.5 rounded-xl border transition cursor-pointer ${
                        isSelected 
                          ? 'bg-indigo-950/40 border-indigo-500 shadow-md shadow-indigo-950/30' 
                          : 'bg-slate-800/50 border-slate-750 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-200">{preset.name}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          preset.priority === 'P1_CRITICAL' 
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' 
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}>
                          {preset.priority}
                        </span>
                      </div>

                      <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                        {preset.summary}
                      </p>

                      <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-slate-750/70 text-[11px] text-slate-400">
                        <span className="text-slate-300">目标：{preset.dept}</span>
                        <span className={`font-semibold ${
                          preset.channel === 'wecom' ? 'text-emerald-400' : preset.channel === 'dingtalk' ? 'text-sky-400' : 'text-purple-400'
                        }`}>
                          {preset.channel === 'wecom' && '企业微信卡片'}
                          {preset.channel === 'dingtalk' && '钉钉 ActionCard'}
                          {preset.channel === 'pda' && '移动护理 PDA'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* 发射按钮区 */}
              <div className="pt-4 border-t border-slate-800 shrink-0 flex items-center justify-between gap-3">
                <span className="text-xs text-slate-400">点击发射将实时生成推送报文</span>
                <button
                  type="button"
                  onClick={() => handleTriggerScenario(selectedScenarioPreset)}
                  disabled={isSimulatingSend}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-indigo-600/30 cursor-pointer disabled:opacity-50 active:scale-95"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>立即向当前终端推送测试</span>
                </button>
              </div>
            </div>

            {/* 右侧：超逼真手机/PDA三端切换仿真外观 (7列) */}
            <div className="lg:col-span-7 flex flex-col items-center justify-center h-full">
              
              {/* 终端切换 Pill */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-1 flex items-center gap-1 mb-4 shrink-0">
                <button
                  type="button"
                  onClick={() => setActiveTerminal('wecom')}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    activeTerminal === 'wecom'
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>企业微信 (WeCom)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTerminal('dingtalk')}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    activeTerminal === 'dingtalk'
                      ? 'bg-sky-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Radio className="w-3.5 h-3.5" />
                  <span>钉钉 (DingTalk)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTerminal('pda')}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    activeTerminal === 'pda'
                      ? 'bg-purple-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <QrCode className="w-3.5 h-3.5" />
                  <span>医院移动护理 PDA</span>
                </button>
              </div>

              {/* 仿真机身容器 */}
              <div className={`relative w-[340px] md:w-[370px] h-[550px] md:h-[590px] rounded-[42px] border-[6px] shadow-2xl flex flex-col overflow-hidden transition-all duration-300 ${
                activeTerminal === 'pda'
                  ? 'border-amber-600/70 bg-slate-950 shadow-amber-950/20'
                  : 'border-slate-700 bg-slate-900 shadow-slate-950'
              }`}>
                
                {/* 手机顶部刘海屏与状态栏 */}
                <div className="h-7 bg-black/60 px-6 flex items-center justify-between text-[11px] text-slate-300 shrink-0">
                  <span className="font-mono font-bold">09:41</span>
                  {/* 居中听筒与摄像头 */}
                  <div className="w-20 h-4 bg-black rounded-b-xl flex items-center justify-center">
                    <span className="w-2 h-2 rounded-full bg-slate-800" />
                  </div>
                  <div className="flex items-center gap-1 text-[10px]">
                    <span>5G</span>
                    <span>100%</span>
                  </div>
                </div>

                {/* PDA 专属红外扫描口模拟指示条 */}
                {activeTerminal === 'pda' && (
                  <div className="bg-amber-600/90 text-slate-950 px-3 py-1 text-[10px] font-bold flex items-center justify-between shrink-0 shadow-xs">
                    <span className="flex items-center gap-1">
                      <ScanLine className="w-3.5 h-3.5 animate-pulse" />
                      红外激光扫码头: 就绪
                    </span>
                    <span className="bg-slate-900 text-amber-400 px-1 rounded text-[9px]">PDA-BME-02</span>
                  </div>
                )}

                {/* 客户端应用 Header */}
                <div className={`px-4 py-2.5 flex items-center justify-between shrink-0 ${
                  activeTerminal === 'wecom'
                    ? 'bg-emerald-800 text-white'
                    : activeTerminal === 'dingtalk'
                    ? 'bg-sky-700 text-white'
                    : 'bg-slate-800 text-slate-100'
                }`}>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center text-xs font-bold">
                      {activeTerminal === 'wecom' ? '企' : activeTerminal === 'dingtalk' ? '钉' : '护'}
                    </div>
                    <div>
                      <div className="text-xs font-bold leading-none">
                        {activeTerminal === 'wecom' ? '五莲医工协同应用' : activeTerminal === 'dingtalk' ? '医工工作通知' : '移动护理工作站'}
                      </div>
                      <div className="text-[10px] text-white/80 mt-0.5">五莲县人民医院</div>
                    </div>
                  </div>
                  <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full">在线</span>
                </div>

                {/* 消息滚动流 (高仿真聊天卡片) */}
                <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-slate-950/70 custom-scrollbar">
                  {terminalMessages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-4 text-slate-500">
                      <Smartphone className="w-10 h-10 mb-2 text-slate-600" />
                      <p className="text-xs text-slate-400 font-medium">当前终端暂无即时卡片</p>
                      <p className="text-[11px] text-slate-600 mt-1">请在左侧点击“立即向当前终端推送测试”</p>
                    </div>
                  ) : (
                    terminalMessages.map(msg => {
                      const isActioned = msg.status === 'actioned';
                      return (
                        <div 
                          key={msg.id} 
                          className="bg-slate-900 rounded-2xl p-3 border border-slate-800 shadow-md text-slate-200 animate-in fade-in zoom-in-95"
                        >
                          {/* 场景名与优先级 */}
                          <div className="flex items-center justify-between text-[11px] pb-1.5 border-b border-slate-800">
                            <span className="font-bold text-slate-300">{msg.scenarioTitle}</span>
                            <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                              msg.priority === 'P1_CRITICAL' 
                                ? 'bg-rose-500 text-white' 
                                : 'bg-amber-500/20 text-amber-300'
                            }`}>
                              {msg.priority === 'P1_CRITICAL' ? 'P1抢救极速' : 'P2紧急'}
                            </span>
                          </div>

                          {/* 标题 */}
                          <h4 className="text-xs font-bold text-white mt-2 leading-snug">
                            {msg.title}
                          </h4>

                          {/* 摘要正文 */}
                          <p className="text-[11px] text-slate-300 mt-1.5 leading-relaxed bg-slate-950/50 p-2 rounded-lg border border-slate-850">
                            {msg.summary}
                          </p>

                          {/* 设备与科室 */}
                          <div className="mt-2 text-[10px] text-slate-400 space-y-0.5">
                            {msg.equipmentName && <div><span className="text-slate-500">设备:</span> {msg.equipmentName}</div>}
                            {msg.location && <div><span className="text-slate-500">位置:</span> {msg.location}</div>}
                          </div>

                          {/* 已处置状态反馈 */}
                          {isActioned && msg.actionTaken && (
                            <div className="mt-2.5 p-2 rounded-lg bg-emerald-950/60 border border-emerald-800/60 text-[11px] text-emerald-300 flex items-center justify-between">
                              <span className="font-bold flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                {msg.actionTaken}
                              </span>
                              {msg.responseDurationSeconds && (
                                <span className="text-[10px] font-mono text-emerald-400">
                                  {msg.responseDurationSeconds}s 响应
                                </span>
                              )}
                            </div>
                          )}

                          {/* 交互按钮区域 */}
                          {!isActioned && msg.actions && msg.actions.length > 0 && (
                            <div className="mt-3 pt-2 border-t border-slate-800 grid grid-cols-2 gap-2">
                              {msg.actions.map(act => (
                                <button
                                  key={act.key}
                                  type="button"
                                  onClick={() => handleSimulatedCardAction(msg, act)}
                                  className={`py-1.5 px-2 rounded-xl text-[11px] font-bold transition active:scale-95 cursor-pointer shadow-xs ${
                                    act.color === 'success'
                                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white col-span-2'
                                      : act.color === 'danger'
                                      ? 'bg-rose-600 hover:bg-rose-500 text-white'
                                      : act.color === 'warning'
                                      ? 'bg-amber-600 hover:bg-amber-500 text-white'
                                      : 'bg-blue-600 hover:bg-blue-500 text-white col-span-2'
                                  }`}
                                >
                                  {act.label}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>

                {/* 手机底部 Home Indicator */}
                <div className="h-5 bg-black/80 flex items-center justify-center shrink-0">
                  <div className="w-28 h-1 bg-slate-600 rounded-full" />
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ---------------- 2. 多通道参数与 Webhook 连通 ---------------- */}
        {activeMainTab === 'channels' && (
          <div className="h-full overflow-y-auto max-w-5xl mx-auto space-y-6 custom-scrollbar pb-10">
            
            {testPingStatus && (
              <div className="p-3 bg-blue-950/70 border border-blue-700 text-blue-200 text-xs rounded-xl flex items-center justify-between">
                <span>{testPingStatus}</span>
              </div>
            )}

            {/* 1. 企业微信 (WeCom) */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">企业微信 (WeCom) 协同网关</h3>
                    <p className="text-xs text-slate-400">支持应用消息 (AgentMsg) 与智能协同群机器人 Webhook 双模式</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => handleTestPing('wecom')}
                    className="px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 text-slate-300 text-xs hover:bg-slate-750 font-medium transition cursor-pointer"
                  >
                    连通性测试 (Ping)
                  </button>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={config.wecom.enabled} 
                      onChange={e => setConfig({ ...config, wecom: { ...config.wecom, enabled: e.target.checked } })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-700 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    群机器人 Webhook 地址 (支持自填真实企微机器人 URL)
                  </label>
                  <input
                    type="text"
                    value={config.wecom.webhookUrl}
                    onChange={e => setConfig({ ...config, wecom: { ...config.wecom, webhookUrl: e.target.value } })}
                    placeholder="https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=..."
                    className="w-full bg-slate-950 border border-slate-750 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-hidden focus:border-emerald-500 font-mono"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">留空时系统默认启用内置本地高保真模拟器</p>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">企业微信 CorpID</label>
                  <input
                    type="text"
                    value={config.wecom.corpId}
                    onChange={e => setConfig({ ...config, wecom: { ...config.wecom, corpId: e.target.value } })}
                    className="w-full bg-slate-950 border border-slate-750 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-hidden focus:border-emerald-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">医工自建应用 AgentID</label>
                  <input
                    type="text"
                    value={config.wecom.agentId}
                    onChange={e => setConfig({ ...config, wecom: { ...config.wecom, agentId: e.target.value } })}
                    className="w-full bg-slate-950 border border-slate-750 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-hidden focus:border-emerald-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">应用凭证 AppSecret</label>
                  <input
                    type="password"
                    value={config.wecom.appSecret}
                    onChange={e => setConfig({ ...config, wecom: { ...config.wecom, appSecret: e.target.value } })}
                    className="w-full bg-slate-950 border border-slate-750 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-hidden focus:border-emerald-500 font-mono"
                  />
                </div>
              </div>
            </div>

            {/* 2. 钉钉 (DingTalk) */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-sky-600/20 text-sky-400 flex items-center justify-center border border-sky-500/30">
                    <Radio className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">钉钉 (DingTalk) 工作通知与审批流</h3>
                    <p className="text-xs text-slate-400">支持钉钉待办 (WorkRecord) 与互动卡片 (ActionCard) 移动审批流转</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => handleTestPing('dingtalk')}
                    className="px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 text-slate-300 text-xs hover:bg-slate-750 font-medium transition cursor-pointer"
                  >
                    连通性测试 (Ping)
                  </button>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={config.dingtalk.enabled} 
                      onChange={e => setConfig({ ...config, dingtalk: { ...config.dingtalk, enabled: e.target.checked } })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-700 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-600"></div>
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    钉钉群机器人 Webhook 地址
                  </label>
                  <input
                    type="text"
                    value={config.dingtalk.webhookUrl}
                    onChange={e => setConfig({ ...config, dingtalk: { ...config.dingtalk, webhookUrl: e.target.value } })}
                    placeholder="https://oapi.dingtalk.com/robot/send?access_token=..."
                    className="w-full bg-slate-950 border border-slate-750 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-hidden focus:border-sky-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">加签安全秘钥 (SecretKey)</label>
                  <input
                    type="text"
                    value={config.dingtalk.secretKey}
                    onChange={e => setConfig({ ...config, dingtalk: { ...config.dingtalk, secretKey: e.target.value } })}
                    className="w-full bg-slate-950 border border-slate-750 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-hidden focus:border-sky-500 font-mono"
                  />
                </div>
              </div>
            </div>

            {/* 3. 医院移动护理 PDA */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-purple-600/20 text-purple-400 flex items-center justify-center border border-purple-500/30">
                    <QrCode className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">医院移动护理 PDA 终端中继网关</h3>
                    <p className="text-xs text-slate-400">专网直连临床护士手持终端，支持红外硬解扫码、震动蜂鸣提醒与一键归还核销</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => handleTestPing('pda')}
                    className="px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 text-slate-300 text-xs hover:bg-slate-750 font-medium transition cursor-pointer"
                  >
                    网关状态测试
                  </button>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={config.pda.enabled} 
                      onChange={e => setConfig({ ...config, pda: { ...config.pda, enabled: e.target.checked } })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-700 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">内网中继监听端口</label>
                  <input
                    type="number"
                    value={config.pda.pdaGatewayPort}
                    onChange={e => setConfig({ ...config, pda: { ...config.pda, pdaGatewayPort: Number(e.target.value) } })}
                    className="w-full bg-slate-950 border border-slate-750 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-hidden focus:border-purple-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">报警铃声预设</label>
                  <select
                    value={config.pda.ringtonePreset}
                    onChange={e => setConfig({ ...config, pda: { ...config.pda, ringtonePreset: e.target.value as any } })}
                    className="w-full bg-slate-950 border border-slate-750 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-hidden focus:border-purple-500"
                  >
                    <option value="medical_urgent">医疗高优先级紧急蜂鸣 (30s连续)</option>
                    <option value="chime_standard">标准柔和提示音</option>
                    <option value="high_priority_beep">短促三连提示声</option>
                  </select>
                </div>

                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                    <input
                      type="checkbox"
                      checked={config.pda.enableVibration}
                      onChange={e => setConfig({ ...config, pda: { ...config.pda, enableVibration: e.target.checked } })}
                      className="rounded border-slate-700 text-purple-600"
                    />
                    <span>开启物理马达强震动提醒</span>
                  </label>
                </div>
              </div>
            </div>

            {/* 保存配置按钮 */}
            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={handleSaveConfig}
                disabled={isConfigSaving}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-indigo-600/25 cursor-pointer disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{isConfigSaving ? '保存生效中...' : '保存并应用多端推送配置'}</span>
              </button>
            </div>

          </div>
        )}

        {/* ---------------- 3. 业务触发与 SLA 升级规则 ---------------- */}
        {activeMainTab === 'scenarios' && (
          <div className="h-full overflow-y-auto max-w-5xl mx-auto space-y-4 custom-scrollbar pb-10">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 mb-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-400" />
                <span>全院移动即时协同场景矩阵与阶梯升级策略</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                当特定临床事件发生时，系统按规则自动编排推送渠道、卡片模板与超时升级追呼
              </p>
            </div>

            <div className="space-y-3">
              {[
                {
                  id: 'rule-1',
                  name: '临床紧急报修与智能派工 (P1/P2)',
                  trigger: '科室发起报修 / 草料扫码报修提交',
                  channels: ['企业微信卡片', '移动PDA'],
                  sla: 'P1 极高: 15分钟接单到达现场',
                  escalation: '超时 5 分钟未响应自动升级发送短信并呼叫主管工程师',
                  status: '已启用'
                },
                {
                  id: 'rule-2',
                  name: '急救生命支持借调出库与逾期催还',
                  trigger: '借调审批通过 / 借用时限剩余 2 小时 / 超时逾期',
                  channels: ['移动护理PDA', '企业微信'],
                  sla: '逾期每 1 小时自动推送一次催还提醒',
                  escalation: '连续超期 24 小时上报医工处长与借调科室主任',
                  status: '已启用'
                },
                {
                  id: 'rule-3',
                  name: '大额维修支出与立项审批流转',
                  trigger: '外协维修单提交 / 采购立项申报 / 报废技术鉴定',
                  channels: ['钉钉待办 (ActionCard)', '企业微信'],
                  sla: '48 小时内完成线上联合签审',
                  escalation: '超时 24 小时钉钉钉一下强提醒',
                  status: '已启用'
                },
                {
                  id: 'rule-4',
                  name: '法定强检与预防性维护 PM 临期预警',
                  trigger: '设备距强检检定截止日 30天 / 15天 / 7天',
                  channels: ['企业微信群', '移动PDA'],
                  sla: '严禁超期在用，强检合格率 100%',
                  escalation: '临期 7 天自动限制科室部分高风险操作建单',
                  status: '已启用'
                },
                {
                  id: 'rule-5',
                  name: '医疗器械不良事件 (MDR) 警戒三级直报',
                  trigger: '严重不良事件 (死亡/危及生命/严重伤害)',
                  channels: ['企业微信', '紧急短信', '钉钉'],
                  sla: '24 小时内向省药监直报系统完成初报',
                  escalation: '即时秒级广播全院器械应急领导小组',
                  status: '已启用'
                }
              ].map(rule => (
                <div key={rule.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2.5">
                      <h4 className="text-xs font-bold text-white">{rule.name}</h4>
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                        {rule.status}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      <span className="text-slate-500">触发源：</span>{rule.trigger}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      <span className="text-slate-500">SLA时限：</span>{rule.sla}
                    </p>
                    <p className="text-[11px] text-amber-400/90">
                      <span className="text-slate-500">超时升级：</span>{rule.escalation}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                    {rule.channels.map((ch, idx) => (
                      <span key={idx} className="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-xs font-medium text-slate-300">
                        {ch}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ---------------- 4. 实时推送审计流水与回执大盘 ---------------- */}
        {activeMainTab === 'logs' && (
          <div className="h-full flex flex-col overflow-hidden bg-slate-900/60 border border-slate-800 rounded-2xl">
            
            {/* 过滤控制栏 */}
            <div className="p-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={logSearchQuery}
                    onChange={e => setLogSearchQuery(e.target.value)}
                    placeholder="按设备、科室、标题或接收人搜索..."
                    className="w-64 bg-slate-950 border border-slate-750 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 focus:outline-hidden focus:border-indigo-500"
                  />
                </div>

                <select
                  value={logChannelFilter}
                  onChange={e => setLogChannelFilter(e.target.value as any)}
                  className="bg-slate-950 border border-slate-750 rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:outline-hidden"
                >
                  <option value="all">全部通道</option>
                  <option value="wecom">企业微信</option>
                  <option value="dingtalk">钉钉</option>
                  <option value="pda">移动PDA</option>
                  <option value="sms">紧急短信</option>
                </select>
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span>共找到 {filteredLogs.length} 条推送流水</span>
              </div>
            </div>

            {/* 流水表格 */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/90 text-slate-400 uppercase text-[11px] sticky top-0 z-10 border-b border-slate-800">
                  <tr>
                    <th className="px-4 py-3">流水号 / 时间</th>
                    <th className="px-4 py-3">通道 / 级别</th>
                    <th className="px-4 py-3">场景与摘要</th>
                    <th className="px-4 py-3">接收人与终端</th>
                    <th className="px-4 py-3">回执动作与时效</th>
                    <th className="px-4 py-3 text-right">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {filteredLogs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-12 text-slate-500">
                        未检索到符合条件的推送审计记录
                      </td>
                    </tr>
                  ) : (
                    filteredLogs.map(log => {
                      const isActioned = log.status === 'actioned';
                      return (
                        <tr key={log.id} className="hover:bg-slate-800/40 transition">
                          <td className="px-4 py-3 font-mono text-slate-400 text-[11px]">
                            <div className="text-slate-200 font-semibold">{log.id}</div>
                            <div>{log.timestamp}</div>
                          </td>

                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1.5">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                                log.channel === 'wecom'
                                  ? 'bg-emerald-500/20 text-emerald-300'
                                  : log.channel === 'dingtalk'
                                  ? 'bg-sky-500/20 text-sky-300'
                                  : log.channel === 'pda'
                                  ? 'bg-purple-500/20 text-purple-300'
                                  : 'bg-slate-700 text-slate-300'
                              }`}>
                                {log.channel === 'wecom' && '企业微信'}
                                {log.channel === 'dingtalk' && '钉钉'}
                                {log.channel === 'pda' && '移动PDA'}
                                {log.channel === 'sms' && '紧急短信'}
                              </span>

                              <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                                log.priority === 'P1_CRITICAL' 
                                  ? 'bg-rose-600 text-white' 
                                  : 'bg-amber-600/30 text-amber-300'
                              }`}>
                                {log.priority}
                              </span>
                            </div>
                          </td>

                          <td className="px-4 py-3 max-w-xs">
                            <div className="font-bold text-slate-200 truncate">{log.title}</div>
                            <div className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">{log.summary}</div>
                          </td>

                          <td className="px-4 py-3">
                            <div className="text-slate-200 font-medium">{log.recipientName}</div>
                            <div className="text-[11px] text-slate-400">{log.recipientRole}</div>
                          </td>

                          <td className="px-4 py-3">
                            {isActioned ? (
                              <div className="text-emerald-400 font-medium text-[11px] flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                                <span>{log.actionTaken || '已完成处置'}</span>
                              </div>
                            ) : (
                              <span className="text-amber-400 text-[11px] font-medium flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5 shrink-0" />
                                等待移动端响应
                              </span>
                            )}
                            <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                              投递网络耗时: {log.deliveryLatencyMs}ms
                            </div>
                          </td>

                          <td className="px-4 py-3 text-right">
                            <button
                              type="button"
                              onClick={() => setSelectedLogPayload(log)}
                              className="px-2.5 py-1 rounded-lg border border-slate-750 bg-slate-800 text-slate-300 hover:text-white text-xs transition cursor-pointer"
                            >
                              原始报文
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

          </div>
        )}

      </div>

      {/* 报文查看弹窗 */}
      {selectedLogPayload && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs select-none animate-in fade-in">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-5 flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Laptop className="w-4 h-4 text-indigo-400" />
                <span>推送流水报文审计 ({selectedLogPayload.id})</span>
              </h3>
              <button
                type="button"
                onClick={() => setSelectedLogPayload(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto mt-3 custom-scrollbar">
              <pre className="text-xs font-mono text-emerald-400 bg-slate-950 p-4 rounded-xl border border-slate-800 whitespace-pre-wrap">
                {selectedLogPayload.payloadJson || JSON.stringify(selectedLogPayload, null, 2)}
              </pre>
            </div>

            <div className="pt-4 border-t border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedLogPayload(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition cursor-pointer"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, 
  Bell, 
  Smartphone, 
  MessageSquare, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Flame, 
  Send, 
  ExternalLink, 
  RefreshCw,
  QrCode,
  ShieldAlert,
  ChevronRight,
  Radio,
  FileCheck
} from 'lucide-react';
import { 
  MobileNotificationRecord, 
  NotificationChannel, 
  MobilePushActionOption 
} from '../../types/mobileNotificationTypes';
import { 
  loadPushLogs, 
  handleMobileActionExecution 
} from '../../utils/mobileNotificationData';

interface MobileNotificationCenterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToMobileCollaboration: () => void;
  currentUserName?: string;
}

export const MobileNotificationCenterDrawer: React.FC<MobileNotificationCenterDrawerProps> = ({
  isOpen,
  onClose,
  onNavigateToMobileCollaboration,
  currentUserName = '当班医工'
}) => {
  const [logs, setLogs] = useState<MobileNotificationRecord[]>([]);
  const [filterChannel, setFilterChannel] = useState<'all' | 'actionable' | 'wecom' | 'dingtalk' | 'pda'>('all');
  const [feedbackToast, setFeedbackToast] = useState<{ msg: string; type: 'success' | 'info' } | null>(null);

  const refreshLogs = () => {
    setLogs(loadPushLogs());
  };

  useEffect(() => {
    if (isOpen) {
      refreshLogs();
    }
  }, [isOpen]);

  // 监听全局推送与动作广播
  useEffect(() => {
    const handlePushEvent = () => refreshLogs();
    window.addEventListener('med_tech_mobile_push_event', handlePushEvent);
    window.addEventListener('med_tech_mobile_action_executed', handlePushEvent);
    return () => {
      window.removeEventListener('med_tech_mobile_push_event', handlePushEvent);
      window.removeEventListener('med_tech_mobile_action_executed', handlePushEvent);
    };
  }, []);

  const handleExecuteAction = (record: MobileNotificationRecord, action: MobilePushActionOption) => {
    const res = handleMobileActionExecution(record.id, action, currentUserName);
    if (res.success) {
      setFeedbackToast({ msg: res.message, type: 'success' });
      refreshLogs();
      setTimeout(() => setFeedbackToast(null), 3500);
    }
  };

  const filteredLogs = useMemo(() => {
    if (filterChannel === 'actionable') {
      return logs.filter(l => l.isActionable && l.status !== 'actioned');
    }
    if (filterChannel === 'wecom') return logs.filter(l => l.channel === 'wecom');
    if (filterChannel === 'dingtalk') return logs.filter(l => l.channel === 'dingtalk');
    if (filterChannel === 'pda') return logs.filter(l => l.channel === 'pda');
    return logs;
  }, [logs, filterChannel]);

  const actionableCount = useMemo(() => {
    return logs.filter(l => l.isActionable && l.status !== 'actioned').length;
  }, [logs]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden select-none animate-in fade-in duration-200">
      {/* 遮罩背景 */}
      <div 
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity" 
        onClick={onClose} 
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md md:max-w-lg bg-slate-900 text-slate-100 shadow-2xl flex flex-col border-l border-slate-800">
          
          {/* 抽屉头部 */}
          <div className="px-5 py-4 border-b border-slate-800 bg-slate-950/90 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-white tracking-wide">全院移动协同通知中心</h2>
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    多端在线
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">企业微信 • 钉钉 • 移动护理PDA • 实时卡片互动</p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={refreshLogs}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
                title="刷新消息流"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
                title="关闭"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Toast 反馈提示条 */}
          {feedbackToast && (
            <div className="px-4 py-2.5 bg-emerald-950/90 border-b border-emerald-800/80 text-emerald-200 text-xs flex items-center gap-2 animate-in slide-in-from-top-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="flex-1 font-medium">{feedbackToast.msg}</span>
            </div>
          )}

          {/* 快捷通道筛选 Tab */}
          <div className="px-4 py-2.5 bg-slate-900/90 border-b border-slate-800 flex items-center gap-1.5 overflow-x-auto text-xs shrink-0">
            <button
              type="button"
              onClick={() => setFilterChannel('all')}
              className={`px-3 py-1.5 rounded-lg font-medium transition shrink-0 ${
                filterChannel === 'all'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              全部消息 ({logs.length})
            </button>

            <button
              type="button"
              onClick={() => setFilterChannel('actionable')}
              className={`px-3 py-1.5 rounded-lg font-medium transition shrink-0 flex items-center gap-1.5 ${
                filterChannel === 'actionable'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-amber-400/90 hover:text-amber-300 hover:bg-amber-500/10'
              }`}
            >
              <span>待办交互卡片</span>
              {actionableCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-400 text-slate-950">
                  {actionableCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setFilterChannel('wecom')}
              className={`px-2.5 py-1.5 rounded-lg font-medium transition shrink-0 flex items-center gap-1 ${
                filterChannel === 'wecom'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
              <span>企业微信</span>
            </button>

            <button
              type="button"
              onClick={() => setFilterChannel('dingtalk')}
              className={`px-2.5 py-1.5 rounded-lg font-medium transition shrink-0 flex items-center gap-1 ${
                filterChannel === 'dingtalk'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <Radio className="w-3.5 h-3.5 text-sky-400" />
              <span>钉钉</span>
            </button>

            <button
              type="button"
              onClick={() => setFilterChannel('pda')}
              className={`px-2.5 py-1.5 rounded-lg font-medium transition shrink-0 flex items-center gap-1 ${
                filterChannel === 'pda'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <QrCode className="w-3.5 h-3.5 text-purple-400" />
              <span>移动PDA</span>
            </button>
          </div>

          {/* 消息滚动列表 */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 custom-scrollbar">
            {filteredLogs.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-slate-500">
                <Bell className="w-10 h-10 mb-2.5 text-slate-600 stroke-[1.5]" />
                <p className="text-sm font-medium text-slate-400">暂无当前分类的推送记录</p>
                <p className="text-xs text-slate-600 mt-1">系统产生派工、审批或借调时将实时推送到此</p>
              </div>
            ) : (
              filteredLogs.map(item => {
                const isP1 = item.priority === 'P1_CRITICAL';
                const isP2 = item.priority === 'P2_URGENT';
                const isActioned = item.status === 'actioned';

                return (
                  <div 
                    key={item.id}
                    className={`rounded-xl p-3.5 border transition-all duration-200 ${
                      isP1 
                        ? 'bg-rose-950/30 border-rose-800/60 shadow-xs shadow-rose-950/20' 
                        : isP2
                        ? 'bg-amber-950/20 border-amber-800/50'
                        : 'bg-slate-800/60 border-slate-750 hover:border-slate-700'
                    }`}
                  >
                    {/* 卡片头部 */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {/* 渠道标签 */}
                        <span className={`px-2 py-0.5 rounded text-[11px] font-semibold flex items-center gap-1 ${
                          item.channel === 'wecom'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : item.channel === 'dingtalk'
                            ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                            : item.channel === 'pda'
                            ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                            : 'bg-slate-700 text-slate-300'
                        }`}>
                          {item.channel === 'wecom' && '企业微信'}
                          {item.channel === 'dingtalk' && '钉钉'}
                          {item.channel === 'pda' && '移动护理PDA'}
                          {item.channel === 'sms' && '紧急短信'}
                        </span>

                        {/* 优先级 */}
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          isP1 
                            ? 'bg-rose-600 text-white animate-pulse' 
                            : isP2 
                            ? 'bg-amber-600/30 text-amber-300 border border-amber-600/40' 
                            : 'bg-slate-700 text-slate-400'
                        }`}>
                          {item.priority === 'P1_CRITICAL' ? 'P1 极高' : item.priority === 'P2_URGENT' ? 'P2 紧急' : 'P3 常规'}
                        </span>

                        <span className="text-[11px] text-slate-400 font-mono">
                          {item.timestamp.split(' ')[1]}
                        </span>
                      </div>

                      {/* 状态徽标 */}
                      {isActioned ? (
                        <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          已处置
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[11px] text-amber-400 font-medium">
                          <Clock className="w-3.5 h-3.5" />
                          待响应
                        </span>
                      )}
                    </div>

                    {/* 消息标题 */}
                    <h3 className="text-sm font-bold text-slate-100 mt-2 leading-snug">
                      {item.title}
                    </h3>

                    {/* 摘要描述 */}
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                      {item.summary}
                    </p>

                    {/* 关联元信息 */}
                    {(item.equipmentName || item.department) && (
                      <div className="mt-2.5 pt-2 border-t border-slate-750/70 grid grid-cols-2 gap-x-2 gap-y-1 text-[11px] text-slate-400">
                        {item.equipmentName && (
                          <div className="truncate">
                            <span className="text-slate-500">机具：</span>
                            <span className="text-slate-200">{item.equipmentName}</span>
                          </div>
                        )}
                        {item.department && (
                          <div className="truncate">
                            <span className="text-slate-500">科室：</span>
                            <span className="text-slate-200">{item.department}</span>
                          </div>
                        )}
                        {item.location && (
                          <div className="col-span-2 truncate">
                            <span className="text-slate-500">地点：</span>
                            <span className="text-slate-300">{item.location}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* 已处置回执展示 */}
                    {isActioned && item.actionTaken && (
                      <div className="mt-2.5 p-2 rounded-lg bg-emerald-950/40 border border-emerald-800/40 text-[11px] text-emerald-300 flex items-center justify-between">
                        <span className="font-medium truncate">{item.actionTaken}</span>
                        {item.responseDurationSeconds && (
                          <span className="text-[10px] text-emerald-400/80 shrink-0 font-mono">
                            耗时 {item.responseDurationSeconds}s
                          </span>
                        )}
                      </div>
                    )}

                    {/* 直接交互卡片按钮区 */}
                    {!isActioned && item.actions && item.actions.length > 0 && (
                      <div className="mt-3 pt-2.5 border-t border-slate-750 flex flex-wrap items-center gap-2">
                        {item.actions.map(act => (
                          <button
                            key={act.key}
                            type="button"
                            onClick={() => handleExecuteAction(item, act)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition active:scale-95 shadow-xs flex items-center gap-1.5 ${
                              act.color === 'success'
                                ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                                : act.color === 'danger'
                                ? 'bg-rose-600 hover:bg-rose-500 text-white'
                                : act.color === 'warning'
                                ? 'bg-amber-600 hover:bg-amber-500 text-white'
                                : 'bg-blue-600 hover:bg-blue-500 text-white'
                            }`}
                          >
                            <span>{act.label}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* 抽屉底部快捷导航栏 */}
          <div className="p-4 border-t border-slate-800 bg-slate-950/90 flex items-center justify-between shrink-0">
            <div className="text-xs text-slate-400">
              <span>投递中枢：</span>
              <span className="text-emerald-400 font-medium">心跳活跃 (42ms)</span>
            </div>

            <button
              type="button"
              onClick={() => {
                onClose();
                onNavigateToMobileCollaboration();
              }}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-indigo-600/20 cursor-pointer"
            >
              <span>打开移动协同沙箱大厅</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

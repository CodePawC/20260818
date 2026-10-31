import React, { useState } from 'react';
import { DrgWarningAlert } from '../../types/drgTypes';
import { ShieldAlert, AlertTriangle, ChevronDown, ChevronUp, CheckCircle2, ArrowRight, Eye, Check, Clock, Coins } from 'lucide-react';

interface DrgWarningNotificationBannerProps {
  alerts: DrgWarningAlert[];
  onDrillDownEquipment: (equipmentInternalNo: string) => void;
  onDrillDownAlert?: (alert: DrgWarningAlert) => void;
  onHandleAlert: (alertId: string, remark: string) => void;
}

export const DrgWarningNotificationBanner: React.FC<DrgWarningNotificationBannerProps> = ({
  alerts,
  onDrillDownEquipment,
  onDrillDownAlert,
  onHandleAlert
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [activeRemarkInputId, setActiveRemarkInputId] = useState<string | null>(null);
  const [remarkText, setRemarkText] = useState<string>('');

  if (alerts.length === 0) return null;

  const redAlerts = alerts.filter(a => a.alertLevel === 'red');
  const amberAlerts = alerts.filter(a => a.alertLevel === 'amber');
  const unhandledCount = alerts.filter(a => !a.handled).length;

  const submitHandle = (alertId: string) => {
    onHandleAlert(alertId, remarkText.trim() || '已组织科室现场核实，无违规外流，已规范手术包耗材配比。');
    setActiveRemarkInputId(null);
    setRemarkText('');
  };

  return (
    <div className="mb-4 bg-white dark:bg-slate-800 rounded-xl border border-rose-200 dark:border-rose-900/60 shadow-xs overflow-hidden">
      {/* 顶部横幅标题栏 */}
      <div 
        onClick={() => setIsExpanded(prev => !prev)}
        className="px-4 py-3 bg-gradient-to-r from-rose-50/90 via-amber-50/60 to-white dark:from-rose-950/40 dark:via-amber-950/20 dark:to-slate-800 flex items-center justify-between cursor-pointer select-none"
      >
        <div className="flex items-center gap-3">
          <div className="relative">
            <span className="flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-900 dark:text-white">
                专机耗材消耗异常红黄预警通知
              </span>
              <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300">
                {redAlerts.length} 台红色高危
              </span>
              <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300">
                {amberAlerts.length} 台黄色偏离
              </span>
              {unhandledCount > 0 && (
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  (待闭环处理: {unhandledCount} 项)
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              依据三甲医院质控标准，系统自动监控单台设备耗材例均支出。当超出病组基准15%~30%触发黄色警戒，超出&gt;30%触发红色高危。
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
          <span className="font-medium text-[11px] hidden sm:inline">
            {isExpanded ? '收起预警列表' : '展开查看设备明细'}
          </span>
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </div>

      {/* 展开的预警设备卡片网格 */}
      {isExpanded && (
        <div className="p-4 border-t border-rose-100 dark:border-rose-900/40 bg-slate-50/50 dark:bg-slate-850 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {alerts.map(alert => {
              const isRed = alert.alertLevel === 'red';
              const isInputting = activeRemarkInputId === alert.id;

              return (
                <div
                  key={alert.id}
                  onClick={() => onDrillDownAlert ? onDrillDownAlert(alert) : onDrillDownEquipment(alert.internalNo)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer hover:shadow-md ${
                    alert.handled
                      ? 'bg-white/80 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 opacity-80'
                      : isRed
                        ? 'bg-rose-50/60 dark:bg-rose-950/20 border-rose-300 dark:border-rose-800 hover:border-rose-500 shadow-xs'
                        : 'bg-amber-50/60 dark:bg-amber-950/20 border-amber-300 dark:border-amber-800 hover:border-amber-500 shadow-xs'
                  }`}
                  title="点击直接穿透下钻该设备在指定病组下的详细费用构成分析与关联维保记录"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {isRed ? (
                        <ShieldAlert className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-xs text-slate-900 dark:text-white">
                            {alert.internalNo}
                          </span>
                          <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[150px]">
                            {alert.equipmentName}
                          </span>
                          <span className="text-[11px] text-slate-500">
                            {alert.departmentName}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          关联病组: <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">{alert.drgCode}</span> {alert.drgName}
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0 flex flex-col items-end gap-0.5">
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded font-mono ${
                        isRed 
                          ? 'bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300' 
                          : 'bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300'
                      }`}>
                        {isRed ? '红色高危' : '黄色偏离'} {alert.exceedRatePercent > 0 ? `+${alert.exceedRatePercent}%` : '异常'}
                      </span>
                      <span className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold flex items-center gap-0.5">
                        <span>点击穿透下钻</span>
                        <ArrowRight className="w-2.5 h-2.5" />
                      </span>
                    </div>
                  </div>

                  {/* 耗材数据对比条 */}
                  <div className="mt-2.5 p-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-200/80 dark:border-slate-700 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-slate-500 text-[11px]">单机例均专耗:</span>{' '}
                      <span className="font-mono font-bold text-slate-900 dark:text-white">
                        ¥{alert.actualAvgConsumablePerCase.toLocaleString()}
                      </span>
                    </div>
                    <div className="text-slate-400 text-xs">vs</div>
                    <div>
                      <span className="text-slate-500 text-[11px]">病组平均基准:</span>{' '}
                      <span className="font-mono font-medium text-slate-600 dark:text-slate-300">
                        ¥{alert.groupAvgConsumableBenchmark.toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[11px]">偏差率:</span>{' '}
                      <span className={`font-mono font-bold ${isRed ? 'text-rose-600' : 'text-amber-600'}`}>
                        {alert.exceedRatePercent > 0 ? `+${alert.exceedRatePercent}%` : '0%'}
                      </span>
                    </div>
                  </div>

                  {/* 质控整改处置建议 */}
                  <div className="mt-2 text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed bg-white/50 dark:bg-slate-900/40 p-2 rounded border border-slate-100 dark:border-slate-800">
                    <span className="font-semibold text-slate-700 dark:text-slate-200">质控处置建议：</span>
                    {alert.suggestedAction}
                  </div>

                  {/* 已经处理的备注信息 */}
                  {alert.handled && (
                    <div className="mt-2 text-[11px] text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 p-2 rounded border border-emerald-200 dark:border-emerald-800/60 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                      <span>已核查闭环: {alert.handleRemark || '已组织科室现场核实'}</span>
                    </div>
                  )}

                  {/* 填报整改说明输入框 */}
                  {isInputting && (
                    <div 
                      onClick={(e) => e.stopPropagation()}
                      className="mt-2 p-2 bg-white dark:bg-slate-900 rounded-lg border border-blue-200 dark:border-blue-800 space-y-2"
                    >
                      <input
                        type="text"
                        value={remarkText}
                        onChange={(e) => setRemarkText(e.target.value)}
                        placeholder="请输入质控核查排查记录与整改措施..."
                        className="w-full text-xs p-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-slate-900 dark:text-white"
                        autoFocus
                      />
                      <div className="flex justify-end gap-1.5">
                        <button
                          onClick={() => setActiveRemarkInputId(null)}
                          className="px-2 py-1 text-xs text-slate-500 hover:text-slate-700"
                        >
                          取消
                        </button>
                        <button
                          onClick={() => submitHandle(alert.id)}
                          className="px-2.5 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                          确认归档
                        </button>
                      </div>
                    </div>
                  )}

                  {/* 底部操作按钮 */}
                  <div className="mt-2.5 flex items-center justify-between text-xs pt-1 border-t border-slate-200/60 dark:border-slate-700/60 flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onDrillDownAlert) onDrillDownAlert(alert);
                        else onDrillDownEquipment(alert.internalNo);
                      }}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition shadow-2xs ${
                        isRed
                          ? 'bg-rose-600 hover:bg-rose-700 text-white'
                          : 'bg-amber-600 hover:bg-amber-700 text-white'
                      }`}
                      title="点击直接穿透下钻该设备在指定病组下的详细费用构成分析与维保记录"
                    >
                      <Coins className="w-3.5 h-3.5" />
                      <span>穿透下钻费用构成与维保</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDrillDownEquipment(alert.internalNo);
                        }}
                        className="inline-flex items-center gap-1 text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 font-medium text-[11px]"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>病案流水</span>
                      </button>

                      {!alert.handled ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveRemarkInputId(alert.id);
                            setRemarkText('');
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-600 rounded text-[11px] hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                        >
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span>填报整改</span>
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>已归档</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

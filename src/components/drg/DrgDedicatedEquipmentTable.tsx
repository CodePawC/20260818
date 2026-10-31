import React from 'react';
import { DedicatedEquipmentAuditSummary, DrgCaseAuditRecord, DrgWarningAlert } from '../../types/drgTypes';
import { AlertCircle, CheckCircle2, ChevronRight, Cpu, ShieldAlert, ArrowUpRight, ArrowDownRight, AlertTriangle, Coins } from 'lucide-react';

interface DrgDedicatedEquipmentTableProps {
  summaries: DedicatedEquipmentAuditSummary[];
  alerts?: DrgWarningAlert[];
  onSelectEquipment: (eqSummary: DedicatedEquipmentAuditSummary) => void;
  onDrillDownAlert?: (alert: DrgWarningAlert) => void;
}

export const DrgDedicatedEquipmentTable: React.FC<DrgDedicatedEquipmentTableProps> = ({
  summaries,
  alerts = [],
  onSelectEquipment,
  onDrillDownAlert
}) => {
  const alertMap = React.useMemo(() => {
    const map = new Map<string, DrgWarningAlert>();
    alerts.forEach(a => map.set(a.internalNo, a));
    return map;
  }, [alerts]);
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs overflow-hidden">
      <div className="p-3.5 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
            专机设备机时折旧与专用耗材进出钩稽台账
          </h3>
          <span className="text-xs text-slate-500">
            共纳管 {summaries.length} 台重点高频专机设备
          </span>
        </div>
        <div className="text-xs text-slate-500 flex items-center gap-3">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span> 低风险 (偏差&lt;8%)
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-500 inline-block"></span> 中风险 (偏差8%-15%)
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-rose-500 inline-block"></span> 高风险 (漏记/超标&gt;15%)
          </span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50/80 dark:bg-slate-900/60 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
              <th className="py-2.5 px-3 font-medium">设备编号 / 设备名称</th>
              <th className="py-2.5 px-3 font-medium">规格型号 · 科室</th>
              <th className="py-2.5 px-3 font-medium text-right">设备原值</th>
              <th className="py-2.5 px-3 font-medium text-right">单位机时基准</th>
              <th className="py-2.5 px-3 font-medium text-right">当月开机工时</th>
              <th className="py-2.5 px-3 font-medium text-right">服务病案数</th>
              <th className="py-2.5 px-3 font-medium text-right">理论应耗套数</th>
              <th className="py-2.5 px-3 font-medium text-right">实际扫码套数</th>
              <th className="py-2.5 px-3 font-medium text-right">专耗偏差率</th>
              <th className="py-2.5 px-3 font-medium text-right">疑似风险漏费</th>
              <th className="py-2.5 px-3 font-medium text-center">风险评级</th>
              <th className="py-2.5 px-3 font-medium text-center">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {summaries.map(item => {
              const isOver = item.consumableDiscrepancyRate > 0;
              const isUnder = item.consumableDiscrepancyRate < 0;
              const alert = alertMap.get(item.internalNo);

              return (
                <tr 
                  key={item.internalNo}
                  onClick={() => {
                    if (alert && onDrillDownAlert) {
                      onDrillDownAlert(alert);
                    } else {
                      onSelectEquipment(item);
                    }
                  }}
                  className={`transition-colors cursor-pointer ${
                    alert
                      ? alert.alertLevel === 'red'
                        ? 'bg-rose-50/40 dark:bg-rose-950/20 hover:bg-rose-50/80 border-l-4 border-l-rose-500'
                        : 'bg-amber-50/40 dark:bg-amber-950/20 hover:bg-amber-50/80 border-l-4 border-l-amber-500'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-750'
                  }`}
                  title={alert ? '点击穿透下钻该设备在指定病组下的详细费用构成分析与关联维保记录' : '点击查看该设备核验流水'}
                >
                  {/* 设备编号与名称 */}
                  <td className="py-3 px-3">
                    <div className="flex items-start gap-2">
                      <span className="font-mono font-bold text-slate-800 dark:text-slate-100 bg-slate-100 dark:bg-slate-700/60 px-1.5 py-0.5 rounded text-[11px] shrink-0 mt-0.5">
                        {item.internalNo}
                      </span>
                      <div>
                        <div className="font-medium text-slate-900 dark:text-white flex items-center gap-1.5">
                          <span>{item.equipmentName}</span>
                        </div>
                        <div className="text-[11px] text-slate-400">
                          覆盖: {item.primaryDrgCodes.join(', ')}
                        </div>
                        {alert && (
                          <div className={`mt-1 inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium font-mono ${
                            alert.alertLevel === 'red'
                              ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/60 dark:text-rose-300'
                              : 'bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300'
                          }`}>
                            {alert.alertLevel === 'red' ? (
                              <ShieldAlert className="w-3 h-3 text-rose-600 shrink-0" />
                            ) : (
                              <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0" />
                            )}
                            <span>
                              {alert.alertLevel === 'red' ? '红色高危' : '黄色偏离'}: 单机超均值 +{alert.exceedRatePercent}%
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* 规格型号与科室 */}
                  <td className="py-3 px-3">
                    <div className="font-medium text-slate-800 dark:text-slate-200">
                      {item.departmentName}
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono">
                      {item.model}
                    </div>
                  </td>

                  {/* 设备原值 */}
                  <td className="py-3 px-3 text-right font-mono tabular-nums text-slate-600 dark:text-slate-400">
                    ¥{(item.originalValue / 10000).toFixed(1)}万
                  </td>

                  {/* 单位机时基准成本 */}
                  <td className="py-3 px-3 text-right font-mono tabular-nums text-indigo-600 dark:text-indigo-400 font-medium">
                    ¥{item.hourlyCostBenchmark}/h
                  </td>

                  {/* 当月开机工时 */}
                  <td className="py-3 px-3 text-right font-mono tabular-nums font-semibold text-slate-900 dark:text-white">
                    {item.totalRunningHours}h
                  </td>

                  {/* 服务病案数 */}
                  <td className="py-3 px-3 text-right font-mono tabular-nums text-slate-800 dark:text-slate-200">
                    {item.servedCaseCount}例
                  </td>

                  {/* 理论应耗套数 */}
                  <td className="py-3 px-3 text-right font-mono tabular-nums text-slate-500">
                    {item.associatedConsumableExpected}套
                  </td>

                  {/* 实际扫码套数 */}
                  <td className="py-3 px-3 text-right font-mono tabular-nums font-medium text-slate-800 dark:text-slate-200">
                    {item.associatedConsumableActual}套
                  </td>

                  {/* 专耗偏差率 */}
                  <td className="py-3 px-3 text-right font-mono tabular-nums">
                    {item.consumableDiscrepancyRate === 0 ? (
                      <span className="text-slate-500">0.0%</span>
                    ) : (
                      <span className={`inline-flex items-center gap-0.5 font-medium ${
                        Math.abs(item.consumableDiscrepancyRate) > 15 
                          ? 'text-rose-600 dark:text-rose-400' 
                          : Math.abs(item.consumableDiscrepancyRate) > 8 
                            ? 'text-amber-600 dark:text-amber-400' 
                            : 'text-emerald-600 dark:text-emerald-400'
                      }`}>
                        {isOver ? <ArrowUpRight className="w-3 h-3 inline" /> : <ArrowDownRight className="w-3 h-3 inline" />}
                        {item.consumableDiscrepancyRate > 0 ? '+' : ''}{item.consumableDiscrepancyRate}%
                      </span>
                    )}
                  </td>

                  {/* 疑似风险漏费 */}
                  <td className="py-3 px-3 text-right font-mono tabular-nums">
                    {item.potentialRevenueLoss > 0 ? (
                      <span className="text-rose-600 dark:text-rose-400 font-semibold">
                        ¥{item.potentialRevenueLoss.toLocaleString()}
                      </span>
                    ) : (
                      <span className="text-slate-400">无漏费</span>
                    )}
                  </td>

                  {/* 风险评级 */}
                  <td className="py-3 px-3 text-center">
                    {alert?.alertLevel === 'red' ? (
                      <span className="inline-flex items-center gap-1 text-[11px] text-rose-700 dark:text-rose-300 font-bold bg-rose-100 dark:bg-rose-900/60 px-2 py-0.5 rounded">
                        <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                        <span>红色预警</span>
                      </span>
                    ) : alert?.alertLevel === 'amber' ? (
                      <span className="inline-flex items-center gap-1 text-[11px] text-amber-700 dark:text-amber-300 font-bold bg-amber-100 dark:bg-amber-900/60 px-2 py-0.5 rounded">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                        <span>黄色预警</span>
                      </span>
                    ) : item.auditRiskLevel === 'low' ? (
                      <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>低风险</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] text-amber-600 dark:text-amber-400">
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>轻微偏离</span>
                      </span>
                    )}
                  </td>

                  {/* 操作 */}
                  <td className="py-3 px-3 text-center">
                    {alert ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onDrillDownAlert) onDrillDownAlert(alert);
                          else onSelectEquipment(item);
                        }}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg border shadow-2xs transition cursor-pointer ${
                          alert.alertLevel === 'red'
                            ? 'bg-rose-600 hover:bg-rose-700 text-white border-rose-600'
                            : 'bg-amber-600 hover:bg-amber-700 text-white border-amber-600'
                        }`}
                        title="点击穿透下钻该设备在指定病组下的详细费用构成分析与关联维保记录"
                      >
                        <Coins className="w-3.5 h-3.5" />
                        <span>下钻预警分析</span>
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectEquipment(item);
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded border border-blue-200 dark:border-blue-800 transition-colors cursor-pointer"
                      >
                        <span>核验流水</span>
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

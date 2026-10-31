import React from 'react';
import { DrgGroupMaster, DrgCaseAuditRecord, DrgWarningAlert } from '../../types/drgTypes';
import { ChevronRight, AlertTriangle, CheckCircle2, ShieldAlert, Cpu, Sparkles } from 'lucide-react';

interface DrgAuditCaseTableProps {
  groups: DrgGroupMaster[];
  cases: DrgCaseAuditRecord[];
  alerts?: DrgWarningAlert[];
  onSelectGroup: (drgGroup: DrgGroupMaster) => void;
  onDrillDownCase: (caseRecord: DrgCaseAuditRecord) => void;
  onDrillDownAlert?: (alert: DrgWarningAlert) => void;
}

export const DrgAuditCaseTable: React.FC<DrgAuditCaseTableProps> = ({
  groups,
  cases,
  alerts = [],
  onSelectGroup,
  onDrillDownCase,
  onDrillDownAlert
}) => {
  // 聚合各病组的实时统计
  const groupStats = React.useMemo(() => {
    const map = new Map<string, {
      totalCases: number;
      totalCost: number;
      totalIncome: number;
      totalEqCost: number;
      totalConCost: number;
      totalNetBalance: number;
      anomalies: number;
      sampleCases: DrgCaseAuditRecord[];
    }>();

    cases.forEach(c => {
      if (!map.has(c.drgCode)) {
        map.set(c.drgCode, {
          totalCases: 0,
          totalCost: 0,
          totalIncome: 0,
          totalEqCost: 0,
          totalConCost: 0,
          totalNetBalance: 0,
          anomalies: 0,
          sampleCases: []
        });
      }
      const item = map.get(c.drgCode)!;
      item.totalCases++;
      item.totalCost += c.totalHospitalCost;
      item.totalIncome += c.insurancePayment;
      item.totalEqCost += c.allocatedEquipmentCost;
      item.totalConCost += c.actualConsumablesCost;
      item.totalNetBalance += c.netBalance;
      if (c.auditStatus !== 'normal') {
        item.anomalies++;
      }
      if (item.sampleCases.length < 3) {
        item.sampleCases.push(c);
      }
    });

    return map;
  }, [cases]);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs overflow-hidden">
      <div className="p-3.5 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
            DRG病组设备成本分摊与专耗核算矩阵
          </h3>
          <span className="text-xs text-slate-500">
            共纳管 {groups.length} 个重点病组 · 覆盖率 100%
          </span>
        </div>
        <div className="text-xs text-slate-500 flex items-center gap-3">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span> 结余良好
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-500 inline-block"></span> 预警微亏
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-rose-500 inline-block"></span> 严重倒挂
          </span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50/80 dark:bg-slate-900/60 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
              <th className="py-2.5 px-3 font-medium">DRG编码 / 病组名称</th>
              <th className="py-2.5 px-3 font-medium">主导科室 · 标化权重</th>
              <th className="py-2.5 px-3 font-medium">关联专机设备</th>
              <th className="py-2.5 px-3 font-medium text-right">核算病案数</th>
              <th className="py-2.5 px-3 font-medium text-right">医保统筹标额</th>
              <th className="py-2.5 px-3 font-medium text-right">例均医疗总费</th>
              <th className="py-2.5 px-3 font-medium text-right">例均专机成本</th>
              <th className="py-2.5 px-3 font-medium text-right">例均专耗支出</th>
              <th className="py-2.5 px-3 font-medium text-right">例均医保结余</th>
              <th className="py-2.5 px-3 font-medium text-center">专耗钩稽状态</th>
              <th className="py-2.5 px-3 font-medium text-center">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {groups.map(group => {
              const stat = groupStats.get(group.drgCode) || {
                totalCases: 0,
                totalCost: 0,
                totalIncome: 0,
                totalEqCost: 0,
                totalConCost: 0,
                totalNetBalance: 0,
                anomalies: 0,
                sampleCases: []
              };

              const avgCost = stat.totalCases > 0 ? Math.round(stat.totalCost / stat.totalCases) : 0;
              const avgEqCost = stat.totalCases > 0 ? Math.round(stat.totalEqCost / stat.totalCases) : 0;
              const avgConCost = stat.totalCases > 0 ? Math.round(stat.totalConCost / stat.totalCases) : 0;
              const avgNetBal = stat.totalCases > 0 ? Math.round(stat.totalNetBalance / stat.totalCases) : 0;
              const isProfit = avgNetBal >= 0;

              return (
                <tr 
                  key={group.id} 
                  className="hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors"
                >
                  {/* DRG编码与名称 */}
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-800 dark:text-slate-100 bg-slate-100 dark:bg-slate-700/60 px-1.5 py-0.5 rounded text-[11px]">
                        {group.drgCode}
                      </span>
                      <div>
                        <div className="font-medium text-slate-900 dark:text-white">
                          {group.drgName}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {group.mdcCode} · {group.mdcName}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* 主导科室与点数 */}
                  <td className="py-3 px-3">
                    <div className="font-medium text-slate-800 dark:text-slate-200">
                      {group.departmentName}
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono">
                      RW {group.weightPoints.toFixed(2)} · {group.targetAlosDays}天
                    </div>
                  </td>

                  {/* 关联专机设备 */}
                  <td className="py-3 px-3 max-w-[180px]">
                    {group.dedicatedEquipment.map((eq, i) => (
                      <div key={i} className="flex items-center gap-1 text-[11px] text-slate-700 dark:text-slate-300">
                        <Cpu className="w-3 h-3 text-blue-500 shrink-0" />
                        <span className="truncate">{eq.equipmentType}</span>
                      </div>
                    ))}
                    <div className="text-[11px] text-slate-400 font-mono">
                      {group.dedicatedEquipment[0]?.machineHourlyCost}元/h · 标{group.dedicatedEquipment[0]?.standardHoursPerCase}h
                    </div>
                  </td>

                  {/* 核算病案数 */}
                  <td className="py-3 px-3 text-right font-mono tabular-nums text-slate-800 dark:text-slate-200 font-medium">
                    {stat.totalCases}
                  </td>

                  {/* 医保统筹标额 */}
                  <td className="py-3 px-3 text-right font-mono tabular-nums text-slate-600 dark:text-slate-400">
                    ¥{group.benchmarkPayment.toLocaleString()}
                  </td>

                  {/* 例均医疗总费用 */}
                  <td className="py-3 px-3 text-right font-mono tabular-nums font-medium text-slate-800 dark:text-slate-200">
                    ¥{avgCost.toLocaleString()}
                  </td>

                  {/* 例均专机成本 */}
                  <td className="py-3 px-3 text-right font-mono tabular-nums text-indigo-600 dark:text-indigo-400 font-medium">
                    ¥{avgEqCost.toLocaleString()}
                  </td>

                  {/* 例均专耗支出 */}
                  <td className="py-3 px-3 text-right font-mono tabular-nums text-slate-800 dark:text-slate-200">
                    ¥{avgConCost.toLocaleString()}
                  </td>

                  {/* 例均医保结余 */}
                  <td className="py-3 px-3 text-right font-mono tabular-nums font-semibold">
                    <span className={isProfit ? 'text-teal-600 dark:text-teal-400' : 'text-rose-600 dark:text-rose-400'}>
                      {isProfit ? '+' : ''}¥{avgNetBal.toLocaleString()}
                    </span>
                  </td>

                  {/* 专耗钩稽状态 */}
                  <td className="py-3 px-3 text-center">
                    {(() => {
                      const groupAlerts = alerts.filter(a => a.drgCode === group.drgCode);
                      const targetAlert = groupAlerts[0];
                      const hasRed = groupAlerts.some(a => a.alertLevel === 'red');
                      const hasAmber = groupAlerts.some(a => a.alertLevel === 'amber');

                      return (
                        <div className="flex flex-col items-center gap-1">
                          {hasRed ? (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (targetAlert && onDrillDownAlert) onDrillDownAlert(targetAlert);
                                else onSelectGroup(group);
                              }}
                              className="inline-flex items-center gap-1 text-[10px] text-rose-700 dark:text-rose-300 font-bold bg-rose-100 dark:bg-rose-900/60 hover:bg-rose-200 px-2 py-0.5 rounded cursor-pointer transition"
                              title="点击穿透下钻该病组单机耗材超标详细费用构成与维保记录"
                            >
                              <ShieldAlert className="w-3 h-3 text-rose-600" />
                              <span>单机耗材超标预警 · 下钻</span>
                            </button>
                          ) : hasAmber ? (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (targetAlert && onDrillDownAlert) onDrillDownAlert(targetAlert);
                                else onSelectGroup(group);
                              }}
                              className="inline-flex items-center gap-1 text-[10px] text-amber-700 dark:text-amber-300 font-bold bg-amber-100 dark:bg-amber-900/60 hover:bg-amber-200 px-2 py-0.5 rounded cursor-pointer transition"
                              title="点击穿透下钻该病组单机偏离详细费用构成与维保记录"
                            >
                              <AlertTriangle className="w-3 h-3 text-amber-600" />
                              <span>单机偏离基线预警 · 下钻</span>
                            </button>
                          ) : null}

                          {stat.anomalies === 0 ? (
                            <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>完全吻合</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] text-rose-600 dark:text-rose-400 font-medium">
                              <ShieldAlert className="w-3.5 h-3.5" />
                              <span>{stat.anomalies}例待核验</span>
                            </span>
                          )}
                        </div>
                      );
                    })()}
                  </td>

                  {/* 操作 */}
                  <td className="py-3 px-3 text-center">
                    <button
                      onClick={() => onSelectGroup(group)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded border border-blue-200 dark:border-blue-800 transition-colors"
                    >
                      <span>穿透明细</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
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

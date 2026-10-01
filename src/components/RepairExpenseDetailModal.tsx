import React, { useState } from 'react';
import { MedicalEquipment, RepairRecord } from '../types';
import { Coins, Calendar, X, FileText, ChevronRight, Filter, Landmark } from 'lucide-react';
import { MonthlyFinanceReportModal } from './MonthlyFinanceReportModal';

interface RepairExpenseDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  equipmentList: MedicalEquipment[];
  timeScope: 'all' | 'year' | 'month' | 'day';
  selectedYear: string;
  selectedMonth: string;
  selectedDate: string;
}

export const RepairExpenseDetailModal: React.FC<RepairExpenseDetailModalProps> = ({
  isOpen,
  onClose,
  equipmentList,
  timeScope,
  selectedYear,
  selectedMonth,
  selectedDate,
}) => {
  const [isFinanceModalOpen, setIsFinanceModalOpen] = useState(false);

  if (!isOpen) return null;

  // Collect all repair records with equipment info
  const allRecords: Array<{ record: RepairRecord; equipment: MedicalEquipment }> = [];
  equipmentList.forEach((eq) => {
    eq.repairRecords?.forEach((rec) => {
      allRecords.push({ record: rec, equipment: eq });
    });
  });

  // Filter records based on selected time scope
  const filteredRecords = allRecords.filter(({ record }) => {
    const rDate = record.faultDate || record.completionDate || '';
    if (!rDate) return false;

    // Normalizing YYYY/MM/DD to YYYY-MM-DD
    const normalized = rDate.replace(/\//g, '-');

    if (timeScope === 'all') return true;
    if (timeScope === 'year') {
      return normalized.startsWith(selectedYear);
    }
    if (timeScope === 'month') {
      return normalized.startsWith(selectedMonth);
    }
    if (timeScope === 'day') {
      return normalized === selectedDate;
    }
    return true;
  });

  // Calculate statistics
  const totalExpense = filteredRecords.reduce((sum, item) => sum + (item.record.cost || 0), 0);
  const totalCount = filteredRecords.length;
  const avgExpense = totalCount > 0 ? Math.round(totalExpense / totalCount) : 0;

  // Group by department
  const deptStats: Record<string, number> = {};
  filteredRecords.forEach(({ record, equipment }) => {
    const dept = equipment.department || '未分配科室';
    deptStats[dept] = (deptStats[dept] || 0) + (record.cost || 0);
  });

  // Scope Label
  const getScopeLabel = () => {
    if (timeScope === 'all') return '全期累计（建档至今）';
    if (timeScope === 'year') return `${selectedYear}年度`;
    if (timeScope === 'month') return `${selectedMonth}月份`;
    if (timeScope === 'day') return `${selectedDate} 当日`;
    return '自定义范围';
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-bold">
              <Coins className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                维修支出费用明细台账
                <span className="text-xs font-normal px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {getScopeLabel()}
                </span>
              </h3>
              <p className="text-xs text-slate-300">
                统计维保服务与零配件更换成本，提供多时间粒度查询
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsFinanceModalOpen(true)}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
              title="按月生成提交财务科的付款资金准备请款单（如截至8月底结算）"
            >
              <Landmark className="w-3.5 h-3.5" />
              <span>财务付款资金请款单</span>
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white hover:bg-slate-800 p-1.5 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200">
              <p className="text-xs text-slate-500 font-semibold mb-1">支出总金额 ({getScopeLabel()})</p>
              <div className="text-2xl font-bold text-slate-800 flex items-baseline gap-1">
                <span className="text-sm text-slate-500 font-semibold">￥</span>
                <span>{totalExpense.toLocaleString()}</span>
              </div>
            </div>
            <div className="bg-blue-50/60 p-3.5 rounded-lg border border-blue-100">
              <p className="text-xs text-blue-700 font-semibold mb-1">工单笔数</p>
              <div className="text-2xl font-bold text-blue-900">
                {totalCount} <span className="text-xs font-normal text-blue-700">笔</span>
              </div>
            </div>
            <div className="bg-emerald-50/60 p-3.5 rounded-lg border border-emerald-100">
              <p className="text-xs text-emerald-700 font-semibold mb-1">平均单笔开支</p>
              <div className="text-2xl font-bold text-emerald-900 flex items-baseline gap-1">
                <span className="text-sm text-emerald-700 font-semibold">￥</span>
                <span>{avgExpense.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Department Expense Distribution */}
          {Object.keys(deptStats).length > 0 && (
            <div className="bg-white p-4 rounded-lg border border-slate-200">
              <h4 className="text-xs font-bold text-slate-700 mb-3 flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-slate-500" />
                各科室支出分布
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {Object.entries(deptStats).map(([dept, cost]) => (
                  <div key={dept} className="p-2.5 bg-slate-50 rounded border border-slate-100">
                    <div className="text-xs text-slate-600 font-medium truncate">{dept}</div>
                    <div className="text-sm font-bold text-slate-800 mt-0.5">
                      ￥{cost.toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Detail List */}
          <div>
            <h4 className="text-xs font-bold text-slate-700 mb-2.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-slate-500" />
                维修费用明细清单 ({filteredRecords.length} 笔)
              </span>
            </h4>

            {filteredRecords.length === 0 ? (
              <div className="py-12 text-center text-slate-400 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                <Calendar className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                <p className="text-sm">该时间段内暂无维修支出记录</p>
              </div>
            ) : (
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">工单/日期</th>
                      <th className="py-2.5 px-3">设备名称 / ID</th>
                      <th className="py-2.5 px-3">使用科室</th>
                      <th className="py-2.5 px-3">维修类型</th>
                      <th className="py-2.5 px-3">更换配件 / 故障描述</th>
                      <th className="py-2.5 px-3 text-right">费用 (元)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredRecords.map(({ record, equipment }) => (
                      <tr key={record.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-2.5 px-3">
                          <div className="font-mono text-slate-700 font-medium">{record.faultDate}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{record.id}</div>
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="font-medium text-slate-800">{equipment.name}</div>
                          <div className="text-[10px] text-slate-400 font-mono">ID: {equipment.id} | SN: {equipment.sn}</div>
                        </td>
                        <td className="py-2.5 px-3 text-slate-700 font-medium">
                          {equipment.department}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                            record.repairType === '紧急故障维修' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                            record.repairType === '定期预防性保养' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                            'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}>
                            {record.repairType}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-600 max-w-[200px] truncate" title={record.faultDescription}>
                          {record.partsReplaced ? (
                            <span className="text-slate-800 font-medium">【配件】{record.partsReplaced}</span>
                          ) : (
                            record.faultDescription
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-slate-900 font-mono text-sm">
                          ￥{(record.cost || 0).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={() => setIsFinanceModalOpen(true)}
            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-md transition shadow-2xs flex items-center gap-1.5 cursor-pointer"
          >
            <Landmark className="w-3.5 h-3.5" />
            <span>生成提交财务科的月度请款单 (如截至8月底)</span>
          </button>

          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-md transition shadow-2xs cursor-pointer"
          >
            关闭账单明细
          </button>
        </div>
      </div>

      {/* 财务请款单模态框 */}
      <MonthlyFinanceReportModal
        isOpen={isFinanceModalOpen}
        onClose={() => setIsFinanceModalOpen(false)}
        equipmentList={equipmentList}
        initialYear={selectedYear || '2026'}
        initialMonth={selectedMonth || '08'}
        initialScopeMode={timeScope === 'month' ? 'single_month' : 'cumulative_month_end'}
      />
    </div>
  );
};

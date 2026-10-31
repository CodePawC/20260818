import React, { useState } from 'react';
import { DrgGroupMaster, DedicatedEquipmentAuditSummary, DrgCaseAuditRecord, DrgAuditStatus } from '../../types/drgTypes';
import { X, Printer, ShieldAlert, CheckCircle2, AlertTriangle, AlertCircle, Cpu, Package, FileText, Search, User, Calendar } from 'lucide-react';

interface DrgAuditDrillDownDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  selectedGroup: DrgGroupMaster | null;
  selectedEquipment: DedicatedEquipmentAuditSummary | null;
  cases: DrgCaseAuditRecord[];
  onUpdateCaseStatus?: (caseId: string, newStatus: DrgAuditStatus, note: string) => void;
}

export const DrgAuditDrillDownDrawer: React.FC<DrgAuditDrillDownDrawerProps> = ({
  isOpen,
  onClose,
  selectedGroup,
  selectedEquipment,
  cases,
  onUpdateCaseStatus
}) => {
  const [filterAnomalyOnly, setFilterAnomalyOnly] = useState(false);
  const [searchWord, setSearchWord] = useState('');
  const [activeCaseDetail, setActiveCaseDetail] = useState<DrgCaseAuditRecord | null>(null);

  if (!isOpen) return null;

  // 筛选属于当前病组或当前设备的病案
  const matchedCases = cases.filter(c => {
    if (selectedGroup && c.drgCode !== selectedGroup.drgCode) return false;
    if (selectedEquipment && c.equipmentInternalNo !== selectedEquipment.internalNo) return false;
    if (filterAnomalyOnly && c.auditStatus === 'normal') return false;
    if (searchWord.trim()) {
      const w = searchWord.toLowerCase();
      return (
        c.caseId.toLowerCase().includes(w) ||
        c.patientName.toLowerCase().includes(w) ||
        c.equipmentInternalNo.toLowerCase().includes(w) ||
        c.consumableBarcode.toLowerCase().includes(w)
      );
    }
    return true;
  });

  const title = selectedGroup 
    ? `【${selectedGroup.drgCode}】${selectedGroup.drgName} · 专机专耗流水分摊明细`
    : selectedEquipment 
      ? `【${selectedEquipment.internalNo}】${selectedEquipment.equipmentName} · 临床开机与耗材核验流水`
      : '专机专耗穿透审计明细';

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end bg-slate-900/50 backdrop-blur-xs transition-opacity animate-fade-in">
      <div className="w-full max-w-4xl bg-white dark:bg-slate-800 shadow-2xl h-full flex flex-col border-l border-slate-200 dark:border-slate-700">
        {/* 顶部标题栏 */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between bg-slate-50/60 dark:bg-slate-900/40">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-500" />
              <span>{title}</span>
            </h2>
            <div className="text-xs text-slate-500 mt-1 flex items-center gap-2">
              <span>共检索到 {matchedCases.length} 份临床核算病案</span>
              <span>·</span>
              <span>对标三甲医院医工质控与DRG专耗核验标准</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>打印质控评价单</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 过滤条 */}
        <div className="px-5 py-2.5 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="relative w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchWord}
                onChange={(e) => setSearchWord(e.target.value)}
                placeholder="搜索病案号/患者/条码..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
              />
            </div>
            <label className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={filterAnomalyOnly}
                onChange={(e) => setFilterAnomalyOnly(e.target.checked)}
                className="rounded border-slate-300 text-rose-600 focus:ring-rose-500"
              />
              <span className="text-rose-600 dark:text-rose-400 font-medium">仅查看钩稽异常病案</span>
            </label>
          </div>

          <div className="text-slate-500">
            异常率: <span className="font-mono font-bold text-rose-600">{matchedCases.filter(c => c.auditStatus !== 'normal').length}</span> / {matchedCases.length}
          </div>
        </div>

        {/* 中间流水滚动列表 */}
        <div className="flex-1 overflow-y-auto p-5 divide-y divide-slate-100 dark:divide-slate-800 space-y-3">
          {matchedCases.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              暂无匹配的住院病案专耗核验记录
            </div>
          ) : (
            matchedCases.map(c => {
              const isNormal = c.auditStatus === 'normal';
              const isMissingConsumable = c.auditStatus === 'missing_consumable';
              const isMissingEqLog = c.auditStatus === 'missing_equipment_log';
              const isOverConsumed = c.auditStatus === 'over_consumed';

              return (
                <div 
                  key={c.id} 
                  className={`pt-3 pb-3 rounded-lg p-3 transition-colors ${
                    !isNormal 
                      ? 'bg-rose-50/40 dark:bg-rose-950/20 border border-rose-200/80 dark:border-rose-800/40' 
                      : 'hover:bg-slate-50 dark:hover:bg-slate-750 border border-transparent'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    {/* 左侧基本信息 */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs text-slate-900 dark:text-white">
                          {c.caseId}
                        </span>
                        <span className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                          {c.patientName}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {c.departmentName} · {c.attendingDoctor}
                        </span>
                        <span className="text-[11px] text-slate-500 font-mono">
                          住院{c.losDays}天 ({c.admissionDate} ~ {c.dischargeDate})
                        </span>
                      </div>

                      {/* 设备开机与专耗钩稽 */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-1 text-xs">
                        <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                          <Cpu className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                          <span className="truncate">{c.equipmentInternalNo} ({c.actualEquipmentHours}h)</span>
                        </div>
                        <div className="text-slate-600 dark:text-slate-400 font-mono">
                          分摊设备费: <span className="text-indigo-600 dark:text-indigo-400 font-medium">¥{c.allocatedEquipmentCost}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                          <Package className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          <span>实销耗材: {c.consumableQuantity}套 (标{c.standardExpectedQuantity})</span>
                        </div>
                        <div className="text-slate-600 dark:text-slate-400 font-mono">
                          专耗总额: <span className="text-slate-900 dark:text-white font-medium">¥{c.actualConsumablesCost}</span>
                        </div>
                      </div>

                      {/* UDI条码 */}
                      <div className="text-[11px] text-slate-400 font-mono pt-0.5">
                        耗材UDI码: {c.consumableBarcode}
                      </div>

                      {/* 异常原因与处置建议 */}
                      {c.anomalyReason && (
                        <div className="mt-2 p-2 bg-rose-100/60 dark:bg-rose-900/30 rounded border border-rose-200 dark:border-rose-800 text-[11px] space-y-1">
                          <div className="text-rose-700 dark:text-rose-300 flex items-start gap-1 font-medium">
                            <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                            <span>异常根因: {c.anomalyReason}</span>
                          </div>
                          {c.reconciliationAction && (
                            <div className="text-slate-600 dark:text-slate-300 pl-4.5">
                              <span>质控整改处置: {c.reconciliationAction}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* 右侧费用与状态徽标 */}
                    <div className="text-right shrink-0">
                      <div className="text-xs font-mono font-bold text-slate-900 dark:text-white">
                        总医疗费 ¥{c.totalHospitalCost.toLocaleString()}
                      </div>
                      <div className="text-[11px] font-mono text-slate-500">
                        统筹支付 ¥{c.insurancePayment.toLocaleString()}
                      </div>
                      <div className={`text-xs font-mono font-semibold mt-0.5 ${c.netBalance >= 0 ? 'text-teal-600 dark:text-teal-400' : 'text-rose-600 dark:text-rose-400'}`}>
                        {c.netBalance >= 0 ? '结余 +' : '超支 '}¥{Math.abs(c.netBalance).toLocaleString()}
                      </div>
                      <div className="mt-2">
                        {isNormal && (
                          <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>钩稽正常</span>
                          </span>
                        )}
                        {isMissingConsumable && (
                          <span className="inline-flex items-center gap-1 text-[11px] text-rose-600 dark:text-rose-400 font-bold bg-rose-100 dark:bg-rose-900/50 px-2 py-0.5 rounded">
                            <ShieldAlert className="w-3.5 h-3.5" />
                            <span>疑似漏记耗材</span>
                          </span>
                        )}
                        {isMissingEqLog && (
                          <span className="inline-flex items-center gap-1 text-[11px] text-amber-600 dark:text-amber-400 font-bold bg-amber-100 dark:bg-amber-900/50 px-2 py-0.5 rounded">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            <span>开机工时脱钩</span>
                          </span>
                        )}
                        {isOverConsumed && (
                          <span className="inline-flex items-center gap-1 text-[11px] text-purple-600 dark:text-purple-400 font-bold bg-purple-100 dark:bg-purple-900/50 px-2 py-0.5 rounded">
                            <AlertCircle className="w-3.5 h-3.5" />
                            <span>专耗用量超标</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* 底部汇总与导出提示 */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-900/60 flex items-center justify-between text-xs text-slate-500">
          <div>
            <span>审核人: 医工处技术质控组 · 医保物价办</span>
            <span className="mx-2">·</span>
            <span>三甲医院医疗器械临床使用安全管理规范第28条合规</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg hover:bg-slate-300 transition-colors"
          >
            关闭返回
          </button>
        </div>
      </div>
    </div>
  );
};

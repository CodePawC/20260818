import React, { useState, useMemo } from 'react';
import {
  EngineeringWorkOrder,
  BiomedicalEngineerProfile
} from '../types/dispatchTypes';
import { recommendEngineerForOrder } from '../utils/dispatchData';
import { X, UserCheck, AlertTriangle, Clock, Wrench, Sparkles, Phone, CheckCircle2, ShieldAlert } from 'lucide-react';

interface DispatchAssignModalProps {
  isOpen: boolean;
  workOrder: EngineeringWorkOrder | null;
  engineers: BiomedicalEngineerProfile[];
  onClose: () => void;
  onConfirmDispatch: (workOrderId: string, engineer: BiomedicalEngineerProfile, notes: string) => void;
}

export const DispatchAssignModal: React.FC<DispatchAssignModalProps> = ({
  isOpen,
  workOrder,
  engineers,
  onClose,
  onConfirmDispatch
}) => {
  if (!isOpen || !workOrder) return null;

  const recommendedEngineer = useMemo(() => {
    return recommendEngineerForOrder(workOrder, engineers);
  }, [workOrder, engineers]);

  const [selectedEngineerId, setSelectedEngineerId] = useState<string>(
    recommendedEngineer?.id || engineers[0]?.id || ''
  );
  const [dispatchNotes, setDispatchNotes] = useState<string>(() => {
    if (workOrder.priority === 'P1_CRITICAL') {
      return '急救生命支持高风险抢救设备！请携带急修检测箱与原厂核心配件，务必在15分钟内到场响应排查！';
    }
    if (workOrder.priority === 'P2_URGENT') {
      return '临床关键在用诊断设备，请在30分钟内到场，尽快排除故障恢复检查。';
    }
    return '请工程师排查设备故障，按规范执行电气安全与性能测试后交由科室核实验收。';
  });

  const selectedEngineer = engineers.find(e => e.id === selectedEngineerId);

  // Group engineers by match
  const matchedGroupEngineers = engineers.filter(e => e.group === workOrder.biomedicalGroup);
  const otherEngineers = engineers.filter(e => e.group !== workOrder.biomedicalGroup);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEngineer) return;
    onConfirmDispatch(workOrder.id, selectedEngineer, dispatchNotes);
  };

  const isP1 = workOrder.priority === 'P1_CRITICAL';
  const isP2 = workOrder.priority === 'P2_URGENT';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className={`px-4 py-3 text-white flex items-center justify-between shrink-0 ${
          isP1 ? 'bg-gradient-to-r from-rose-600 to-red-700' :
          isP2 ? 'bg-gradient-to-r from-amber-600 to-orange-700' :
          'bg-gradient-to-r from-blue-700 to-indigo-800'
        }`}>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center shrink-0">
              {isP1 ? <ShieldAlert className="w-4.5 h-4.5 text-white animate-pulse" /> : <UserCheck className="w-4.5 h-4.5 text-white" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold">医工调度中心 · 派工指派单</h3>
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-white/20 text-white font-mono">
                  {workOrder.id}
                </span>
                <span className="text-2xs text-white/90">
                  (响应SLA限: {workOrder.slaResponseLimitMinutes}分钟 | 修复SLA限: {workOrder.slaRepairLimitHours}h)
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body - Horizontal 2 Columns */}
        <form onSubmit={handleSubmit} className="p-4 flex-1 min-h-0 overflow-y-auto flex flex-col justify-between space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 flex-1 min-h-0">
            {/* Left Column: Work Order Summary & AI Recommendation */}
            <div className="space-y-2.5 flex flex-col">
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-2 text-xs flex-1">
                <div className="flex items-center justify-between flex-wrap gap-1.5 pb-2 border-b border-slate-200/70">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-800">{workOrder.equipmentName}</span>
                    {workOrder.internalNo && (
                      <span className="px-1.5 py-0.2 rounded bg-blue-100 text-blue-800 font-mono font-bold text-2xs">
                        {workOrder.internalNo}
                      </span>
                    )}
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-2xs font-bold ${
                    isP1 ? 'bg-rose-100 text-rose-700 border border-rose-200' :
                    isP2 ? 'bg-amber-100 text-amber-700 border border-amber-200' :
                    'bg-blue-100 text-blue-700 border border-blue-200'
                  }`}>
                    {workOrder.priority === 'P1_CRITICAL' ? 'P1 特急 / 急救抢救' :
                     workOrder.priority === 'P2_URGENT' ? 'P2 紧急 / 关键医技' :
                     workOrder.priority === 'P3_STANDARD' ? 'P3 常规 / 病房诊疗' : 'P4 计划 / PM维保'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-1.5 text-2xs text-slate-600">
                  <div>
                    <span className="text-slate-400">报修科室：</span>
                    <strong className="text-slate-800">{workOrder.department}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400">设备位置：</span>
                    <span className="text-slate-700">{workOrder.location}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">设备SN：</span>
                    <span className="font-mono text-slate-700">{workOrder.equipmentSn}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">报修人：</span>
                    <span className="text-slate-800 font-medium">{workOrder.reporterName} ({workOrder.reporterPhone})</span>
                  </div>
                </div>

                <div className="bg-white p-2 rounded border border-slate-200 text-slate-700 text-2xs">
                  <div className="font-semibold text-slate-900 mb-0.5 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 text-amber-500" />
                    <span>临床故障现象：</span>
                  </div>
                  <p className="text-slate-600 leading-relaxed">{workOrder.faultDescription}</p>
                </div>
              </div>

              {/* Smart Recommendation */}
              <div className="p-2.5 rounded-lg bg-indigo-50 border border-indigo-200 text-xs flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
                  <div>
                    <div className="font-bold text-indigo-900 text-2xs">所属技术组：{workOrder.biomedicalGroup}</div>
                    {recommendedEngineer && (
                      <p className="text-indigo-700 text-2xs mt-0.5">
                        智能推荐对口工程师：<strong>{recommendedEngineer.name}</strong> ({recommendedEngineer.title} · 当前负荷 {recommendedEngineer.currentWOCount}单)
                      </p>
                    )}
                  </div>
                </div>
                {recommendedEngineer && (
                  <button
                    type="button"
                    onClick={() => setSelectedEngineerId(recommendedEngineer.id)}
                    className="px-2 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-2xs font-bold transition shrink-0 cursor-pointer shadow-2xs"
                  >
                    一键选用
                  </button>
                )}
              </div>
            </div>

            {/* Right Column: Engineer Selection List & Dispatch Notes */}
            <div className="space-y-2.5 flex flex-col">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  选择负责工程师 <span className="text-rose-500">*</span>
                </label>
                <div className="max-h-52 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin scrollbar-thumb-slate-200">
                  {matchedGroupEngineers.map((eng) => {
                    const isSelected = selectedEngineerId === eng.id;
                    const isRecommended = recommendedEngineer?.id === eng.id;
                    return (
                      <div
                        key={eng.id}
                        onClick={() => setSelectedEngineerId(eng.id)}
                        className={`p-2 rounded-lg border text-xs flex items-center justify-between transition cursor-pointer ${
                          isSelected
                            ? 'border-indigo-600 bg-indigo-50/60 shadow-xs ring-1 ring-indigo-500'
                            : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div className={`w-7 h-7 rounded-full text-white font-bold text-xs flex items-center justify-center shrink-0 ${eng.avatarColor}`}>
                            {eng.name[0]}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-slate-900 text-xs">{eng.name}</span>
                              <span className="text-2xs text-slate-500 font-mono">({eng.employeeNo})</span>
                              {isRecommended && (
                                <span className="text-[10px] px-1 py-0.2 rounded bg-amber-100 text-amber-800 font-bold">
                                  推荐
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-2xs text-slate-500 mt-0.5">
                              <span>MTTR: <strong className="font-mono">{eng.avgMttrHours}h</strong></span>
                              <span>满意度: <strong className="font-mono text-amber-600">{eng.avgSatisfactionScore}</strong></span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                            eng.status === 'idle' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {eng.status === 'idle' ? '空闲' : `${eng.currentWOCount}单`}
                          </span>
                          <input
                            type="radio"
                            name="assignedEngineer"
                            checked={isSelected}
                            onChange={() => setSelectedEngineerId(eng.id)}
                            className="w-3.5 h-3.5 text-indigo-600 focus:ring-indigo-500"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Dispatch Notes */}
              <div>
                <label className="block text-2xs font-bold text-slate-700 mb-0.5">
                  调度派工说明 / 抢修要求指令
                </label>
                <textarea
                  value={dispatchNotes}
                  onChange={(e) => setDispatchNotes(e.target.value)}
                  rows={2}
                  className="w-full text-xs p-2 bg-slate-50/60 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  placeholder="输入给工程师的调度说明，如携带专用备件、安全防护建议..."
                />
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={!selectedEngineer}
              className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>确认指派并启动响应SLA计时</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

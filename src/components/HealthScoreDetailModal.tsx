import React from 'react';
import { MedicalEquipment } from '../types';
import { getEquipmentHealthScore, HealthScoreDeduction } from '../utils/equipmentUtils';
import {
  Sparkles,
  X,
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle2,
  Scale,
  Calendar,
  Wrench,
  Activity,
  ArrowRight,
  ShieldAlert,
  HelpCircle
} from 'lucide-react';

interface HealthScoreDetailModalProps {
  isOpen: boolean;
  equipment: MedicalEquipment | null;
  onClose: () => void;
  onAddRepairForDevice?: (item: MedicalEquipment) => void;
  onChangeStatusForDevice?: (item: MedicalEquipment) => void;
  onViewDetails?: (item: MedicalEquipment) => void;
}

export const HealthScoreDetailModal: React.FC<HealthScoreDetailModalProps> = ({
  isOpen,
  equipment,
  onClose,
  onAddRepairForDevice,
  onChangeStatusForDevice,
  onViewDetails,
}) => {
  if (!isOpen || !equipment) return null;

  const hInfo = getEquipmentHealthScore(equipment);
  const totalDeducted = 100 - hInfo.score;

  const getRiskIcon = (riskTag: HealthScoreDeduction['riskTag']) => {
    switch (riskTag) {
      case 'CRITICAL':
        return <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />;
      case 'WARNING':
        return <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />;
      case 'INFO':
      default:
        return <Info className="w-4 h-4 text-blue-600 shrink-0" />;
    }
  };

  const getCategoryBadgeClass = (category: HealthScoreDeduction['category']) => {
    switch (category) {
      case '强检校准':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case '使用年限':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case '运行状态':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      case '巡检节点':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case '维保历史':
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg text-white">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold tracking-tight">AI 设备健康得分分析与归因</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
                  透明化诊断卡片
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                全量风险扣分项可追溯 · 告别“黑盒”算法
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            title="关闭窗口"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body - Scrollable */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 scrollbar-thin scrollbar-thumb-slate-200">
          
          {/* Equipment Info Summary Banner */}
          <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  ID: {equipment.id}
                </span>
                <span className="text-sm font-bold text-slate-900">{equipment.name}</span>
                {equipment.model && (
                  <span className="text-xs text-slate-500 font-mono">({equipment.model})</span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 mt-1.5">
                <span>科室: <b className="text-slate-800">{equipment.department || '-'}</b></span>
                {equipment.sn && <span>SN: <b className="font-mono text-slate-800">{equipment.sn}</b></span>}
                {equipment.building && (
                  <span>位置: <b className="text-slate-800">{equipment.building} {equipment.floor}</b></span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${hInfo.badgeBg}`}>
                运行状态: {equipment.status}
              </span>
            </div>
          </div>

          {/* AI Score Overview Metric */}
          <div className={`p-4 rounded-xl border ${hInfo.borderClass} bg-gradient-to-br from-white to-slate-50 flex items-center justify-between gap-4 shadow-2xs`}>
            <div className="flex items-center gap-4">
              <div className="relative flex items-center justify-center">
                <div className={`w-16 h-16 rounded-2xl flex flex-col items-center justify-center border-2 shadow-inner ${hInfo.badgeBg}`}>
                  <span className={`text-2xl font-black font-mono leading-none ${hInfo.textColor}`}>
                    {hInfo.score}
                  </span>
                  <span className="text-[10px] text-slate-500 font-medium mt-0.5">/ 100分</span>
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <span className={`text-base font-bold ${hInfo.textColor}`}>
                    健康评级: {hInfo.label}
                  </span>
                  <span className="text-xs font-semibold text-slate-500">
                    (基准满分 100 分)
                  </span>
                </div>
                <div className="w-48 bg-slate-200 h-2 rounded-full overflow-hidden mt-2">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${hInfo.progressBg}`}
                    style={{ width: `${Math.max(5, hInfo.score)}%` }}
                  ></div>
                </div>
                <p className="text-xs text-slate-500 mt-1.5">
                  {totalDeducted > 0
                    ? `已检测到 ${hInfo.deductions.length} 项风险扣分因子，累计扣除 ${totalDeducted} 分`
                    : '设备各项检测与指标良好，无风险扣分'}
                </p>
              </div>
            </div>

            {/* Quick Action Badge if critical */}
            {hInfo.score < 60 && (
              <div className="hidden sm:flex flex-col items-end gap-1">
                <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-700 bg-rose-100 px-2.5 py-1 rounded-lg border border-rose-200">
                  <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                  高风险级别警示
                </span>
                <span className="text-[10px] text-slate-500">建议优先排查计量与年限风险</span>
              </div>
            )}
          </div>

          {/* Deductions Breakdown Table */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-blue-600" />
                扣分明细与因果穿透卡片 ({hInfo.deductions.length} 项)
              </h4>
              <span className="text-xs text-slate-400 font-mono">基准满分: 100分</span>
            </div>

            {hInfo.deductions.length === 0 ? (
              <div className="p-6 bg-emerald-50/60 rounded-xl border border-emerald-200 text-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                <p className="text-sm font-bold text-emerald-900">健康得分极佳 (100分)</p>
                <p className="text-xs text-emerald-700 mt-1">
                  该设备强检定标合规、处于设计年限内、无高频故障且运维巡检正常，未触发任何扣分项。
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {hInfo.deductions.map((item, idx) => (
                  <div
                    key={idx}
                    className={`p-3.5 rounded-xl border transition-all ${
                      item.riskTag === 'CRITICAL'
                        ? 'bg-rose-50/40 border-rose-200 hover:bg-rose-50/80'
                        : item.riskTag === 'WARNING'
                        ? 'bg-amber-50/40 border-amber-200 hover:bg-amber-50/80'
                        : 'bg-slate-50 border-slate-200 hover:bg-slate-100/80'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-2.5">
                        <div className="mt-0.5">{getRiskIcon(item.riskTag)}</div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getCategoryBadgeClass(item.category)}`}>
                              {item.category}
                            </span>
                            <span className="text-xs font-bold text-slate-900">{item.reason}</span>
                          </div>
                          {item.detail && (
                            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                              {item.detail}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="shrink-0 text-right">
                        <span className="text-sm font-black font-mono text-rose-600 bg-rose-100/80 px-2 py-0.5 rounded border border-rose-200">
                          {item.points} 分
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* AI Score Calculation Algorithm Transparency Section */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-2">
            <div className="flex items-center gap-1.5 font-bold text-slate-800">
              <HelpCircle className="w-4 h-4 text-blue-600 shrink-0" />
              <span>AI 健康得分加权扣分规则 (算法显性化说明)</span>
            </div>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-600 pt-1">
              <li className="bg-white p-2 rounded border border-slate-200/80">
                <b className="text-rose-700">⚖️ 强检计量 (一票否决级)</b>：超期 &gt; 1 年高权扣 45 分，超期 90-365 天扣 35 分，超期 1-90 天扣 25 分。
              </li>
              <li className="bg-white p-2 rounded border border-slate-200/80">
                <b className="text-amber-700">⏳ 生产有效期/折旧</b>：超期 &gt; 3 年扣 45 分，超期 1-3 年扣 35 分，已达设计年限扣 25 分。
              </li>
              <li className="bg-white p-2 rounded border border-slate-200/80">
                <b className="text-blue-700">🛠️ 运维状态权重</b>：故障待修扣 40 分，停用待报废扣 60 分，维护保养中扣 15 分。
              </li>
              <li className="bg-white p-2 rounded border border-slate-200/80">
                <b className="text-slate-700">🔧 故障与维保频次</b>：累计维修 &ge; 5 次扣 20 分，维保费用 &gt; 5 万元扣 15 分。
              </li>
            </ul>
          </div>

        </div>

        {/* Modal Footer - Actions */}
        <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2">
            {onViewDetails && (
              <button
                onClick={() => {
                  onClose();
                  onViewDetails(equipment);
                }}
                className="px-3 py-1.5 text-xs font-bold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors shadow-2xs"
              >
                查看完整设备档案
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {onChangeStatusForDevice && (
              <button
                onClick={() => {
                  onClose();
                  onChangeStatusForDevice(equipment);
                }}
                className="px-3 py-1.5 text-xs font-bold text-amber-800 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 transition-colors"
              >
                变更运维状态 / 报废
              </button>
            )}

            {onAddRepairForDevice && (
              <button
                onClick={() => {
                  onClose();
                  onAddRepairForDevice(equipment);
                }}
                className="px-3 py-1.5 text-xs font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-2xs flex items-center gap-1"
              >
                <Wrench className="w-3.5 h-3.5" />
                安排维修/送检
              </button>
            )}

            <button
              onClick={onClose}
              className="px-4 py-1.5 text-xs font-bold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors"
            >
              关闭
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

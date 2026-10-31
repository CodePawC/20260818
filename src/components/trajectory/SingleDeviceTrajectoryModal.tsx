import React, { useMemo } from 'react';
import { MedicalEquipment } from '../../types';
import { TrajectoryEvent, generateFullTrajectoryEvents } from '../../utils/trajectoryData';
import { getEquipmentHealthScore } from '../../utils/equipmentUtils';
import { 
  X, 
  MapPin, 
  Activity, 
  Clock, 
  ShieldCheck, 
  Building2, 
  Printer, 
  ExternalLink, 
  Boxes, 
  Wrench, 
  FileCheck, 
  FileText,
  AlertTriangle,
  QrCode,
  Sparkles
} from 'lucide-react';

interface SingleDeviceTrajectoryModalProps {
  equipment: MedicalEquipment | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenStatusChange?: (device: MedicalEquipment) => void;
  onViewDeviceDetail?: (device: MedicalEquipment) => void;
}

export const SingleDeviceTrajectoryModal: React.FC<SingleDeviceTrajectoryModalProps> = ({
  equipment,
  isOpen,
  onClose,
  onOpenStatusChange,
  onViewDeviceDetail
}) => {
  const health = useMemo(() => equipment ? getEquipmentHealthScore(equipment) : null, [equipment]);

  // 获取该设备的完整变动履历
  const deviceEvents = useMemo(() => {
    if (!equipment) return [];
    const all = generateFullTrajectoryEvents([equipment]);
    return all.filter(e => e.equipmentId === equipment.id);
  }, [equipment]);

  const handlePrint = () => {
    window.print();
  };

  const getEventBadge = (type: TrajectoryEvent['eventType']) => {
    switch (type) {
      case 'spatial_relocation':
        return { label: '空间迁徙/搬迁', bg: 'bg-indigo-50 text-indigo-700 border-indigo-200', icon: MapPin };
      case 'emergency_loan':
        return { label: '急救跨科借调', bg: 'bg-amber-50 text-amber-700 border-amber-200', icon: Boxes };
      case 'metrology_verification':
        return { label: '法定强检定标', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: ShieldCheck };
      case 'factory_repair':
        return { label: '外协/返厂大修', bg: 'bg-purple-50 text-purple-700 border-purple-200', icon: Wrench };
      case 'initial_commissioning':
        return { label: '验收入库投运', bg: 'bg-blue-50 text-blue-700 border-blue-200', icon: FileCheck };
      default:
        return { label: '状态变动演更', bg: 'bg-slate-100 text-slate-700 border-slate-200', icon: Activity };
    }
  };

  if (!isOpen || !equipment || !health) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header Strip */}
        <div className="px-5 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">一机一档 · 全生命周期时空流转档案</h3>
                <span className="px-2 py-0.5 rounded text-2xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
                  三甲合规档案
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                实时追踪该设备从验收入库、空间位移、跨科急救借调至法定强检的全流程数字履历
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition shadow-2xs"
            >
              <Printer className="w-3.5 h-3.5 text-slate-500" />
              打印履历卡
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Equipment Summary Banner */}
        <div className="px-5 py-3.5 bg-gradient-to-r from-blue-50/70 via-indigo-50/40 to-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-white border border-slate-200 flex items-center justify-center shadow-2xs">
              <QrCode className="w-7 h-7 text-blue-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-900">{equipment.name}</span>
                <span className="px-2 py-0.5 rounded-full text-2xs font-mono font-bold bg-slate-100 text-slate-700 border border-slate-300">
                  {equipment.internalNo || equipment.id}
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-600 mt-1 font-medium">
                <span>型号: <strong className="text-slate-800">{equipment.model || '标准型'}</strong></span>
                <span>•</span>
                <span>序列号: <strong className="font-mono text-slate-800">{equipment.sn}</strong></span>
                <span>•</span>
                <span>所属科室: <strong className="text-blue-700">{equipment.department}</strong></span>
              </div>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-3">
            <div className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-right shadow-2xs">
              <div className="text-2xs text-slate-400 font-semibold uppercase">当前健康指数</div>
              <div className="flex items-center justify-end gap-1.5 mt-0.5">
                <span className={`text-base font-extrabold ${health.textColor}`}>
                  {health.score} 分
                </span>
                <span className={`text-2xs font-bold px-1.5 py-0.2 rounded ${health.badgeBg} ${health.textColor}`}>
                  {health.label}
                </span>
              </div>
            </div>

            <div className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-right shadow-2xs">
              <div className="text-2xs text-slate-400 font-semibold uppercase">流转事件总数</div>
              <div className="text-base font-extrabold text-blue-700 mt-0.5">
                {deviceEvents.length} <span className="text-xs font-normal text-slate-500">次</span>
              </div>
            </div>

            <div className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-right shadow-2xs">
              <div className="text-2xs text-slate-400 font-semibold uppercase">当前在册位置</div>
              <div className="text-xs font-bold text-slate-800 mt-0.5 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                <span className="truncate max-w-[140px]">{equipment.location || `${equipment.building || ''} ${equipment.floor || ''}`}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Timeline Content */}
        <div className="flex-1 min-h-0 overflow-y-auto p-5 sm:p-6 bg-slate-50/60">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-blue-600" />
                时间轴流转记录 ({deviceEvents.length} 个节点)
              </span>
              <span className="text-2xs text-slate-400 font-medium">
                防伪数字指纹存证已生效
              </span>
            </div>

            {deviceEvents.length === 0 ? (
              <div className="bg-white p-12 text-center rounded-xl border border-slate-200 text-slate-400">
                <Activity className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                <p>该设备暂未产生其他流转轨迹</p>
              </div>
            ) : (
              <div className="relative border-l-2 border-blue-200 pl-6 ml-3 space-y-4 py-2">
                {deviceEvents.map((ev, index) => {
                  const badge = getEventBadge(ev.eventType);
                  const Icon = badge.icon;

                  return (
                    <div 
                      key={ev.id || index} 
                      className="relative bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:border-blue-300 hover:shadow-xs transition space-y-2.5"
                    >
                      {/* Timeline Dot */}
                      <div className="absolute -left-[31px] top-4 w-4 h-4 rounded-full bg-blue-600 border-2 border-white ring-2 ring-blue-100 flex items-center justify-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
                      </div>

                      {/* Header */}
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-2xs font-bold border ${badge.bg}`}>
                            <Icon className="w-3 h-3" />
                            {badge.label}
                          </span>
                          <span className="text-sm font-bold text-slate-800">{ev.eventTitle}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>{ev.timestamp}</span>
                        </div>
                      </div>

                      {/* Spatial & Location movement path */}
                      {(ev.fromLocation || ev.toLocation || ev.fromDepartment || ev.toDepartment) && (
                        <div className="bg-slate-50 rounded-lg p-2.5 border border-slate-200/80 text-xs flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="text-slate-400 font-medium">流向路径:</span>
                            <span className="font-semibold text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200">
                              {ev.fromLocation || ev.fromDepartment || '起始在册点'}
                            </span>
                            <span className="text-blue-500 font-bold">➔</span>
                            <span className="font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                              {ev.toLocation || ev.toDepartment || '目标终点'}
                            </span>
                          </div>

                          {ev.voucherNo && (
                            <div className="flex items-center gap-1 text-2xs text-slate-500 font-mono bg-white px-2 py-0.5 rounded border border-slate-200">
                              <span className="text-slate-400">{ev.voucherType || '凭证号'}:</span>
                              <strong className="text-slate-700">{ev.voucherNo}</strong>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Details */}
                      <p className="text-xs text-slate-600 leading-relaxed font-normal">
                        {ev.details}
                      </p>

                      {/* Footer & CA Sign */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-2xs text-slate-500">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-slate-600">经办人员:</span>
                          <span className="font-semibold text-slate-800">{ev.operator}</span>
                          <span className="text-slate-400">({ev.operatorRole})</span>
                        </div>

                        {ev.caSignatureHash && (
                          <div className="flex items-center gap-1.5 font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            <ShieldCheck className="w-3 h-3 text-emerald-600" />
                            <span>存证哈希: {ev.caSignatureHash}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Modal Bottom Actions */}
        <div className="px-5 py-3 border-t border-slate-200 bg-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>符合《医疗器械使用质量管理办法》第15条/第21条台账档案规范</span>
          </div>

          <div className="flex items-center gap-2">
            {onOpenStatusChange && (
              <button
                onClick={() => {
                  onClose();
                  onOpenStatusChange(equipment);
                }}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
              >
                登记新状态变动
              </button>
            )}
            {onViewDeviceDetail && (
              <button
                onClick={() => {
                  onClose();
                  onViewDeviceDetail(equipment);
                }}
                className="px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition shadow-xs flex items-center gap-1"
              >
                <span>查看全息台账档案</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-800 transition"
            >
              关闭
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

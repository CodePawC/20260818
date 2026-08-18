import React from 'react';
import { MedicalEquipment, StatusLog } from '../types';
import { Activity, ShieldCheck, RefreshCw } from 'lucide-react';

interface TrackingViewProps {
  equipmentList: MedicalEquipment[];
  onOpenStatusChange: (device: MedicalEquipment) => void;
}

export const TrackingView: React.FC<TrackingViewProps> = ({
  equipmentList,
  onOpenStatusChange,
}) => {
  // Aggregate all status logs
  const allLogs: (StatusLog & { deviceName: string; deviceSn: string; department: string })[] = [];
  equipmentList.forEach(e => {
    e.statusLogs.forEach(l => {
      allLogs.push({
        ...l,
        deviceName: e.name,
        deviceSn: e.sn,
        department: e.department
      });
    });
  });

  // Sort descending by timestamp/id
  allLogs.sort((a, b) => b.timestamp.localeCompare(a.timestamp));

  return (
    <div className="bg-white rounded-md border border-slate-200 flex-1 flex flex-col overflow-hidden shadow-xs">
      <div className="p-4 border-b border-slate-100 bg-white flex items-center justify-between flex-none">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold shrink-0">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-800">全院设备运行状态变动实时追踪 Status Tracking</h2>
            <p className="text-xs text-slate-500 font-medium">
              透明化变动履历审计（正常运行 / 维护保养中 / 故障待修 / 报废停用）
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6 bg-slate-50/50">
        <div className="max-w-3xl mx-auto space-y-4">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            最新设备状态切换动向 ({allLogs.length} 条轨迹记录)
          </p>

          <div className="relative border-l-2 border-slate-200 pl-6 ml-3 space-y-4 py-2">
            {allLogs.map((log) => (
              <div key={log.id} className="relative bg-white p-4 rounded-lg border border-slate-200 shadow-2xs space-y-2">
                <div className="absolute -left-8 top-5 w-4 h-4 rounded-full bg-blue-600 border-2 border-white ring-2 ring-blue-100"></div>

                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span className="font-mono font-medium text-slate-600">{log.timestamp}</span>
                  <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-600 font-medium">经办人: {log.operator}</span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-800 text-sm">{log.deviceName}</span>
                  <span className="font-mono text-xs text-slate-400">[{log.deviceSn}]</span>
                  <span className="text-xs text-blue-700 bg-blue-50 px-2 py-0.5 rounded font-semibold">{log.department}</span>
                </div>

                <div className="flex items-center gap-3 text-xs font-bold pt-1">
                  <span className="text-slate-400">{log.oldStatus}</span>
                  <span className="text-blue-500">➔</span>
                  <span className={`px-2.5 py-1 rounded-full text-xs ${
                    log.newStatus === '正常运行' ? 'bg-emerald-100 text-emerald-700' :
                    log.newStatus === '维护保养中' ? 'bg-amber-100 text-amber-700' :
                    log.newStatus === '故障待修' ? 'bg-rose-100 text-rose-700' :
                    'bg-slate-100 text-slate-600'
                  }`}>
                    {log.newStatus}
                  </span>
                </div>

                <p className="text-xs text-slate-600 pt-2 border-t border-slate-100 mt-2 font-medium">
                  <strong className="text-slate-700">事由/描述:</strong> {log.reason}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

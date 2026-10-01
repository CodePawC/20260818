import React, { useState, useEffect } from 'react';
import { MedicalEquipment, EquipmentStatus } from '../types';
import { X, RefreshCw, Check, CheckCircle2, AlertTriangle, Sparkles, Wrench } from 'lucide-react';

interface StatusChangeModalProps {
  equipment: MedicalEquipment | null;
  onClose: () => void;
  onSubmitStatusChange: (id: string, newStatus: EquipmentStatus, reason: string, operator: string) => void;
}

export const StatusChangeModal: React.FC<StatusChangeModalProps> = ({
  equipment,
  onClose,
  onSubmitStatusChange,
}) => {
  const isFaulty = equipment?.status === '故障待修';
  const [newStatus, setNewStatus] = useState<EquipmentStatus>('正常运行');
  const [reason, setReason] = useState<string>('');
  const [operator, setOperator] = useState<string>('崔工（医学装备科）');

  useEffect(() => {
    if (equipment) {
      if (equipment.status === '故障待修') {
        // 故障设备默认目标变更为正常运行（便于快速修复故障）
        setNewStatus('正常运行');
        setReason('现场完成故障排查与检修，通电自检通过，故障排除恢复临床正常运行。');
      } else {
        setNewStatus(equipment.status);
        setReason('');
      }
    }
  }, [equipment]);

  if (!equipment) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      alert('请填写状态变更说明与原因！');
      return;
    }
    onSubmitStatusChange(equipment.id, newStatus, reason, operator);
    onClose();
  };

  const handleQuickPreset = (presetText: string) => {
    setReason(presetText);
    setNewStatus('正常运行');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-150">
        <div className={`px-6 py-4 border-b flex items-center justify-between ${
          isFaulty ? 'bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="flex items-center gap-2 text-slate-800 font-bold">
            {isFaulty ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            ) : (
              <RefreshCw className="w-5 h-5 text-blue-600" />
            )}
            <h2>{isFaulty ? '修复设备故障 · 恢复正常运行' : '快速变更设备运行状态'}</h2>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-sm">
          {isFaulty && (
            <div className="p-3 bg-emerald-50/80 border border-emerald-200 rounded-lg flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div className="text-xs text-emerald-900">
                <span className="font-bold">故障快速修复闭环：</span>
                该设备当前处于【故障待修】状态。完成现场维修、定标自检合格后，点击下方确认可直接将状态恢复为【正常运行】并记入全生命周期履历。
              </div>
            </div>
          )}

          <div className="p-3 bg-slate-100 rounded-lg">
            <div className="flex items-center justify-between">
              <p className="font-semibold text-slate-900">{equipment.name}</p>
              <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                isFaulty ? 'bg-rose-100 text-rose-700 border border-rose-200' : 'bg-blue-100 text-blue-700'
              }`}>
                {equipment.status}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-mono mt-0.5">{equipment.sn} | {equipment.department} | {equipment.model}</p>
            {equipment.lastFaultReason && (
              <p className="text-xs text-rose-600 mt-1 font-medium truncate">
                报修故障现象: {equipment.lastFaultReason}
              </p>
            )}
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">调整后目标状态</label>
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value as EquipmentStatus)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="正常运行">● 正常运行（故障已排除/质控合格）</option>
              <option value="维护保养中">▲ 维护保养中</option>
              <option value="故障待修">✕ 故障待修</option>
              <option value="停用/报废">⊘ 停用/报废</option>
            </select>
          </div>

          {isFaulty && (
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 flex items-center gap-1">
                <Wrench className="w-3.5 h-3.5 text-slate-500" />
                <span>快速套用修复结论与原因：</span>
              </label>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => handleQuickPreset('现场完成故障排查与检修，通电自检通过，故障代码消除，恢复临床正常运行。')}
                  className="px-2 py-1 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 border border-slate-200 rounded text-xs text-slate-700 transition cursor-pointer"
                >
                  🛠️ 排查检修修复
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickPreset('已更换损坏的原厂易损配件并重新定标校验，各项质控检测合格，恢复临床正常使用。')}
                  className="px-2 py-1 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 border border-slate-200 rounded text-xs text-slate-700 transition cursor-pointer"
                >
                  ⚙️ 更换配件修复
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickPreset('临床现场自查管路与电极导联连接，排除误报警假故障，自检正常恢复使用。')}
                  className="px-2 py-1 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 border border-slate-200 rounded text-xs text-slate-700 transition cursor-pointer"
                >
                  🔍 自查排除假故障
                </button>
              </div>
            </div>
          )}

          <div>
            <label className="block font-medium text-slate-700 mb-1">
              状态变更原因与修复说明 <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="例：完成例行季度PM保养，定标合格恢复临床使用；或现场排除开机报错代码，自检通过恢复临床运行..."
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
            />
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">经办人 / 责任工程师</label>
            <input
              type="text"
              value={operator}
              onChange={(e) => setOperator(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
            />
          </div>

          <div className="pt-3 border-t border-slate-200 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 text-slate-700 rounded-md hover:bg-slate-50 font-medium transition cursor-pointer"
            >
              取消
            </button>
            <button
              type="submit"
              className={`px-5 py-2 text-white rounded-md font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer ${
                isFaulty && newStatus === '正常运行'
                  ? 'bg-emerald-600 hover:bg-emerald-700 active:scale-95'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              <Check className="w-4 h-4" />
              <span>{isFaulty && newStatus === '正常运行' ? '确认修复故障 · 恢复正常运行' : '确认变更状态'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

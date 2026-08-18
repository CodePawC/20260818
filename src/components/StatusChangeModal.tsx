import React, { useState, useEffect } from 'react';
import { MedicalEquipment, EquipmentStatus } from '../types';
import { X, RefreshCw, Check } from 'lucide-react';

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
  const [newStatus, setNewStatus] = useState<EquipmentStatus>('正常运行');
  const [reason, setReason] = useState<string>('');
  const [operator, setOperator] = useState<string>('崔工（医学装备科）');

  useEffect(() => {
    if (equipment) {
      setNewStatus(equipment.status);
      setReason('');
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

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-150">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-800 font-bold">
            <RefreshCw className="w-5 h-5 text-blue-600" />
            <h2>快速变更设备运行状态</h2>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-sm">
          <div className="p-3 bg-slate-100 rounded-lg">
            <p className="font-semibold text-slate-900">{equipment.name}</p>
            <p className="text-xs text-slate-500 font-mono mt-0.5">{equipment.sn} | {equipment.department}</p>
            <p className="text-xs text-slate-600 mt-1">
              当前状态: <strong className="text-blue-600">{equipment.status}</strong>
            </p>
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">调整后目标状态</label>
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value as EquipmentStatus)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="正常运行">● 正常运行</option>
              <option value="维护保养中">▲ 维护保养中</option>
              <option value="故障待修">✕ 故障待修</option>
              <option value="停用/报废">⊘ 停用/报废</option>
            </select>
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">
              状态变更原因与备注 <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="例：完成例行季度PM保养，定标合格恢复临床使用；或临床报修显示屏报错挂牌停用..."
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">经办人 / 工程师</label>
            <input
              type="text"
              value={operator}
              onChange={(e) => setOperator(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="pt-3 border-t border-slate-200 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 text-slate-700 rounded-md hover:bg-slate-50 font-medium transition"
            >
              取消
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium transition flex items-center gap-1 shadow-sm"
            >
              <Check className="w-4 h-4" />
              确认变更
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

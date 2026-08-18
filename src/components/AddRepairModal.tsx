import React, { useState, useEffect } from 'react';
import { MedicalEquipment, EquipmentStatus } from '../types';
import { X, Wrench, CheckCircle2 } from 'lucide-react';

interface AddRepairModalProps {
  isOpen: boolean;
  equipmentList: MedicalEquipment[];
  preSelectedDevice?: MedicalEquipment | null;
  onClose: () => void;
  onSubmitRepair: (repairData: any) => void;
}

export const AddRepairModal: React.FC<AddRepairModalProps> = ({
  isOpen,
  equipmentList,
  preSelectedDevice,
  onClose,
  onSubmitRepair,
}) => {
  const [selectedEquipmentId, setSelectedEquipmentId] = useState<string>('');
  const [faultDate, setFaultDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [repairType, setRepairType] = useState<'紧急故障维修' | '定期预防性保养' | '计量校准' | '巡检维护'>('紧急故障维修');
  const [faultDescription, setFaultDescription] = useState<string>('');
  const [technician, setTechnician] = useState<string>('崔工（医学装备科）');
  const [cost, setCost] = useState<number>(0);
  const [partsReplaced, setPartsReplaced] = useState<string>('');
  const [resolution, setResolution] = useState<string>('已现场勘查并报备，排查修复中...');
  const [repairStatus, setRepairStatus] = useState<'处理中' | '已完成' | '待配件'>('处理中');
  const [updateEquipmentStatus, setUpdateEquipmentStatus] = useState<boolean>(true);
  const [newEquipmentStatus, setNewEquipmentStatus] = useState<EquipmentStatus>('故障待修');

  useEffect(() => {
    if (preSelectedDevice) {
      setSelectedEquipmentId(preSelectedDevice.id);
    } else if (equipmentList.length > 0 && !selectedEquipmentId) {
      setSelectedEquipmentId(equipmentList[0].id);
    }
  }, [preSelectedDevice, equipmentList, isOpen]);

  useEffect(() => {
    if (repairStatus === '处理中' || repairStatus === '待配件') {
      setNewEquipmentStatus('故障待修');
    } else if (repairStatus === '已完成') {
      setNewEquipmentStatus('正常运行');
    }
  }, [repairStatus]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEquipmentId) {
      alert('请选择报修设备！');
      return;
    }
    if (!faultDescription.trim()) {
      alert('请填写故障现象描述！');
      return;
    }

    onSubmitRepair({
      equipmentId: selectedEquipmentId,
      faultDate,
      repairType,
      faultDescription,
      technician,
      cost: Number(cost),
      partsReplaced,
      resolution,
      status: repairStatus,
      updateEquipmentStatus,
      newEquipmentStatus
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-amber-50 flex items-center justify-between">
          <div className="flex items-center gap-2 text-amber-900">
            <Wrench className="w-5 h-5 text-amber-600" />
            <h2 className="text-lg font-bold">登记设备维修与保养工单</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 text-sm">
          <div>
            <label className="block font-medium text-slate-700 mb-1">
              报修/维保目标设备 <span className="text-rose-500">*</span>
            </label>
            <select
              value={selectedEquipmentId}
              onChange={(e) => setSelectedEquipmentId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
            >
              {equipmentList.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name} [{e.sn}] - {e.department} ({e.status})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-medium text-slate-700 mb-1">工单类型</label>
              <select
                value={repairType}
                onChange={(e) => setRepairType(e.target.value as any)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="紧急故障维修">紧急故障维修</option>
                <option value="定期预防性保养">定期预防性保养</option>
                <option value="计量校准">计量校准</option>
                <option value="巡检维护">巡检维护</option>
              </select>
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">报修/故障时间</label>
              <input
                type="date"
                value={faultDate}
                onChange={(e) => setFaultDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">
              故障现象与临床反馈描述 <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={3}
              value={faultDescription}
              onChange={(e) => setFaultDescription(e.target.value)}
              placeholder="请详述设备故障表现，例如：开机报警报错Code C-302、显示屏闪烁、按键无响应、测量参数漂移等..."
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-medium text-slate-700 mb-1">维保工程师/服务商</label>
              <input
                type="text"
                value={technician}
                onChange={(e) => setTechnician(e.target.value)}
                placeholder="例：崔工（医工科）/ 迈瑞原厂工程师"
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">预估/结算费用 (元/人民币)</label>
              <input
                type="number"
                value={cost}
                onChange={(e) => setCost(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">更换零部件/耗材明细</label>
            <input
              type="text"
              value={partsReplaced}
              onChange={(e) => setPartsReplaced(e.target.value)}
              placeholder="例：高压板卡、探头防尘套、电源线、过滤网"
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">处理方案与维修结论</label>
            <textarea
              rows={2}
              value={resolution}
              onChange={(e) => setResolution(e.target.value)}
              placeholder="例：已排除电源线路故障，重做质量控制测试，各项功能恢复正常。"
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-medium text-slate-700 mb-1">维保工单状态</label>
              <select
                value={repairStatus}
                onChange={(e) => setRepairStatus(e.target.value as any)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 font-semibold text-slate-800"
              >
                <option value="处理中">处理中</option>
                <option value="待配件">待配件</option>
                <option value="已完成">已完成 (已修复)</option>
              </select>
            </div>

            <div className="p-3 bg-amber-50/80 rounded-md border border-amber-200">
              <label className="flex items-center gap-2 cursor-pointer font-medium text-amber-900">
                <input
                  type="checkbox"
                  checked={updateEquipmentStatus}
                  onChange={(e) => setUpdateEquipmentStatus(e.target.checked)}
                  className="rounded border-amber-400 text-amber-600 focus:ring-amber-500"
                />
                同步联动设备运行状态
              </label>
              {updateEquipmentStatus && (
                <select
                  value={newEquipmentStatus}
                  onChange={(e) => setNewEquipmentStatus(e.target.value as EquipmentStatus)}
                  className="mt-1.5 w-full px-2 py-1 bg-white border border-amber-300 rounded text-xs font-bold text-amber-900"
                >
                  <option value="故障待修">调整为 ➔ 故障待修</option>
                  <option value="维护保养中">调整为 ➔ 维护保养中</option>
                  <option value="正常运行">恢复为 ➔ 正常运行</option>
                  <option value="停用/报废">调整为 ➔ 停用/报废</option>
                </select>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-slate-200 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 text-slate-700 rounded-md hover:bg-slate-50 font-medium transition"
            >
              取消
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-md font-medium transition flex items-center gap-1.5 shadow-sm"
            >
              <CheckCircle2 className="w-4 h-4" />
              提交维保记录
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

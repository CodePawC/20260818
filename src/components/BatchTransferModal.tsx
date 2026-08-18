import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, 
  Building2, 
  MapPin, 
  Phone, 
  UserCheck, 
  ArrowRight, 
  CheckCircle2, 
  Sparkles,
  Layers,
  ArrowLeftRight,
  ShieldCheck,
  Tag
} from 'lucide-react';
import { 
  MedicalEquipment, 
  DepartmentMaster, 
  StaffPersonMaster,
  CampusMaster,
  BuildingMaster,
  LocationRoomMaster
} from '../types';
import { 
  DepartmentSearchSelect, 
  CascadingSpacePicker, 
  StaffSearchSelect 
} from './StandardMasterDataSelector';

interface BatchTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedEquipment: MedicalEquipment[];
  departments?: DepartmentMaster[];
  staff?: StaffPersonMaster[];
  campuses?: CampusMaster[];
  buildings?: BuildingMaster[];
  rooms?: LocationRoomMaster[];
  onConfirmTransfer: (
    equipmentIds: string[],
    newDept: string,
    newBuilding: string,
    newFloor: string,
    newPhone: string,
    newManager: string,
    reason: string
  ) => void;
}

const REASON_PRESETS = [
  '临床急重症抢救应急调拨支援',
  '病区科室整体空间搬迁调整',
  '闲置医疗资产全院集中流转与优化',
  '新增设医疗病组资产配置',
  '跨科室联合诊疗借用'
];

export const BatchTransferModal: React.FC<BatchTransferModalProps> = ({
  isOpen,
  onClose,
  selectedEquipment,
  departments = [],
  staff = [],
  campuses = [],
  buildings = [],
  rooms = [],
  onConfirmTransfer
}) => {
  const initialDept = departments[0]?.name || '超声科';
  const [targetDept, setTargetDept] = useState(initialDept);
  const [targetBuilding, setTargetBuilding] = useState('1号楼 综合楼');
  const [targetFloor, setTargetFloor] = useState('3F');
  const [targetPhone, setTargetPhone] = useState('7991100');
  const [targetManager, setTargetManager] = useState('崔工');
  const [targetLocation, setTargetLocation] = useState('');
  const [reason, setReason] = useState('临床科室设备协同调拨与应急调配使用');

  // 当选择目标科室时，自动级联主数据
  const handleDepartmentChange = (dept: DepartmentMaster) => {
    setTargetDept(dept.name);
    if (dept.buildingName) setTargetBuilding(dept.buildingName);
    if (dept.defaultFloor) setTargetFloor(dept.defaultFloor);
    if (dept.nursePhone) setTargetPhone(dept.nursePhone);
    if (dept.defaultManager) setTargetManager(dept.defaultManager);
  };

  useEffect(() => {
    if (isOpen && departments.length > 0) {
      const first = departments[0];
      setTargetDept(first.name);
      setTargetBuilding(first.buildingName);
      setTargetFloor(first.defaultFloor);
      setTargetPhone(first.nursePhone);
      setTargetManager(first.defaultManager);
      setTargetLocation('');
    }
  }, [isOpen, departments]);

  // 统计当前选择的设备来源科室分布
  const sourceDeptSummary = useMemo(() => {
    const counts: Record<string, number> = {};
    selectedEquipment.forEach(eq => {
      counts[eq.department] = (counts[eq.department] || 0) + 1;
    });
    return Object.entries(counts).map(([name, count]) => `${name} (${count}台)`).join('、');
  }, [selectedEquipment]);

  if (!isOpen || selectedEquipment.length === 0) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetDept) {
      alert('请选择目标调拨科室！');
      return;
    }
    const ids = selectedEquipment.map((eq) => eq.id);
    onConfirmTransfer(
      ids,
      targetDept,
      targetBuilding,
      targetFloor,
      targetPhone,
      targetManager,
      reason
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-hidden flex flex-col border border-slate-200 animate-in fade-in zoom-in duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-600 text-white rounded-xl shadow-xs">
              <ArrowLeftRight className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <span>批量跨科室资产调拨</span>
                <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-indigo-100 text-indigo-800 font-mono">
                  已选 {selectedEquipment.length} 台
                </span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                基于主数据标准字典进行级联与检索式调拨，调拨后自动联动目标科室的楼宇、分诊电话与责任专管员
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition cursor-pointer p-1.5 rounded-lg hover:bg-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Selected Equipment Chips */}
        <div className="px-6 py-3 bg-slate-100/80 border-b border-slate-200 text-xs flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-slate-500 font-semibold">
            <span className="flex items-center gap-1.5">
              <span>待调拨资产清单 ({selectedEquipment.length}台):</span>
              <span className="text-slate-700 font-normal">来源科室: {sourceDeptSummary}</span>
            </span>
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 no-scrollbar">
            {selectedEquipment.map((eq) => (
              <span
                key={eq.id}
                className="px-2.5 py-1 bg-white border border-slate-300 rounded-lg text-slate-800 font-mono text-[11px] font-semibold whitespace-nowrap shadow-2xs flex items-center gap-1.5"
              >
                <span className="text-indigo-600 font-bold">{eq.id}</span>
                <span className="text-slate-700">{eq.name}</span>
                <span className="text-slate-400">({eq.department})</span>
              </span>
            ))}
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
          {/* 目标科室与责任人 (检索式选择) */}
          <div className="p-4 bg-indigo-50/40 border border-indigo-200 rounded-xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-indigo-100">
              <span className="font-bold text-indigo-950 text-xs flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <span>目标归属组织与责任人 (检索/级联标准化选择)</span>
              </span>
              <span className="text-[10px] text-indigo-700 font-medium">
                主数据强一致联动
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <DepartmentSearchSelect
                departments={departments}
                selectedDepartmentName={targetDept}
                onSelectDepartment={handleDepartmentChange}
                label="目标接收科室 (主数据字典)"
                required
              />

              <StaffSearchSelect
                staff={staff}
                currentDepartmentName={targetDept}
                selectedStaffName={targetManager}
                onSelectStaff={(person) => setTargetManager(person.name)}
                label="新管理责任人 / 专管员"
              />
            </div>

            {/* 楼宇、楼层与分机 */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block font-bold text-slate-800 text-xs mb-1">目标楼宇</label>
                <input
                  type="text"
                  value={targetBuilding}
                  onChange={(e) => setTargetBuilding(e.target.value)}
                  placeholder="例如: 1号楼 综合楼"
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-md text-xs font-medium focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 text-xs mb-1">楼层 (Floor)</label>
                <input
                  type="text"
                  value={targetFloor}
                  onChange={(e) => setTargetFloor(e.target.value)}
                  placeholder="例如: 3F"
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-md text-xs font-mono font-bold text-indigo-900 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 text-xs mb-1 flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-blue-600" />
                  <span>护士站分机</span>
                </label>
                <input
                  type="text"
                  value={targetPhone}
                  onChange={(e) => setTargetPhone(e.target.value)}
                  placeholder="例如: 7991100"
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-md text-xs font-mono font-medium focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* 级联空间选择 */}
            <div className="pt-2 border-t border-indigo-100">
              <CascadingSpacePicker
                campuses={campuses}
                buildings={buildings}
                rooms={rooms}
                currentBuilding={targetBuilding}
                currentFloor={targetFloor}
                currentLocationPath={targetLocation}
                onSelectSpace={(spaceData) => {
                  setTargetBuilding(spaceData.buildingName);
                  setTargetFloor(spaceData.floor);
                  setTargetLocation(spaceData.fullLocationPath);
                  if (spaceData.departmentName) {
                    setTargetDept(spaceData.departmentName);
                  }
                }}
              />
            </div>
          </div>

          {/* 调拨事由与预设模板 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block font-bold text-slate-700 text-xs">调拨事由与备注说明</label>
              <span className="text-[11px] text-slate-400">点击下方常用事由快速填入</span>
            </div>

            <div className="flex flex-wrap gap-1.5 mb-1.5">
              {REASON_PRESETS.map((preset) => (
                <button
                  type="button"
                  key={preset}
                  onClick={() => setReason(preset)}
                  className="px-2 py-0.5 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 border border-slate-200 rounded text-[11px] text-slate-600 transition cursor-pointer"
                >
                  {preset}
                </button>
              ))}
            </div>

            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={2}
              placeholder="请输入本次跨科室资产调拔的具体事由及交接说明..."
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-hidden resize-none"
            />
          </div>

          {/* 调拨效果即时对比摘要 */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-950 flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="font-bold">
                调拨确认就绪: {selectedEquipment.length} 台设备将从原科室调入【{targetDept}】
              </div>
              <div className="text-[11px] text-emerald-800">
                新存放位置: <span className="font-mono font-medium">{targetBuilding} {targetFloor}</span> | 
                对口责任人: <span className="font-semibold">{targetManager}</span> | 
                分诊电话: <span className="font-mono">{targetPhone}</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
            >
              取消
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition cursor-pointer flex items-center gap-1.5"
            >
              <ArrowRight className="w-4 h-4" />
              <span>确认调拨 ({selectedEquipment.length} 台)</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
